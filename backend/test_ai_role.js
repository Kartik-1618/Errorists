import dotenv from 'dotenv';
import { generateRoleSkills } from './src/services/aiService.js';

dotenv.config();

const testAI = async () => {
    console.log('Testing AI Role Generation...');
    const role = 'Quantum Computing Scientist';
    const domain = 'Future Tech';

    try {
        const data = await generateRoleSkills(role, domain);
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
};

testAI();
