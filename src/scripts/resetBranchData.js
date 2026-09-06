import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { seedAdmin } from "../controllers/authController.js";
import Customer from "../models/Customer.js";
import Laptop from "../models/Laptop.js";
import Order from "../models/Order.js";
import Return from "../models/Return.js";
import User from "../models/User.js";

if (!process.argv.includes("--confirm")) {
  console.error("Refusing to delete data without --confirm");
  process.exit(1);
}

try {
  await connectDatabase();
  await Promise.all([
    Return.deleteMany({}),
    Order.deleteMany({}),
    Customer.deleteMany({}),
    Laptop.deleteMany({}),
    User.deleteMany({ role: { $ne: "super_admin" } }),
  ]);
  await seedAdmin();
  console.log(
    "Old operational data removed; the single-tenant database and super admin are ready.",
  );
} finally {
  await mongoose.disconnect();
}
