import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Skill from './src/models/Skill.js';
import Role from './src/models/Role.js';
import Recommendation from './src/models/Recommendation.js';
import Progress from './src/models/Progress.js';
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

// --- REALISTIC DATA SETS ---
const REAL_SKILLS = [
    // Languages
    { name: 'Python', category: 'Programming', difficulty: 'intermediate' },
    { name: 'JavaScript', category: 'Programming', difficulty: 'intermediate' },
    { name: 'Java', category: 'Programming', difficulty: 'intermediate' },
    { name: 'C++', category: 'Programming', difficulty: 'advanced' },
    { name: 'TypeScript', category: 'Programming', difficulty: 'intermediate' },
    { name: 'Go', category: 'Programming', difficulty: 'intermediate' },
    { name: 'Rust', category: 'Programming', difficulty: 'advanced' },
    { name: 'SQL', category: 'Database', difficulty: 'beginner' },
    { name: 'HTML', category: 'Frontend', difficulty: 'beginner' },
    { name: 'CSS', category: 'Frontend', difficulty: 'beginner' },
    // Frameworks/Libs
    { name: 'React', category: 'Frontend', difficulty: 'intermediate' },
    { name: 'Vue.js', category: 'Frontend', difficulty: 'intermediate' },
    { name: 'Angular', category: 'Frontend', difficulty: 'advanced' },
    { name: 'Node.js', category: 'Backend', difficulty: 'intermediate' },
    { name: 'Django', category: 'Backend', difficulty: 'intermediate' },
    { name: 'Flask', category: 'Backend', difficulty: 'beginner' },
    { name: 'Spring Boot', category: 'Backend', difficulty: 'advanced' },
    { name: 'TensorFlow', category: 'Data Science', difficulty: 'advanced' },
    { name: 'PyTorch', category: 'Data Science', difficulty: 'advanced' },
    { name: 'Pandas', category: 'Data Science', difficulty: 'intermediate' },
    { name: 'Scikit-Learn', category: 'Data Science', difficulty: 'intermediate' },
    // Tools/Cloud
    { name: 'Git', category: 'Tools', difficulty: 'beginner' },
    { name: 'Docker', category: 'DevOps', difficulty: 'intermediate' },
    { name: 'Kubernetes', category: 'DevOps', difficulty: 'advanced' },
    { name: 'AWS', category: 'Cloud', difficulty: 'intermediate' },
    { name: 'Azure', category: 'Cloud', difficulty: 'intermediate' },
    { name: 'Google Cloud', category: 'Cloud', difficulty: 'intermediate' },
    { name: 'Jenkins', category: 'DevOps', difficulty: 'intermediate' },
    { name: 'Jira', category: 'Tools', difficulty: 'beginner' },
    { name: 'Figma', category: 'Design', difficulty: 'beginner' },
    // Soft Skills
    { name: 'Communication', category: 'Soft Skill', difficulty: 'beginner' },
    { name: 'Leadership', category: 'Soft Skill', difficulty: 'advanced' },
    { name: 'Problem Solving', category: 'Soft Skill', difficulty: 'intermediate' },
    { name: 'Agile Methodology', category: 'Soft Skill', difficulty: 'intermediate' }
];

const REAL_ROLES = [
    {
        name: 'Frontend Developer',
        domain: 'Software Development',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Figma']
    },
    {
        name: 'Backend Developer',
        domain: 'Software Development',
        skills: ['Node.js', 'Express', 'MongoDB', 'SQL', 'Git', 'API Design']
    },
    {
        name: 'Full Stack Developer',
        domain: 'Software Development',
        skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker']
    },
    {
        name: 'Data Scientist',
        domain: 'Data Science',
        skills: ['Python', 'SQL', 'Pandas', 'Scikit-Learn', 'TensorFlow', 'Statistics']
    },
    {
        name: 'DevOps Engineer',
        domain: 'DevOps',
        skills: ['Linux', 'AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Python']
    },
    {
        name: 'Product Manager',
        domain: 'Management',
        skills: ['Communication', 'Leadership', 'Agile Methodology', 'Jira', 'Product Strategy']
    }
];

// Helper to get diverse variations
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const seedData = async () => {
    await connectDB();
    console.log('🌱 Starting Logical & Realistic Seeding v2...');

    try {
        await Skill.deleteMany({});
        await Role.deleteMany({});
        await User.deleteMany({ role: 'user' });
        await Recommendation.deleteMany({});
        await Progress.deleteMany({});

        // 1. Insert Skills
        let allSkills = [...REAL_SKILLS];
        for (let i = 0; i < 70; i++) {
            allSkills.push({
                name: `Skill_${i}_${Date.now()}`, // Ensure unique
                category: getRandomItem(['Niche Tech', 'Legacy', 'Enterprise', 'Research']),
                difficulty: getRandomItem(['beginner', 'intermediate', 'advanced'])
            });
        }

        const skillDocs = allSkills.map(s => ({
            skillName: s.name,
            category: s.category,
            description: `Master the fundamentals and advanced concepts of ${s.name}.`,
            difficulty: s.difficulty,
            relatedRole: 'General'
        }));

        const createdSkills = await Skill.insertMany(skillDocs);
        console.log(`✅ Inserted ${createdSkills.length} Skills`);

        const skillMap = {};
        createdSkills.forEach(s => skillMap[s.skillName] = s);

        // 2. Insert Roles
        const roleDocs = [];
        REAL_ROLES.forEach(r => {
            const required = r.skills.map(sName => {
                const s = skillMap[sName];
                if (s) return { skillId: s._id, skillName: s.skillName, weight: 5, proficiencyLevel: 'advanced' };
                const randomS = getRandomItem(createdSkills);
                return { skillId: randomS._id, skillName: randomS.skillName, weight: 3, proficiencyLevel: 'intermediate' };
            }).filter(Boolean);

            roleDocs.push({
                roleName: r.name,
                domain: r.domain,
                description: `A career path for aspiring ${r.name}s.`,
                requiredSkills: required
            });
        });

        // Fill remaining roles
        for (let i = 0; i < 94; i++) {
            const domain = getRandomItem(['Healthcare', 'Finance', 'Engineering', 'Education', 'Marketing']);
            const roleName = `${domain}_Specialist_${i}`;
            const subsetSkills = getRandomSubset(createdSkills, 5).map(s => ({
                skillId: s._id,
                skillName: s.skillName,
                weight: getRandomInt(1, 5),
                proficiencyLevel: getRandomItem(['beginner', 'intermediate'])
            }));

            roleDocs.push({
                roleName: roleName,
                domain: domain,
                description: `Specialized role in ${domain}.`,
                requiredSkills: subsetSkills
            });
        }

        const createdRoles = await Role.insertMany(roleDocs);
        console.log(`✅ Inserted ${createdRoles.length} Roles`);

        // 3. Insert Users & Prepare Progress
        const userDocs = [];
        const passwordHash = await bcryptjs.hash('password123', 10);
        const degrees = ['B.Tech', 'M.Sc', 'B.A.', 'Ph.D'];

        // We will store the intended progress objects in an array that matches the valid user index
        // tempUserProgressMap[i] = [progressObjet1, progressObject2...]
        const tempUserProgressMap = {};

        for (let i = 0; i < 120; i++) {
            const targetRole = getRandomItem(createdRoles);
            const goalRoleName = targetRole.roleName;

            const roleSkills = targetRole.requiredSkills;
            const userHasSkills = [];
            const userProgressList = [];

            const numHave = Math.floor(roleSkills.length * (Math.random() * 0.7));
            const shuffledReq = [...roleSkills].sort(() => 0.5 - Math.random());

            for (let j = 0; j < numHave; j++) {
                const rs = shuffledReq[j];
                userHasSkills.push({
                    skillId: rs.skillId,
                    skillName: rs.skillName,
                    proficiency: 'intermediate',
                    yearsOfExperience: getRandomInt(1, 3)
                });

                userProgressList.push({
                    skillId: rs.skillId,
                    skillName: rs.skillName,
                    action: `Completed certification in ${rs.skillName}`,
                    completionDate: new Date(Date.now() - getRandomInt(1, 365) * 24 * 60 * 60 * 1000),
                    notes: 'Self-paced learning on Coursera.'
                });
            }

            const randomSkills = getRandomSubset(createdSkills, 2);
            randomSkills.forEach(s => {
                if (!userHasSkills.find(us => us.skillName === s.skillName)) {
                    userHasSkills.push({
                        skillId: s._id,
                        skillName: s.skillName,
                        proficiency: 'beginner',
                        yearsOfExperience: 1
                    });
                }
            });

            const readiness = Math.floor((numHave / roleSkills.length) * 100) || 0;

            userDocs.push({
                name: `User_${i}`,
                email: `user${i}_${Date.now()}@example.com`,
                password: passwordHash,
                degree: getRandomItem(degrees),
                academicYear: '2024',
                domain: targetRole.domain,
                role: 'user',
                goalRole: goalRoleName,
                currentSkills: userHasSkills,
                readiness: readiness
            });

            tempUserProgressMap[i] = userProgressList;
        }

        const createdUsers = await User.insertMany(userDocs);
        console.log(`✅ Inserted ${createdUsers.length} Users`);

        // 4. Finalize Progress & Recommendations
        const finalProgressDocs = [];
        const recDocs = [];

        // createdUsers order should match userDocs order in almost all driver versions for insertMany
        createdUsers.forEach((user, index) => {
            // Retrieve progress intended for this user index
            const intendedProgress = tempUserProgressMap[index];
            if (intendedProgress) {
                intendedProgress.forEach(p => {
                    finalProgressDocs.push({
                        userId: user._id, // LINK THE REAL ID
                        skillId: p.skillId,
                        skillName: p.skillName,
                        action: p.action,
                        completionDate: p.completionDate,
                        notes: p.notes
                    });
                });
            }

            // Create Recommendations
            const role = createdRoles.find(r => r.roleName === user.goalRole);
            if (role) {
                const userSkillIds = user.currentSkills.map(s => s.skillId.toString());
                const missing = role.requiredSkills.filter(rs => !userSkillIds.includes(rs.skillId.toString()));

                missing.forEach(m => {
                    recDocs.push({
                        userId: user._id,
                        skillId: m.skillId,
                        skillName: m.skillName,
                        priority: m.weight,
                        learningAction: `Take the "${m.skillName} Masterclass"`,
                        estimatedDays: 14,
                        status: 'pending'
                    });
                });
            }
        });

        if (finalProgressDocs.length > 0) {
            const pRes = await Progress.insertMany(finalProgressDocs);
            console.log(`✅ Inserted ${pRes.length} Progress Entries`);
        } else {
            console.log('⚠️ No Progress Entries generated (unexpected)');
        }

        if (recDocs.length > 0) {
            const rRes = await Recommendation.insertMany(recDocs);
            console.log(`✅ Inserted ${rRes.length} Recommendations`);
        }

        console.log('🎉 Seeding Complete! Data is now logical and inter-connected.');

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
