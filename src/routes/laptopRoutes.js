import { Router } from 'express';
import { createLaptop, deleteLaptop, importLaptops, listLaptops, updateLaptop } from '../controllers/laptopController.js';

const router = Router();
router.get('/', listLaptops);
router.post('/', createLaptop);
router.post('/import', importLaptops);
router.put('/:id', updateLaptop);
router.delete('/:id', deleteLaptop);

export default router;
