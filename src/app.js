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
import path from "node:path";

const app = express();
app.use(helmet());
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  ...(process.env.CLIENT_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || []),
]);
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || allowedOrigins.has(requestOrigin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
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
