
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import User from './src/models/User.js';
import Skill from './src/models/Skill.js';
import Role from './src/models/Role.js';
import Recommendation from './src/models/Recommendation.js';
import Progress from './src/models/Progress.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const resetDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear Data-Heavy Collections
        const skills = await Skill.deleteMany({});
        console.log(`🗑️ Deleted ${skills.deletedCount} Skills.`);

        const roles = await Role.deleteMany({});
        console.log(`🗑️ Deleted ${roles.deletedCount} Roles.`);

        const recs = await Recommendation.deleteMany({});
        console.log(`🗑️ Deleted ${recs.deletedCount} Recommendations.`);

        const prog = await Progress.deleteMany({});
        console.log(`🗑️ Deleted ${prog.deletedCount} Progress entries.`);

        // 2. Clear Users (Except Admin)
        const users = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`🗑️ Deleted ${users.deletedCount} Users (Non-Admin).`);

        console.log('✅ Database Reset Complete (Admin Preserved).');
    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

resetDatabase();
