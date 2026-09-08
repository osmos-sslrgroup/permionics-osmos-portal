import { Request, Response, NextFunction } from "express";

export type AppMode = "debug" | "test" | "deploy";

export function getAppMode(): AppMode {
  const mode = (process.env.APP_MODE || process.env.NODE_ENV || "debug").toLowerCase();
  if (mode === "production" || mode === "deploy") return "deploy";
  if (mode === "test" || mode === "testing") return "test";
  return "debug";
}

export function debugLog(tag: string, message: string, data?: any) {
  if (getAppMode() === "debug") {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG TRACE ${timestamp}] [${tag}] ${message}`);
    if (data !== undefined) {
      // Redact sensitive keys if present
      const sanitizedData = JSON.parse(
        JSON.stringify(data, (key, value) => {
          if (["password", "token", "service_key", "secret"].includes(key.toLowerCase())) {
            return "[REDACTED]";
          }
          return value;
        })
      );
      console.log(JSON.stringify(sanitizedData, null, 2));
    }
  }
}

export function modesTracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const mode = getAppMode();
  (req as any).appMode = mode;

  if (mode === "debug") {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 9);
    (req as any).requestId = requestId;

    debugLog("HTTP_IN", `${req.method} ${req.originalUrl} [ReqID: ${requestId}]`, {
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
      },
    });

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      debugLog("HTTP_OUT", `${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) [ReqID: ${requestId}]`);
    });
  }

  next();
}

export function validateDeployEnvironment() {
  if (getAppMode() === "deploy") {
    const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
    const missing = requiredEnvVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`[DEPLOY MODE ERROR] Missing required environment variables: ${missing.join(", ")}`);
    }
  }
}
