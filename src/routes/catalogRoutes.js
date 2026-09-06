import { Router } from "express";
import { listCatalogLaptops } from "../controllers/laptopController.js";

const router = Router();
router.get("/laptops", listCatalogLaptops);

export default router;
