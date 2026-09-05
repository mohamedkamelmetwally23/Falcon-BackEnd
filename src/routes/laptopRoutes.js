import { Router } from 'express';
import { createLaptop, deleteLaptop, importLaptops, listLaptops, updateLaptop } from '../controllers/laptopController.js';
import { adminOnly, protect, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireBranch);
router.get('/', listLaptops);
router.post('/', adminOnly, createLaptop);
router.post('/import', adminOnly, importLaptops);
router.put('/:id', adminOnly, updateLaptop);
router.delete('/:id', adminOnly, deleteLaptop);

export default router;
