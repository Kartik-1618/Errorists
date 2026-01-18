import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import {
    getAdminDashboard,
    approveSkill,
    deleteSkill,
    addRole,
    addSkillToRole,
    getAllUsers,
    getAllSkills,
    getAllRoles,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', verifyToken, verifyAdmin, getAdminDashboard);
router.post('/approve-skill', verifyToken, verifyAdmin, approveSkill);
router.delete('/skill/:id', verifyToken, verifyAdmin, deleteSkill);
router.post('/add-role', verifyToken, verifyAdmin, addRole);
router.post('/add-skill-to-role', verifyToken, verifyAdmin, addSkillToRole);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.get('/skills', verifyToken, verifyAdmin, getAllSkills);
router.get('/roles', verifyToken, verifyAdmin, getAllRoles);

export default router;
