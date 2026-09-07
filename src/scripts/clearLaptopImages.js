import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Laptop from "../models/Laptop.js";

if (!process.argv.includes("--confirm")) {
  console.error("Refusing to clear image data without --confirm");
  process.exit(1);
}

try {
  await connectDatabase();
  const result = await Laptop.updateMany({}, { $set: { image: "" } });
  console.log(`Cleared image field on ${result.modifiedCount} laptop(s).`);
} finally {
  await mongoose.disconnect();
}
