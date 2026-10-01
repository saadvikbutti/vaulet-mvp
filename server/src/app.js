import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import vauletRoutes from "./routes/vauletRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { HttpError } from "./utils/HttpError.js";
import { requireTrustedOrigin } from "./middleware/requireTrustedOrigin.js";

const app = express();
const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0) throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
app.set("trust proxy", proxyHops);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new HttpError(403, "This website is not allowed to use the Vaulet API."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", requireTrustedOrigin);

app.get("/api/health", (req, res) => res.json({ data: { status: "ok" } }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vaulets", vauletRoutes);
app.use("/api/planner", plannerRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
