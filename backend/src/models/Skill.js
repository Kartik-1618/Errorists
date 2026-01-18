import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
    skillName: {
        type: String,
        required: true,
        unique: true,
    },
    domain: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    relatedRole: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Skill', skillSchema);
