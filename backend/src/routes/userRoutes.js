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
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.get('/roles', verifyToken, getRoles);
router.put('/profile', verifyToken, updateProfile);
router.post('/skills', verifyToken, addSkill);
router.get('/recommendations', verifyToken, getRecommendations);
router.get('/progress', verifyToken, getProgress);
router.post('/progress', verifyToken, logProgress);

export default router;
