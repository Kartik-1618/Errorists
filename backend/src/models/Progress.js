import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
    },
    skillName: String,
    action: String,
    completionDate: Date,
    certificateUrl: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Progress', progressSchema);
