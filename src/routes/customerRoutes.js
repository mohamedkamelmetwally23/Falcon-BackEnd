import { Router } from "express";
import {
  addPayment,
  createCustomer,
  listCustomers,
  updateCustomer,
} from "../controllers/customerController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.get("/", listCustomers);
router.use(adminOnly);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.post("/:id/payments", addPayment);
export default router;
