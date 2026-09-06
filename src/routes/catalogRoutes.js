import { Router } from "express";
import {
  getCatalogLaptopImage,
  listCatalogLaptops,
} from "../controllers/laptopController.js";

const router = Router();
router.get("/laptops", listCatalogLaptops);
router.get("/laptops/:id/image", getCatalogLaptopImage);

export default router;
