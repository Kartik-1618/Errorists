
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@skillwill.com' });
        if (!admin) {
            console.log('❌ Admin not found (unexpected)');
        } else {
            console.log('🔄 resetting password to plain text "Admin@123" (Mongoose will hash it)...');
            // User model has pre-save hook that hashes the password
            admin.password = 'Admin@123';
            await admin.save();
            console.log('✅ Admin password reset successfully.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

resetAdminPassword();
