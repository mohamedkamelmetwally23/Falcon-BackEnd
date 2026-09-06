import { Router } from "express";
import {
  createLaptop,
  deleteLaptop,
  importLaptops,
  listLaptops,
  updateLaptop,
} from "../controllers/laptopController.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { laptopImageUpload } from "../middleware/upload.js";

const router = Router();
router.use(protect);
router.get("/", listLaptops);
router.post("/", adminOnly, laptopImageUpload.single("image"), createLaptop);
router.post("/import", adminOnly, importLaptops);
router.put("/:id", adminOnly, laptopImageUpload.single("image"), updateLaptop);
router.delete("/:id", adminOnly, deleteLaptop);

export default router;
