import { Router } from "express";
import { listLeads, login, register } from "../controllers/authController.js";
import { adminOnly, protect } from "../middleware/auth.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/leads", protect, adminOnly, listLeads);
export default router;
