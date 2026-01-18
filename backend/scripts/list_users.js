
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillwill';

const listUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('connected');

        const users = await User.find({}, 'name email role');
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | Name: ${u.name}`);
        });
        console.log('-------------');

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

listUsers();
