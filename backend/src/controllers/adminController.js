import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Role from '../models/Role.js';

export const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalSkills = await Skill.countDocuments();
        const totalRoles = await Role.countDocuments();

        res.json({
            totalUsers,
            totalSkills,
            totalRoles,
            timestamp: new Date(),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const approveSkill = async (req, res) => {
    try {
        const { id, skillName, domain, relatedRole, description, difficulty } = req.body;

        if (id) {
            // Update existing skill
            const updatedSkill = await Skill.findByIdAndUpdate(
                id,
                { skillName, domain, relatedRole, description, difficulty },
                { new: true }
            );
            return res.json({ message: 'Skill updated', skill: updatedSkill });
        }

        const newSkill = new Skill({
            skillName,
            domain,
            relatedRole,
            description,
            difficulty,
        });
        await newSkill.save();
        res.json({ message: 'Skill approved', skill: newSkill });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSkill = async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Cascade delete skills associated with this role
        await Skill.deleteMany({ relatedRole: role.roleName });

        await Role.findByIdAndDelete(id);

        res.json({ message: 'Role and associated skills deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

import { generateRoleSkills } from '../services/aiService.js';

export const addRole = async (req, res) => {
    try {
        const { roleName, domain, description } = req.body;

        // 1. Create the role first (Base)
        const newRole = new Role({
            roleName,
            domain,
            description,
            requiredSkills: [],
        });

        // 2. Try to auto-populate skills via AI
        try {
            console.log(`🤖 Auto-generating skills for new role: ${roleName}...`);
            const aiData = await generateRoleSkills(roleName, domain);

            if (aiData && aiData.skills && aiData.skills.length > 0) {
                if (!newRole.description && aiData.roleDescription) {
                    newRole.description = aiData.roleDescription;
                }

                const aiSkillsToAdd = [];
                for (const aiSkill of aiData.skills) {
                    // Check if Skill exists globally (Case Insensitive)
                    // We use regex to match exactly but case-insensitively
                    let dbSkill = await Skill.findOne({
                        skillName: { $regex: new RegExp(`^${aiSkill.skillName.trim()}$`, 'i') }
                    });

                    if (!dbSkill) {
                        try {
                            dbSkill = await Skill.create({
                                skillName: aiSkill.skillName.trim(), // Normalize
                                domain: domain || 'General', // Inherit Role's Domain
                                difficulty: aiSkill.difficulty || 'intermediate',
                                description: aiSkill.description || `Proficiency in ${aiSkill.skillName}`,
                                relatedRole: roleName
                            });
                            console.log(`+ Created new skill by AI: ${dbSkill.skillName}`);
                        } catch (e) {
                            // If create failed (race condition), try finding it again
                            dbSkill = await Skill.findOne({
                                skillName: { $regex: new RegExp(`^${aiSkill.skillName.trim()}$`, 'i') }
                            });
                        }
                    }

                    if (dbSkill) {
                        aiSkillsToAdd.push({
                            skillId: dbSkill._id,
                            skillName: dbSkill.skillName, // Use DB casing
                            weight: aiSkill.weight || 3,
                            proficiencyLevel: aiSkill.proficiencyLevel || 'intermediate'
                        });
                    }
                }
                newRole.requiredSkills = aiSkillsToAdd;
                console.log(`✅ Auto-populated ${aiSkillsToAdd.length} skills for ${roleName}`);
            } else {
                throw new Error("AI returned no skills. Please try again or check API quota.");
            }
        } catch (aiError) {
            console.error("AI Role Generation Failed for Admin:", aiError);
            return res.status(503).json({
                error: `AI Generation Failed: ${aiError.message || 'Unknown Error'}. Please try again.`
            });
        }

        await newRole.save();
        res.json({ message: 'Role added (populated by AI)', role: newRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addSkillToRole = async (req, res) => {
    try {
        const { roleName, skillName, weight, proficiencyLevel } = req.body;
        const skill = await Skill.findOne({ skillName });
        const role = await Role.findOne({ roleName });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        role.requiredSkills.push({
            skillId: skill?._id,
            skillName,
            weight,
            proficiencyLevel,
        });

        await role.save();
        res.json({ message: 'Skill added to role', role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ... existing methods ...

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find().sort({ createdAt: -1 });
        res.json(skills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ createdAt: -1 });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
