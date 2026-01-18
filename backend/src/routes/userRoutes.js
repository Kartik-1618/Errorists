import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
    getProfile,
    getRoles,
    updateProfile,
    addSkill,
    getRecommendations,
    getProgress,
    logProgress,
    changePassword,
    getAvailableDomains,
} from '../controllers/userController.js';

const router = express.Router();

// Public Routes
router.get('/domains', getAvailableDomains);

// Protected Routes
router.get('/profile', verifyToken, getProfile);
router.get('/roles', verifyToken, getRoles);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.post('/skills', verifyToken, addSkill);
router.get('/recommendations', verifyToken, getRecommendations);
router.get('/progress', verifyToken, getProgress);
router.post('/progress', verifyToken, logProgress);

export default router;
