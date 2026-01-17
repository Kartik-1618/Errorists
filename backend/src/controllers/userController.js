import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Role from '../models/Role.js';
import Recommendation from '../models/Recommendation.js';
import Progress from '../models/Progress.js';
import { generateRoleSkills } from '../services/aiService.js';

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

        // Fetch fresh data to return
        const updatedUser = await User.findById(req.user.userId);
        const recommendations = await Recommendation.find({ userId: req.user.userId }).sort({ priority: -1 });

        res.json({ message: 'Profile updated', user: updatedUser, recommendations });
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

        // Update user skills (Avoid Duplicates)
        const user = await User.findById(req.user.userId);
        const skillIndex = user.currentSkills.findIndex(
            s => s.skillName.toLowerCase() === skillName.toLowerCase()
        );

        if (skillIndex !== -1) {
            // Skill exists, upgrade it if needed or just keep log
            // For now, assume "Mark as Done" implies reaching "intermediate" or higher
            const currentProf = PROFICIENCY_MAP[user.currentSkills[skillIndex].proficiency.toLowerCase()] || 0;
            const targetProf = PROFICIENCY_MAP['intermediate'];

            // Only update proficiency if it's an improvement
            if (targetProf > currentProf) {
                user.currentSkills[skillIndex].proficiency = 'intermediate';
            }
        } else {
            // New skill
            user.currentSkills.push({
                skillId: skill?._id,
                skillName,
                proficiency: 'intermediate',
            });
        }

        await user.save();

        // Recalculate readiness
        await calculateReadiness(user._id);

        const updatedUser = await User.findById(req.user.userId);
        const recommendations = await Recommendation.find({ userId: req.user.userId }).sort({ priority: -1 });

        res.json({ message: 'Progress logged', progress, user: updatedUser, recommendations });
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

        let role = await Role.findOne({ roleName: user.goalRole });
        if (!role) return;

        // --- 0. AI Handling for Empty Roles (Safety Net) ---
        if (!role.requiredSkills || role.requiredSkills.length === 0) {
            console.log(`⚠️ Role "${role.roleName}" has no skills. Attempting AI auto-fill...`);
            const aiData = await generateRoleSkills(role.roleName, role.domain);

            if (aiData && aiData.skills && aiData.skills.length > 0) {
                // Update description if missing
                if (!role.description && aiData.roleDescription) {
                    role.description = aiData.roleDescription;
                }

                const newRequiredSkills = [];

                for (const aiSkill of aiData.skills) {
                    // Check if Skill exists globally (Case Insensitive)
                    let dbSkill = await Skill.findOne({
                        skillName: { $regex: new RegExp(`^${aiSkill.skillName.trim()}$`, 'i') }
                    });

                    if (!dbSkill) {
                        try {
                            dbSkill = await Skill.create({
                                skillName: aiSkill.skillName.trim(),
                                category: aiSkill.category || 'General',
                                difficulty: aiSkill.difficulty || 'intermediate',
                                description: aiSkill.description || `Proficiency in ${aiSkill.skillName}`,
                                relatedRole: role.roleName
                            });
                            console.log(`+ Created new skill by AI: ${dbSkill.skillName}`);
                        } catch (e) {
                            dbSkill = await Skill.findOne({
                                skillName: { $regex: new RegExp(`^${aiSkill.skillName.trim()}$`, 'i') }
                            });
                            if (!dbSkill) continue;
                        }
                    }

                    if (dbSkill) {
                        newRequiredSkills.push({
                            skillId: dbSkill._id,
                            skillName: dbSkill.skillName,
                            weight: aiSkill.weight || 3,
                            proficiencyLevel: aiSkill.proficiencyLevel || 'intermediate'
                        });
                    }
                }

                if (newRequiredSkills.length > 0) {
                    role.requiredSkills = newRequiredSkills;
                    await role.save();
                    console.log(`✅ Role "${role.roleName}" auto-populated with ${newRequiredSkills.length} skills (User Triggered).`);

                    // Re-fetch role to ensure cleanly updated state
                    role = await Role.findById(role._id);
                }
            }
        }

        // Use case-insensitive mapping for User Skills
        const userSkillsMap = new Map();
        user.currentSkills.forEach(s => {
            userSkillsMap.set(s.skillName.toLowerCase(), PROFICIENCY_MAP[s.proficiency.toLowerCase()] || 0);
        });

        // Smart Matching: Only count as "matched" if User Proficiency >= Required Proficiency
        const matchedSkills = role.requiredSkills.filter(rs => {
            const userLevel = userSkillsMap.get(rs.skillName.toLowerCase());
            const requiredLevel = PROFICIENCY_MAP[rs.proficiencyLevel.toLowerCase()] || 1;
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
        const skillsToImprove = role.requiredSkills.filter(rs => {
            const userLevel = userSkillsMap.get(rs.skillName.toLowerCase());
            const requiredLevel = PROFICIENCY_MAP[rs.proficiencyLevel.toLowerCase()] || 1;

            // Return true if (User doesn't have it) OR (User has it but Level < Required)
            return userLevel === undefined || userLevel < requiredLevel;
        });

        // 3. Generate Recommendations from Gaps (Deterministic & Efficient)
        // We rely on the Role's required skills (which are AI-generated if needed) to determine the next steps.
        // This ensures the "Add Skills" dropdown matches the "Next Steps".
        finalRecommendations = skillsToImprove.map(skill => {
            const userLevelVal = userSkillsMap.get(skill.skillName.toLowerCase());
            const isUpgrade = userLevelVal !== undefined;

            return {
                userId: user._id,
                skillId: skill.skillId,
                skillName: skill.skillName,
                priority: skill.weight || 3,
                learningAction: isUpgrade
                    ? `Upgrade ${skill.skillName} from ${Object.keys(PROFICIENCY_MAP).find(k => PROFICIENCY_MAP[k] === userLevelVal)} to ${skill.proficiencyLevel}`
                    : `Learn ${skill.skillName} (Target: ${skill.proficiencyLevel})`,
                estimatedDays: (skill.weight || 1) * 7,
                status: 'pending'
            };
        });
        console.log(`✅ Generated ${finalRecommendations.length} Recommendations based on Gaps.`);

        if (finalRecommendations.length > 0) {
            await Recommendation.insertMany(finalRecommendations);
        }

    } catch (error) {
        console.error('Error calculating readiness:', error);
    }
}
