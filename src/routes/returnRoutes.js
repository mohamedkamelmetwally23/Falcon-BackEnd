import { Router } from "express";
import { createReturn, listReturns } from "../controllers/returnController.js";
import { adminOnly, protect } from "../middleware/auth.js";
const router = Router();
router.use(protect, adminOnly);
router.get("/", listReturns);
router.post("/", createReturn);
export default router;
