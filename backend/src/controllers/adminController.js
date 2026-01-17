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
        const { skillName, category, description, difficulty } = req.body;
        const newSkill = new Skill({
            skillName,
            category,
            description,
            difficulty,
        });
        await newSkill.save();
        res.json({ message: 'Skill approved', skill: newSkill });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addRole = async (req, res) => {
    try {
        const { roleName, domain, description } = req.body;
        const newRole = new Role({
            roleName,
            domain,
            description,
            requiredSkills: [],
        });
        await newRole.save();
        res.json({ message: 'Role added', role: newRole });
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
