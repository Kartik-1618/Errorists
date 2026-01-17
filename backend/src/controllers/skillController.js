import Skill from '../models/Skill.js';
import Role from '../models/Role.js';

export const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find();
        res.json(skills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSkillsByRole = async (req, res) => {
    try {
        const { roleName } = req.query;
        const role = await Role.findOne({ roleName }).populate('requiredSkills.skillId');
        res.json(role?.requiredSkills || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
