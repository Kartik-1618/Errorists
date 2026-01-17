import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getAllSkills, getSkillsByRole } from '../controllers/skillController.js';

const router = express.Router();

router.get('/', getSkillsByRole);
router.get('/all', getAllSkills);

export default router;
