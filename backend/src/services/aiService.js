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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

export const generateRoleSkills = async (roleName, domain) => {
    try {
        if (!genAI) return null;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Act as an expert job market analyst.
            I need to define the requirements for a job role: "${roleName}" in the domain of "${domain || 'General Technology'}".
            
            Please list top 5-8 essential technical skills required for this role.
            Also provide a brief description of the role itself.

            Return ONLY a valid JSON object with the following structure:
            {
                "roleDescription": "A concise description of the role...",
                "skills": [
                    {
                        "skillName": "Name of the skill (e.g. Python)",
                        "category": "Category (e.g. Programming, Cloud, Data Science)",
                        "difficulty": "One of: beginner, intermediate, advanced",
                        "proficiencyLevel": "One of: beginner, intermediate, advanced (required level)",
                        "weight": "Integer 1-5 (importance)",
                        "description": "Short description of the skill"
                    }
                ]
            }
            Do not include markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log("🤖 AI Raw Response:", text); // Debug log

        const openBrace = text.indexOf('{');
        const closeBrace = text.lastIndexOf('}');

        if (openBrace === -1 || closeBrace === -1) {
            throw new Error("AI response did not contain JSON.");
        }

        const lastPart = text.substring(openBrace, closeBrace + 1);
        return JSON.parse(lastPart);
    } catch (error) {
        console.error("AI Role Generation Error:", error.message);
        if (error.response) {
            // Log detailed API error if available
            try {
                const body = await error.response.text(); // or .json() depending on SDK
                console.error("AI API Error Body:", body);
            } catch (e) { console.error("Could not read error body"); }
        }
        return null;
    }
};
