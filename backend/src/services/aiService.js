import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateAIRecommendations = async (userProfile, goalRole, userSkills) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as a career coach.
            User Profile:
            - Name: ${userProfile.name}
            - Current Role: ${userProfile.role || 'Student'}
            - Goal Role: ${goalRole}
            - Current Skills: ${userSkills.map(s => `${s.skillName} (${s.proficiency})`).join(', ')}

            Based on the Gap between Current Skills and Goal Role, suggest 3-5 specific, high-priority learning recommendations.
            Focus on technical skills, tools, or concepts they are missing.
            
            Return ONLY a valid JSON array with objects containing:
            - skillName: (string) The specific skill to learn.
            - learningAction: (string) A concrete action (e.g., "Take a course on React Hooks", "Build a REST API").
            - priority: (integer) 1-5 (5 being highest/critical).
            - estimatedDays: (integer) Estimated days to learn basics.
            
            Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("AI Recommendation Error:", error);
        return null; // Return null to fall back to static logic if needed
    }
};
