import { Request, Response, NextFunction } from "express";

export type AppMode = "debug" | "test" | "deploy";

export function getAppMode(): AppMode {
  const mode = (process.env.APP_MODE || process.env.NODE_ENV || "debug").toLowerCase();
  if (mode === "production" || mode === "deploy") return "deploy";
  if (mode === "test" || mode === "testing") return "test";
  return "debug";
}

// Redact any field whose KEY looks sensitive, at any depth (covers objects and the
// elements/fields reached while walking arrays). Matches password, currentPassword,
// newPassword, token, idToken, secret, service_key, apiKey, credentials, authorization, etc.
const SECRET_KEY_RE = /pass|token|secret|key|cred|auth/i;

function redactSecrets(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (key && SECRET_KEY_RE.test(key)) return "[REDACTED]";
      return value;
    })
  );
}

export function debugLog(tag: string, message: string, data?: any) {
  if (getAppMode() === "debug") {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG TRACE ${timestamp}] [${tag}] ${message}`);
    if (data !== undefined) {
      try {
        console.log(JSON.stringify(redactSecrets(data), null, 2));
      } catch {
        /* ignore non-serializable data */
      }
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

    // Never log request bodies for auth/settings routes (credentials, tokens).
    const sensitiveRoute = /\/auth\/|\/settings\//.test(req.originalUrl || "");
    debugLog("HTTP_IN", `${req.method} ${req.originalUrl} [ReqID: ${requestId}]`, {
      params: req.params,
      query: req.query,
      body: sensitiveRoute ? "[omitted]" : req.body,
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

    // Without CORS_ORIGIN, a separate-origin frontend (e.g. Vercel) gets no CORS headers and
    // every mutating request 403s. Fail fast at boot rather than ship a silently broken UI.
    if (!process.env["CORS_ORIGIN"]) problems.push("CORS_ORIGIN is required (exact frontend origin)");

    if (problems.length > 0) {
      // Fail fast: refuse to start a production server with missing or default secrets.
      throw new Error(`[DEPLOY MODE] Refusing to start: ${problems.join("; ")}`);
    }
  }
}
