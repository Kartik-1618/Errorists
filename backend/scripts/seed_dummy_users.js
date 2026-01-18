
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import bcryptjs from 'bcryptjs';

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

const firstNames = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"
];

const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const domains = ['Software Development', 'Data Science', 'DevOps', 'Management', 'Finance', 'Design'];
const degrees = ['B.Tech', 'M.Sc', 'B.A.', 'Ph.D', 'M.Tech', 'B.Sc'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateUsers = async () => {
    await connectDB();

    console.log('🌱 Adding 30 Dummy Users...');

    try {
        // Fetch existing roles to assign valid goals
        const roles = await Role.find({});
        const roleNames = roles.length > 0 ? roles.map(r => r.roleName) : ['Frontend Developer', 'Backend Developer', 'Data Scientist'];

        const userDocs = [];
        // Hash password manually because insertMany doesn't trigger pre('save') hooks
        const passwordHash = await bcryptjs.hash('Password@123', 10);

        for (let i = 0; i < 30; i++) {
            const firstName = getRandomElement(firstNames);
            const lastName = getRandomElement(lastNames);
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}@example.com`;

            userDocs.push({
                name: fullName,
                email: email,
                password: passwordHash,
                degree: getRandomElement(degrees),
                academicYear: '2024',
                domain: getRandomElement(domains),
                role: 'user',
                goalRole: getRandomElement(roleNames),
                currentSkills: [],
                readiness: Math.floor(Math.random() * 80),
                createdAt: new Date()
            });
        }

        const result = await User.insertMany(userDocs);
        console.log(`✅ Successfully added ${result.length} users.`);
        console.log('ℹ️  Sample Login for populated users:');
        console.log(`   Email: ${userDocs[0].email}`);
        console.log(`   Password: Password@123`);

    } catch (error) {
        console.error('❌ Error Seeding Users:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

generateUsers();
