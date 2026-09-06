import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import laptopRoutes from "./routes/laptopRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { connectDatabase } from "./config/database.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.get("/", (_request, response) =>
  response.json({
    message: "Laptop Inventory API",
    status: "ok",
    endpoints: {
      health: "/api/health",
      laptops: "/api/laptops",
    },
  }),
);
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api", async (_request, _response, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});
app.use("/api/laptops", laptopRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/customers", customerRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
