import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true,
    },
    skillName: String,
    priority: { type: Number, default: 1 },
    learningAction: String,
    estimatedDays: Number,
    resources: [String],
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Recommendation', recommendationSchema);
