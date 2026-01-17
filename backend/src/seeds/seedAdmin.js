import Admin from '../models/Admin.js';

const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await Admin.findOne({ email: 'admin@skillwill.com' });

        if (!adminExists) {
            const admin = new Admin({
                name: 'SkillWill Admin',
                email: 'admin@skillwill.com',
                password: 'Admin@123', // Change in production
                role: 'admin',
                permissions: ['manage_skills', 'manage_roles', 'view_users'],
            });
            await admin.save();
            console.log('✅ Admin user seeded successfully');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

export default seedAdmin;
