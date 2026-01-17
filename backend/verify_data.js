import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';

dotenv.config();

const verify = async () => {
    await connectDB();

    const adminCount = await Admin.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`Admins: ${adminCount}`);
    console.log(`Users: ${userCount}`);

    if (adminCount > 0) {
        const admin = await Admin.findOne();
        console.log('Sample Admin:', admin.email, admin.role);
    }

    try {
        console.log("Testing User Save (Simulation of Signup)...");
        const testUser = new User({
            name: "Test Debug",
            email: "debug_" + Date.now() + "@test.com",
            password: "password123",
            degree: "B.Tech",
            role: "user"
        });
        await testUser.save();
        console.log("User Saved Successfully!");
    } catch (e) {
        console.error("User Save Failed:", e);
    }

    process.exit(0);
};

verify();
