import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    degree: String,
    academicYear: String,
    domain: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    goalRole: String,
    currentSkills: [
        {
            skillId: mongoose.Schema.Types.ObjectId,
            skillName: String,
            proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
            yearsOfExperience: Number,
        },
    ],
    readiness: {
        type: Number,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcryptjs.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
    return await bcryptjs.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
