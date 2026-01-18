
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Skill from '../src/models/Skill.js';
import Role from '../src/models/Role.js';
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

const seedGraphData = async () => {
    await connectDB();
    const targetEmail = 'john.wilson1671@example.com';
    console.log(`🎯 Configuring data for ${targetEmail} to populate graphs...`);

    try {
        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.error('❌ User not found. Please run previous seed script first.');
            process.exit(1);
        }

        // 1. Define Skills from the screenshot
        const skillNames = [
            'Python',
            'SQL',
            'Machine Learning (Algorithms & MLOps)',
            'Statistical Analysis & Experimentation',
            'Cloud Platforms (AWS/GCP/Azure)',
            'Big Data Technologies',
            'Data Visualization & Storytelling'
        ];

        console.log('🔧 Upserting Skills...');
        const skillDocs = [];
        for (const name of skillNames) {
            let skill = await Skill.findOne({ skillName: name });
            if (!skill) {
                skill = await Skill.create({
                    skillName: name,
                    domain: 'Data Science',
                    description: `Expertise in ${name}`,
                    difficulty: 'advanced',
                    relatedRole: 'Data Scientist'
                });
            }
            skillDocs.push(skill);
        }

        // 2. Define/Update Goal Role
        console.log('📋 Updating Role "Data Scientist"...');
        const roleName = 'Data Scientist';
        let role = await Role.findOne({ roleName });

        const requiredSkills = skillDocs.map(s => ({
            skillId: s._id,
            skillName: s.skillName,
            weight: 15, // High weight to impact readiness
            proficiencyLevel: 'advanced'
        }));

        if (!role) {
            role = await Role.create({
                roleName,
                domain: 'Data Science',
                description: 'Advanced Data Science Role',
                requiredSkills
            });
        } else {
            role.requiredSkills = requiredSkills;
            await role.save();
        }

        // 3. Update User to have partial skills (Matches)
        console.log('👤 Updating User Profile...');
        // Give user the first 4 skills (Partial Match)
        const userHasSkills = skillDocs.slice(0, 4).map(s => ({
            skillId: s._id,
            skillName: s.skillName,
            proficiency: 'intermediate',
            yearsOfExperience: 2
        }));

        user.goalRole = roleName;
        user.currentSkills = userHasSkills;
        user.readiness = 57; // Approx 4/7 * 100
        await user.save();

        // 4. Seed Progress (Time Series Data)
        console.log('📈 Generating Progress History...');
        await Progress.deleteMany({ userId: user._id }); // Clear old random progress

        const progressEntries = [];
        const now = new Date();

        // Create a timeline over 6 months
        // Month 1: Started Python
        // Month 2: Finished Python, Started SQL
        // Month 3: Finished SQL
        // Month 4: Started ML, Completed Certification in ML
        // Month 5: Started Stats
        // Month 6: Finished Stats

        const timeline = [
            { skill: skillNames[0], action: 'Started Course', offsetDays: 180 },
            { skill: skillNames[0], action: 'Completed Project', offsetDays: 160 },
            { skill: skillNames[1], action: 'Enrolled in Bootcamp', offsetDays: 140 },
            { skill: skillNames[1], action: 'Certified', offsetDays: 120 },
            { skill: skillNames[2], action: 'Passed Assessment', offsetDays: 90 },
            { skill: skillNames[2], action: 'Awarded Certificate', offsetDays: 60 },
            { skill: skillNames[3], action: 'Completed Workshop', offsetDays: 30 },
            { skill: skillNames[3], action: 'Final Project Submission', offsetDays: 5 },
        ];

        for (const event of timeline) {
            const skill = skillDocs.find(s => s.skillName === event.skill);
            const date = new Date(now);
            date.setDate(date.getDate() - event.offsetDays);

            progressEntries.push({
                userId: user._id,
                skillId: skill._id,
                skillName: skill.skillName,
                action: event.action,
                completionDate: date,
                notes: 'Generated for graph visualization',
                createdAt: date
            });
        }

        await Progress.insertMany(progressEntries);
        console.log(`✅ Success! Updated ${targetEmail} with:`);
        console.log(`   - Goal Role: ${roleName}`);
        console.log(`   - Current Skills: ${userHasSkills.length}/${skillNames.length} (Matches)`);
        console.log(`   - Progress Entries: ${progressEntries.length} (History)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedGraphData();
