
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const checkAdmin = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const admin = await User.findOne({ email: 'admin@skillwill.com' });
        if (!admin) {
            console.log('❌ Admin user NOT found');
        } else {
            console.log('✅ Admin user FOUND');
            console.log('Stored Hash:', admin.password);

            const isMatch = await bcryptjs.compare('Admin@123', admin.password);
            console.log('Password "Admin@123" match:', isMatch);
        }

    } catch (error) {
        console.error('❌ DB Error:', error.message);
    } finally {
        mongoose.disconnect();
    }
};

checkAdmin();
