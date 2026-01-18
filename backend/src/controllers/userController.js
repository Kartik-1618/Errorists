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
        const { name, degree, academicYear, domain, goalRole } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (degree) updates.degree = degree;
        if (academicYear) updates.academicYear = academicYear;
        if (domain) updates.domain = domain;
        if (goalRole) updates.goalRole = goalRole;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true }
        );

        // Only recalculate if goalRole changed, or always? 
        // Always is safer to ensure consistency if domain changes affecting future logic.
        await calculateReadiness(user._id);

        // Fetch fresh data to return
        const updatedUser = await User.findById(req.user.userId);
        const recommendations = await Recommendation.find({ userId: req.user.userId }).sort({ priority: -1 });

        res.json({ message: 'Profile updated', user: updatedUser, recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Please provide both old and new passwords' });
        }

        const user = await User.findById(req.user.userId);
        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        user.password = newPassword; // Pre-save hook will hash this
        await user.save();

        res.json({ message: 'Password changed successfully' });
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
            user.currentSkills[existingSkillIndex].skillId = skillId;
            // user.currentSkills[existingSkillIndex].skillName = normalizedSkillName; // Optional
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

        // Log Progress Logic (Auto-History)
        // Check if we already logged this recently? Or just log every manual add/update as an event.
        // User wants it in history.
        const progressAction = existingSkillIndex !== -1
            ? `Updated skill: ${normalizedSkillName} to ${proficiency}`
            : `Added skill: ${normalizedSkillName} (${proficiency})`;

        const progress = new Progress({
            userId: req.user.userId,
            skillId: skillId,
            skillName: normalizedSkillName,
            action: progressAction,
            notes: 'Manually added via Add Your Skills',
            completionDate: new Date()
        });
        await progress.save();

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

        // 1. Find Skill (Case Insensitive)
        const skill = await Skill.findOne({
            skillName: { $regex: new RegExp(`^${skillName.trim()}$`, 'i') }
        });

        const user = await User.findById(req.user.userId);

        // Check for existing progress to prevent duplicates or update existing
        // We look for a "Completed" action for this skill
        let progress = await Progress.findOne({
            userId: req.user.userId,
            skillName: { $regex: new RegExp(`^${skillName.trim()}$`, 'i') },
            action: { $regex: /^Completed/i }
        });

        if (progress) {
            // Update existing entry
            progress.notes = notes;
            progress.completionDate = new Date(); // Update timestamp to latest
            await progress.save();
        } else {
            // Create new entry
            progress = new Progress({
                userId: req.user.userId,
                skillId: skill?._id,
                skillName,
                action,
                certificateUrl,
                notes,
                completionDate: new Date(),
            });
            await progress.save();
        }

        // 2. Determine Target Proficiency based on Goal Role
        let targetProficiencyLevel = 2; // Default to Intermediate
        if (user.goalRole) {
            const role = await Role.findOne({ roleName: user.goalRole });
            if (role) {
                const reqSkill = role.requiredSkills.find(
                    rs => rs.skillName.toLowerCase() === skillName.trim().toLowerCase()
                );
                if (reqSkill) {
                    const roleLevel = PROFICIENCY_MAP[reqSkill.proficiencyLevel.toLowerCase()] || 1;
                    // If role needs Advanced (3), valid completion means giving them 3.
                    // If role needs Beginner (1), we give them Intermediate (2) as a bonus.
                    targetProficiencyLevel = Math.max(roleLevel, 2);
                }
            }
        }

        // Map numeric back to string
        const LEVEL_NAMES = ['beginner', 'intermediate', 'advanced'];
        // clamp to 0-2 (though PROFICIENCY_MAP is 1-3. Let's align)
        // PROFICIENCY_MAP: beginner=1, intermediate=2, advanced=3
        const targetProficiencyStr = LEVEL_NAMES[Math.min(targetProficiencyLevel, 3) - 1] || 'intermediate';

        // Progress logic moved to top to handle duplicates


        // 3. Update User Skills
        const skillIndex = user.currentSkills.findIndex(
            s => s.skillName.toLowerCase() === skillName.trim().toLowerCase()
        );

        if (skillIndex !== -1) {
            const currentProf = PROFICIENCY_MAP[user.currentSkills[skillIndex].proficiency.toLowerCase()] || 0;
            if (targetProficiencyLevel > currentProf) {
                user.currentSkills[skillIndex].proficiency = targetProficiencyStr;
            }
        } else {
            user.currentSkills.push({
                skillId: skill?._id,
                skillName, // Maintain original casing from input or DB? Input is fine, normalized in maps.
                proficiency: targetProficiencyStr,
            });
        }

        await user.save();

        // Recalculate readiness
        await calculateReadiness(user._id);

        const updatedUser = await User.findById(req.user.userId);
        const recommendations = await Recommendation.find({ userId: req.user.userId }); // Removed sort to keep roadmap order? Or sort by priority? Let's use priority.
        // Actually, for roadmap, we might want to preserve the order defined in Role?
        // But Role skills are just an array.
        // Let's sort pending first, then completed?
        // Recommendation logic usually handles sorting. Let's re-sort:
        // Completed last.
        recommendations.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return b.priority - a.priority; // High priority first
        });

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

export const getAvailableDomains = async (req, res) => {
    try {
        const domains = await Role.distinct('domain');
        // Filter out empty/null and sort
        const cleanDomains = domains.filter(d => d).sort();
        res.json(cleanDomains);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

        // 1. Clear ALL old recommendations (Full regeneration to include completed ones)
        await Recommendation.deleteMany({ userId: user._id });

        let finalRecommendations = [];

        // 2. Generate Recommendations for ALL Required Skills
        // This ensures the list serves as a comprehensive "Roadmap"
        finalRecommendations = role.requiredSkills.map(skill => {
            const userLevelVal = userSkillsMap.get(skill.skillName.toLowerCase());
            const requiredLevelVal = PROFICIENCY_MAP[skill.proficiencyLevel.toLowerCase()] || 1;

            const isCompleted = userLevelVal !== undefined && userLevelVal >= requiredLevelVal;
            const isUpgradeWithSkill = userLevelVal !== undefined && userLevelVal < requiredLevelVal;

            let learningAction = "";
            if (isCompleted) {
                learningAction = "✅ Skill requirement met!";
            } else if (isUpgradeWithSkill) {
                learningAction = `Upgrade ${skill.skillName} to ${skill.proficiencyLevel}`;
            } else {
                learningAction = `Learn ${skill.skillName} (Target: ${skill.proficiencyLevel})`;
            }

            return {
                userId: user._id,
                skillId: skill.skillId,
                skillName: skill.skillName,
                priority: skill.weight || 3,
                learningAction: learningAction,
                estimatedDays: isCompleted ? 0 : (skill.weight || 1) * 7,
                status: isCompleted ? 'completed' : 'pending' // pending actually means "to-do"
            };
        });

        console.log(`✅ Generated ${finalRecommendations.length} Recommendations (Roadmap).`);

        if (finalRecommendations.length > 0) {
            await Recommendation.insertMany(finalRecommendations);
        }

    } catch (error) {
        console.error('Error calculating readiness:', error);
    }
}
