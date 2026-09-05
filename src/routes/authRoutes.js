import { Router } from 'express';
import { listPublicBranches, login, register } from '../controllers/authController.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/branches', listPublicBranches);
export default router;
