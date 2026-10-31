import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import caseStudiesRoutes from "./routes/caseStudies";
import { modesTracingMiddleware, validateDeployEnvironment } from "./lib/modes";

validateDeployEnvironment();

const app: Express = express();

// Render (and most PaaS) put the app behind a reverse proxy. Without this, req.ip is
// the proxy address and every client shares one rate-limit bucket. Trust the first hop.
app.set("trust proxy", 1);

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

// CORS_ORIGIN: comma-separated list of allowed frontend origins (EXACT match).
// In dev, the Vite dev server proxies /api; localhost origins are allowed automatically.
// In production, set CORS_ORIGIN to your exact frontend URL, e.g. https://osmos-xi.vercel.app
const rawCorsOrigins = process.env["CORS_ORIGIN"] ?? "";
const allowedOrigins = rawCorsOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isProd = process.env.NODE_ENV === "production";

// Exact-match allowlist. In development, any localhost / 127.0.0.1 origin is allowed.
// No suffix/prefix matching (previously any *.vercel.app and localhost.* was accepted).
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  if (!isProd) {
    try {
      const host = new URL(origin).hostname;
      if (host === "localhost" || host === "127.0.0.1") return true;
    } catch {
      /* malformed origin -> not allowed */
    }
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests (no Origin header) are allowed.
      if (!origin) return callback(null, true);
      // Reject disallowed origins cleanly (false -> no CORS headers, no 500).
      return callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);

// CSRF defense for cookie-authenticated, state-changing requests. Browsers always send
// Origin (and usually Referer) on such requests, so a page on another site cannot
// silently drive writes using the victim's session cookie.
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
function csrfOriginCheck(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (origin) {
    if (isAllowedOrigin(origin)) {
      next();
      return;
    }
    res.status(403).json({ error: "Cross-origin request blocked" });
    return;
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      if (isAllowedOrigin(new URL(referer).origin)) {
        next();
        return;
      }
    } catch {
      /* malformed referer -> treat as blocked */
    }
    res.status(403).json({ error: "Cross-origin request blocked" });
    return;
  }

  // Neither Origin nor Referer present: not a browser CSRF vector (e.g. server-to-server).
  next();
}
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
app.use("/api/assistant/documents/:id/reprocess", aiLimiter);

app.use("/api", csrfOriginCheck);
app.use("/api", router);
app.use("/api", caseStudiesRoutes);

export default app;
