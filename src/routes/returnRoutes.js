import { Router } from 'express';
import { createReturn, listReturns } from '../controllers/returnController.js';
import { adminOnly, protect, requireBranch } from '../middleware/auth.js';
const router = Router();
router.use(protect, requireBranch, adminOnly);
router.get('/', listReturns);
router.post('/', createReturn);
export default router;
