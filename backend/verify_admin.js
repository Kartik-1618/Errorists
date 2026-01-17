import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';

dotenv.config();

const verify = async () => {
    await connectDB();

    const adminCount = await Admin.countDocuments();
    console.log(`Admins: ${adminCount}`);

    // Explicitly seed if missing, just in case
    if (adminCount === 0) {
        console.log("Seeding Admin manually...");
        const admin = new Admin({
            name: 'SkillWill Admin',
            email: 'admin@skillwill.com',
            password: 'Admin@123',
            role: 'admin',
            permissions: ['manage_skills', 'manage_roles', 'view_users'],
        });
        await admin.save();
        console.log("✅ Admin seeded manually.");
    }

    process.exit(0);
};

verify();
