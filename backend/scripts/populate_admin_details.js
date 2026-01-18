
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillwill';

const updateAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@skillwill.com' });

        if (!admin) {
            console.log('❌ Admin not found!');
            process.exit(1);
        }

        console.log(`Found Admin: ${admin._id}`);

        // Update with full profile details
        admin.name = "Super Admin";
        admin.degree = "M.Tech Computer Science";
        admin.academicYear = "Graduated";
        admin.domain = "Management"; // So they see relevant info

        await admin.save();
        console.log('✅ Admin profile populated with details.');

    } catch (error) {
        console.error('❌ Error updating admin:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

updateAdmin();
