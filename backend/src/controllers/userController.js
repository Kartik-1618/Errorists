import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Role from '../models/Role.js';
import Recommendation from '../models/Recommendation.js';
import Progress from '../models/Progress.js';

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
        const roles = await Role.find().select('roleName domain');
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
        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addSkill = async (req, res) => {
    try {
        const { skillName, proficiency, yearsOfExperience } = req.body;
        const user = await User.findById(req.user.userId);

        const skill = await Skill.findOne({ skillName });
        let skillId = skill?._id;

        user.currentSkills.push({
            skillId,
            skillName,
            proficiency,
            yearsOfExperience,
        });

        await user.save();

        // Recalculate readiness
        await calculateReadiness(user._id);

        res.json({ message: 'Skill added', user });
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

async function calculateReadiness(userId) {
    try {
        const user = await User.findById(userId);
        if (!user.goalRole) return;

        const role = await Role.findOne({ roleName: user.goalRole });
        if (!role) return;

        const userSkillNames = user.currentSkills.map(s => s.skillName);
        const matchedSkills = role.requiredSkills.filter(rs => userSkillNames.includes(rs.skillName));

        const totalWeight = role.requiredSkills.reduce((sum, s) => sum + (s.weight || 1), 0);
        const matchedWeight = matchedSkills.reduce((sum, s) => sum + (s.weight || 1), 0);

        const readiness = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
        user.readiness = readiness;
        await user.save();

        // Generate Recommendations (Missing Skills)
        const missingSkills = role.requiredSkills.filter(rs => !userSkillNames.includes(rs.skillName));

        // Clear old pending recommendations
        await Recommendation.deleteMany({ userId: user._id, status: 'pending' });

        // Create new recommendations
        const recommendations = missingSkills.map(skill => ({
            userId: user._id,
            skillId: skill.skillId,
            skillName: skill.skillName,
            priority: skill.weight || 1,
            learningAction: `Learn ${skill.skillName} (Level: ${skill.proficiencyLevel || 'Beginner'})`,
            estimatedDays: (skill.weight || 1) * 7,
            status: 'pending'
        }));

        if (recommendations.length > 0) {
            await Recommendation.insertMany(recommendations);
        }

    } catch (error) {
        console.error('Error calculating readiness:', error);
    }
}
