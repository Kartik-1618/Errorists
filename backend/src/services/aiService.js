import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize lazily or check for key to prevent crash at startup
const getGenAI = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn("⚠️ GEMINI_API_KEY is not set. AI features will be disabled.");
        return null;
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const genAI = getGenAI();

export const generateAIRecommendations = async (userProfile, goalRole, userSkills) => {
    try {
        if (!genAI) {
            console.warn("Skipping AI generation: API Key missing.");
            return []; // Return empty suggestions or fallback
        }
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
