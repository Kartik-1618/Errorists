
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Skill from '../src/models/Skill.js';
import Progress from '../src/models/Progress.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillwill';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedUserProgress = async () => {
    await connectDB();

    const targetEmail = 'john.wilson1671@example.com';
    console.log(`🔎 Finding user: ${targetEmail}...`);

    try {
        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.error(`❌ User with email ${targetEmail} NOT FOUND.`);
            console.log('Please verify the email address from a previous step output or database.');
            process.exit(1);
        }

        console.log(`✅ Found User: ${user.name} (${user._id})`);

        // Fetch some skills to associate progress with
        const skills = await Skill.find({});
        if (skills.length === 0) {
            console.error('❌ No skills found in database. Cannot associate progress.');
            process.exit(1);
        }

        const actions = [
            'Completed Module 1',
            'Passed Quiz',
            'Submitted Assignment',
            'Finished Project',
            'Watched Tutorial Series',
            'Read Documentation',
            'Earned Badge',
            'Completed Certification'
        ];

        const progressDocs = [];
        const now = new Date();

        // Generate 30 entries
        for (let i = 0; i < 30; i++) {
            const skill = getRandomItem(skills);

            // Random date within last 90 days
            const daysAgo = getRandomInt(0, 90);
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);

            progressDocs.push({
                userId: user._id,
                skillId: skill._id,
                skillName: skill.skillName,
                action: `${getRandomItem(actions)} in ${skill.skillName}`,
                completionDate: date,
                notes: 'Auto-generated progress entry for testing graphs.',
                createdAt: date // Set createdAt same as completionDate for consistent sorting if needed
            });
        }

        // Sort by date just for neatness before inserting (though mongo doesn't care)
        progressDocs.sort((a, b) => a.completionDate - b.completionDate);

        await Progress.insertMany(progressDocs);
        console.log(`✅ Successfully added 30 progress entries for ${targetEmail}`);

    } catch (error) {
        console.error('❌ Error Seeding Progress:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedUserProgress();
