import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

// Dev-only fallback. Production boot refuses this value (see validateDeployEnvironment in lib/modes.ts).
const DEV_SESSION_SECRET = "local_dev_secret_key_permionics_2026";
const SESSION_SECRET = process.env["SESSION_SECRET"] || DEV_SESSION_SECRET;
const COOKIE_NAME = "bd_session";
const TOKEN_EXPIRY = "7d";

export type UserRole = "admin" | "operator" | "user";

export type SessionPayload = {
  authenticated: true;
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export async function signToken(user?: { id?: string; email?: string; role?: UserRole }): Promise<string> {
  const payload = {
    authenticated: true,
    userId: user?.id || "admin-001",
    email: user?.email || getAdminEmail(),
    role: user?.role || "admin",
  };
  // Signing key is SESSION_SECRET ALONE (never combined with the admin password),
  // so a leaked admin password cannot be used to forge session tokens.
  return jwt.sign(payload, SESSION_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    return jwt.verify(token, SESSION_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string, remember: boolean): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : undefined,
  });
}

export function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

export function getTokenFromRequest(req: Request): string | null {
  return (req.cookies as Record<string, string>)?.[COOKIE_NAME] ?? null;
}

export function checkPassword(plain: string, adminPassword: string): boolean {
  return plain === adminPassword;
}

export function getAdminEmail(): string {
  return (process.env["ADMIN_EMAIL"] || "admin@permionics.com").toLowerCase().trim();
}

export async function getAdminPassword(): Promise<string> {
  // Single source of truth: the ADMIN_PASSWORD secret. The value is NEVER persisted
  // to the database (it was previously stored in plaintext as questionnaires.notes) and
  // has NO hardcoded fallback. Production boot refuses a missing value (validateDeployEnvironment).
  return process.env["ADMIN_PASSWORD"] || "";
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  // The durable admin credential lives in Firebase Auth (changed via the settings route).
  // This only updates the in-process seed used by checkPassword / ensureAdminUser; it is
  // intentionally not written to the database.
  process.env["ADMIN_PASSWORD"] = newPassword;
  return true;
}

export async function isAuthenticated(req: Request): Promise<boolean> {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}
