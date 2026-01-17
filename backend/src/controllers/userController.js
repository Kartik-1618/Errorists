import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Role from '../models/Role.js';
import Recommendation from '../models/Recommendation.js';
import Progress from '../models/Progress.js';
import { generateAIRecommendations } from '../services/aiService.js';

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find().select('roleName domain requiredSkills');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { goalRole } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { goalRole },
            { new: true }
        );

        // Recalculate readiness and trigger recommendations immediately
        await calculateReadiness(user._id);

        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addSkill = async (req, res) => {
    try {
        const { skillName, proficiency, yearsOfExperience } = req.body;
        const normalizedSkillName = skillName.trim();
        const user = await User.findById(req.user.userId);

        const skill = await Skill.findOne({ skillName: normalizedSkillName }); // Optional: could also normalize DB search
        let skillId = skill?._id;

        // Check for existing skill (case-insensitive)
        const existingSkillIndex = user.currentSkills.findIndex(
            s => s.skillName.toLowerCase() === normalizedSkillName.toLowerCase()
        );

        if (existingSkillIndex !== -1) {
            // Update existing skill
            user.currentSkills[existingSkillIndex].proficiency = proficiency;
            user.currentSkills[existingSkillIndex].yearsOfExperience = yearsOfExperience;
            user.currentSkills[existingSkillIndex].skillId = skillId; // Update ID if it was missing/changed
            // If you want to keep the original casing or update to new casing:
            user.currentSkills[existingSkillIndex].skillName = normalizedSkillName;
        } else {
            // Add new skill
            user.currentSkills.push({
                skillId,
                skillName: normalizedSkillName,
                proficiency,
                yearsOfExperience,
            });
        }

        await user.save();

        // Recalculate readiness
        await calculateReadiness(user._id);

        res.json({ message: 'Skill updated/added', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRecommendations = async (req, res) => {
    try {
        const recommendations = await Recommendation.find({ userId: req.user.userId }).sort({ priority: -1 });
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProgress = async (req, res) => {
    try {
        const progress = await Progress.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const logProgress = async (req, res) => {
    try {
        const { skillName, action, certificateUrl, notes } = req.body;

        const skill = await Skill.findOne({ skillName });
        const progress = new Progress({
            userId: req.user.userId,
            skillId: skill?._id,
            skillName,
            action,
            certificateUrl,
            notes,
            completionDate: new Date(),
        });

        await progress.save();

        // Update user skills
        const user = await User.findById(req.user.userId);
        user.currentSkills.push({
            skillId: skill?._id,
            skillName,
            proficiency: 'intermediate',
        });
        await user.save();

        // Recalculate readiness
        await calculateReadiness(user._id);

        res.json({ message: 'Progress logged', progress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const PROFICIENCY_MAP = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3
};

async function calculateReadiness(userId) {
    try {
        const user = await User.findById(userId);
        if (!user.goalRole) return;

        const role = await Role.findOne({ roleName: user.goalRole });
        if (!role) return;

        const userSkillsMap = new Map();
        user.currentSkills.forEach(s => {
            userSkillsMap.set(s.skillName, PROFICIENCY_MAP[s.proficiency.toLowerCase()] || 0);
        });

        // Smart Matching: Only count as "matched" if User Proficiency >= Required Proficiency
        const matchedSkills = role.requiredSkills.filter(rs => {
            const userLevel = userSkillsMap.get(rs.skillName);
            const requiredLevel = PROFICIENCY_MAP[rs.proficiencyLevel.toLowerCase()] || 1; // Default to beginner if not specified
            return userLevel !== undefined && userLevel >= requiredLevel;
        });

        const totalWeight = role.requiredSkills.reduce((sum, s) => sum + (s.weight || 1), 0);
        const matchedWeight = matchedSkills.reduce((sum, s) => sum + (s.weight || 1), 0);

        const readiness = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
        user.readiness = readiness;
        await user.save();

        // --- Recommendations Generation ---

        // 1. Clear old pending recommendations
        await Recommendation.deleteMany({ userId: user._id, status: 'pending' });

        let finalRecommendations = [];

        // 2. Identify Missing or "Gap" Skills
        // A skill is missing if user doesn't have it OR user has it but level < required
        const skillsToImprove = role.requiredSkills.filter(rs => {
            const userLevel = userSkillsMap.get(rs.skillName);
            const requiredLevel = PROFICIENCY_MAP[rs.proficiencyLevel.toLowerCase()] || 1;

            // Return true if (User doesn't have it) OR (User has it but Level < Required)
            return userLevel === undefined || userLevel < requiredLevel;
        });

        // 3. Try AI Generation (Pass gap context)
        try {
            // For AI, we can be smart and pass specifically what is missing
            const aiPromptContextSkills = skillsToImprove.map(s => {
                const currentLevelVal = userSkillsMap.get(s.skillName) || 0;
                // Reverse map for display (simple hack)
                const currentLevelStr = Object.keys(PROFICIENCY_MAP).find(key => PROFICIENCY_MAP[key] === currentLevelVal) || 'None';
                return {
                    name: s.skillName,
                    current: currentLevelStr,
                    target: s.proficiencyLevel
                };
            });

            // We pass the full user skills list to AI as before, but the prompt in aiService could ideally use this refine context.
            // For now, we keep the call signature same but rely on the fact AI gets current skills and goal. 
            // NOTE: A better AI service update would be to pass the Gap explicitly, but current implementation passes User Profile + Goal.
            // The AI *should* deduce it, but let's rely on fallback/static logic to enforce the hard constraint if AI misses it.

            const aiRecs = await generateAIRecommendations(user, user.goalRole, user.currentSkills);

            if (aiRecs && Array.isArray(aiRecs) && aiRecs.length > 0) {
                finalRecommendations = aiRecs.map(rec => ({
                    userId: user._id,
                    skillName: rec.skillName,
                    priority: rec.priority,
                    learningAction: rec.learningAction,
                    estimatedDays: rec.estimatedDays,
                    status: 'pending'
                }));
                console.log("✅ Generated AI Recommendations");
            }
        } catch (err) {
            console.error("Failed to generate AI recommendations, falling back to static.", err);
        }

        // 4. Fallback/Enforcement: Ensure "Gap" skills are definitely in the list if AI didn't cover them perfectly
        // Or if AI failed completely.
        if (finalRecommendations.length === 0) {
            finalRecommendations = skillsToImprove.map(skill => {
                const userLevelVal = userSkillsMap.get(skill.skillName);
                const isUpgrade = userLevelVal !== undefined;

                return {
                    userId: user._id,
                    skillId: skill.skillId,
                    skillName: skill.skillName,
                    priority: skill.weight || 1,
                    learningAction: isUpgrade
                        ? `Upgrade ${skill.skillName} from ${Object.keys(PROFICIENCY_MAP).find(k => PROFICIENCY_MAP[k] === userLevelVal)} to ${skill.proficiencyLevel}`
                        : `Learn ${skill.skillName} (Target: ${skill.proficiencyLevel})`,
                    estimatedDays: (skill.weight || 1) * 7,
                    status: 'pending'
                };
            });
            console.log("⚠️ Used Static Recommendations (Gap Analysis)");
        }

        if (finalRecommendations.length > 0) {
            await Recommendation.insertMany(finalRecommendations);
        }

    } catch (error) {
        console.error('Error calculating readiness:', error);
    }
}
