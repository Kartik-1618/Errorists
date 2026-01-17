import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillwill';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

export default mongoose;
