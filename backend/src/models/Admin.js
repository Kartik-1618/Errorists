import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const adminSchema = new mongoose.Schema({
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
    role: {
        type: String,
        default: 'admin',
    },
    permissions: [String],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
// Hash password before saving
adminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcryptjs.hash(this.password, 10);
});

adminSchema.methods.comparePassword = async function (password) {
    return await bcryptjs.compare(password, this.password);
};

export default mongoose.model('Admin', adminSchema);
