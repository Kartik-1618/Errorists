
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../src/models/Role.js';
import User from '../src/models/User.js';
import Skill from '../src/models/Skill.js';

dotenv.config();

const seedManagement = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        // 1. Ensure Skills exist for Management
        const softSkills = ['Communication', 'Leadership', 'Agile Methodology', 'Strategic Planning', 'Stakeholder Management'];
        const skillDocs = [];

        console.log('🔧 Upserting Management Skills...');
        for (const name of softSkills) {
            let skill = await Skill.findOne({ skillName: name });
            if (!skill) {
                skill = await Skill.create({
                    skillName: name,
                    domain: 'Soft Skill',
                    description: `Ability to demonstrate ${name}`,
                    difficulty: 'advanced', // Management often requires advanced soft skills
                    relatedRole: 'Manager'
                });
            }
            skillDocs.push(skill);
        }

        // 2. Create Management Roles
        console.log('mask Preparing Management Roles...');
        const managementRoles = [
            {
                roleName: 'Product Manager',
                domain: 'Management',
                description: 'Responsible for product planning and execution throughout the Product Lifecycle.',
                requiredSkills: skillDocs.map(s => ({
                    skillId: s._id,
                    skillName: s.skillName,
                    weight: 10,
                    proficiencyLevel: 'advanced'
                }))
            },
            {
                roleName: 'Engineering Manager',
                domain: 'Management',
                description: 'Manage a team of engineers and oversee technical projects.',
                requiredSkills: skillDocs.slice(0, 3).map(s => ({ // Subset
                    skillId: s._id,
                    skillName: s.skillName,
                    weight: 10,
                    proficiencyLevel: 'advanced'
                }))
            }
        ];

        for (const r of managementRoles) {
            const exists = await Role.findOne({ roleName: r.roleName });
            if (!exists) {
                await Role.create(r);
                console.log(`   + Created Role: ${r.roleName}`);
            } else {
                console.log(`   - Role ${r.roleName} already exists`);
            }
        }

        // 3. Assign Users to these roles
        // We will pick 5 random users and switch their goal to 'Product Manager'
        console.log('👥 Assigning users to Management track...');
        const users = await User.find({ role: 'user' }).limit(5); // Just grab first 5 regular users

        for (const user of users) {
            user.goalRole = 'Product Manager';
            user.domain = 'Management'; // Update their current domain context too

            // Give them some partial progress so they aren't 0%
            user.readiness = 40;

            await user.save();
            console.log(`   + Updated User: ${user.name} -> Target: Product Manager`);
        }

        // Add 2 for Engineering Manager
        const moreUsers = await User.find({ role: 'user' }).skip(5).limit(2);
        for (const user of moreUsers) {
            user.goalRole = 'Engineering Manager';
            user.domain = 'Management';
            await user.save();
            console.log(`   + Updated User: ${user.name} -> Target: Engineering Manager`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

seedManagement();
