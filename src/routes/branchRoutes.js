import { Router } from 'express';
import { createUser, listBranches, listUsers, updateUser } from '../controllers/branchController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, superAdminOnly);
router.get('/', listBranches);
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
export default router;
