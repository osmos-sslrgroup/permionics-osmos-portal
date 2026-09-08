import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import caseStudiesRoutes from "./routes/caseStudies";
import { modesTracingMiddleware, validateDeployEnvironment } from "./lib/modes";

validateDeployEnvironment();

const app: Express = express();

app.use(modesTracingMiddleware);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS_ORIGIN: comma-separated list of allowed frontend origins.
// In dev, the Vite dev server proxies /api so CORS is not needed.
// In production, set CORS_ORIGIN to your frontend URL, e.g. https://permionics-bd.vercel.app
const rawCorsOrigins = process.env["CORS_ORIGIN"] ?? "";
const allowedOrigins = rawCorsOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests (no Origin header) always allowed
      if (!origin) return callback(null, true);
      // Localhost always allowed (dev)
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        return callback(null, true);
      }
      if (origin.endsWith("vercel.app")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS not allowed"));
    },
    credentials: true,
  }),
);
import rateLimit from "express-rate-limit";

// Rate Limiters for Security & API Cost Control
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 AI queries per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached. Please wait a minute before asking another question." },
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Apply Rate Limiters
app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/chat", aiLimiter);
app.use("/api/assistant/upload", aiLimiter);

app.use("/api", router);
app.use("/api", caseStudiesRoutes);

export default app;
