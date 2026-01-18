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

        // Unified Login: Check User collection (which includes Admins)
        const user = await User.findOne({ email });

        if (!user) {
            // Optional: Check legacy Admin collection if migration isn't complete? 
            // Better to enforce single source of truth.
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token based on the user's actual role
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                degree: user.degree,
                domain: user.domain
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
