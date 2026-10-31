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
    // Known development defaults that must never be used in production.
    const WEAK_VALUES = new Set([
      "local_dev_secret_key_permionics_2026",
      "permionics_local_secret_key_2026_at_least_32_chars",
      "Permionics@2026!",
      "Perma@digi1976",
    ]);

    const problems: string[] = [];
    const sessionSecret = process.env["SESSION_SECRET"];
    const adminPassword = process.env["ADMIN_PASSWORD"];

    if (!process.env["DATABASE_URL"]) problems.push("DATABASE_URL is required");
    if (!sessionSecret) problems.push("SESSION_SECRET is required");
    else if (WEAK_VALUES.has(sessionSecret)) problems.push("SESSION_SECRET must not be a known default value");
    if (!adminPassword) problems.push("ADMIN_PASSWORD is required");
    else if (WEAK_VALUES.has(adminPassword)) problems.push("ADMIN_PASSWORD must not be a known default value");

    if (problems.length > 0) {
      // Fail fast: refuse to start a production server with missing or default secrets.
      throw new Error(`[DEPLOY MODE] Refusing to start: ${problems.join("; ")}`);
    }
  }
}
