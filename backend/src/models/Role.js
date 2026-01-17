import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
    },
    domain: String,
    description: String,
    requiredSkills: [
        {
            skillId: mongoose.Schema.Types.ObjectId,
            skillName: String,
            weight: Number, // 1-5 priority
            proficiencyLevel: String,
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Role', roleSchema);
