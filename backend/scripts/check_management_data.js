
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../src/models/Role.js';
import User from '../src/models/User.js';

dotenv.config();

const checkManagement = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        // 1. Check Roles in Management Domain
        const managementRoles = await Role.find({ domain: 'Management' });
        console.log(`\n📋 Management Roles Found: ${managementRoles.length}`);
        managementRoles.forEach(r => console.log(`   - ${r.roleName}`));

        if (managementRoles.length === 0) {
            console.log('   (No roles found. This is why it is empty)');
        }

        // 2. Check Users targeting these roles
        const roleNames = managementRoles.map(r => r.roleName);
        const usersTargetingManagement = await User.find({ goalRole: { $in: roleNames } });

        console.log(`\n👥 Users targeting Management roles: ${usersTargetingManagement.length}`);
        usersTargetingManagement.forEach(u => console.log(`   - ${u.name} (Goal: ${u.goalRole})`));

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

checkManagement();
