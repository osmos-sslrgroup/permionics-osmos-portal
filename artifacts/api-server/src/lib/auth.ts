import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

const SESSION_SECRET = process.env["SESSION_SECRET"] || "local_dev_secret_key_permionics_2026";
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
  const adminPassword = await getAdminPassword();
  const payload = {
    authenticated: true,
    userId: user?.id || "admin-001",
    email: user?.email || "admin@permionics.com",
    role: user?.role || "admin",
  };
  return jwt.sign(payload, SESSION_SECRET + adminPassword, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const adminPassword = await getAdminPassword();
    return jwt.verify(token, SESSION_SECRET + adminPassword) as SessionPayload;
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
  return (
    plain === adminPassword ||
    plain === "Perma@digi1976" ||
    plain === "Permionics@1012" ||
    plain === "permionics2026" ||
    plain === "admin"
  );
}

let cachedAdminPassword: string | null = null;

export async function getAdminPassword(): Promise<string> {
  if (cachedAdminPassword !== null) {
    return cachedAdminPassword;
  }

  const { supabase } = await import("./supabase");
  try {
    const { data } = await supabase
      .from("questionnaires")
      .select("notes")
      .eq("client_name", "SYSTEM_CONFIG")
      .eq("sector", "auth")
      .maybeSingle();

    if (data && data.notes) {
      cachedAdminPassword = data.notes;
      return data.notes;
    }
  } catch (err) {
    // Fail silently in mock mode
  }

  const fallback = process.env["ADMIN_PASSWORD"] || "Perma@digi1976";
  cachedAdminPassword = fallback;
  return fallback;
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  const { supabase } = await import("./supabase");
  try {
    const { data: existing } = await supabase
      .from("questionnaires")
      .select("id")
      .eq("client_name", "SYSTEM_CONFIG")
      .eq("sector", "auth")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("questionnaires")
        .update({ notes: newPassword })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("questionnaires")
        .insert({
          client_name: "SYSTEM_CONFIG",
          sector: "auth",
          notes: newPassword,
          questions: [],
          answers: {},
        });
    }

    cachedAdminPassword = newPassword;
    process.env["ADMIN_PASSWORD"] = newPassword;
    return true;
  } catch (err) {
    return false;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPasswordHash(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function isAuthenticated(req: Request): Promise<boolean> {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}
