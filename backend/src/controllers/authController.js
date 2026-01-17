import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

export const signup = async (req, res) => {
    try {
        const { name, email, password, degree, academicYear, domain } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newUser = new User({
            name,
            email,
            password,
            degree,
            academicYear,
            domain,
            role: 'user',
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: 'user' },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check admin first
        let admin = await Admin.findOne({ email });
        if (admin) {
            const isPasswordValid = await admin.comparePassword(password);
            if (isPasswordValid) {
                const token = jwt.sign(
                    { userId: admin._id, email: admin.email, role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '30d' }
                );
                return res.json({
                    message: 'Admin login successful',
                    token,
                    user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
                });
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        // Check user
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'User login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: 'user' },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
