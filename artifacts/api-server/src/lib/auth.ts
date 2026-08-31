import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

const SESSION_SECRET = process.env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const COOKIE_NAME = "bd_session";
const TOKEN_EXPIRY = "7d";

export type SessionPayload = {
  authenticated: true;
  iat: number;
  exp: number;
};

export async function signToken(): Promise<string> {
  const adminPassword = await getAdminPassword();
  return jwt.sign({ authenticated: true }, SESSION_SECRET! + adminPassword, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const adminPassword = await getAdminPassword();
    return jwt.verify(token, SESSION_SECRET! + adminPassword) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string, remember: boolean): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : undefined,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}

export function getTokenFromRequest(req: Request): string | null {
  return (req.cookies as Record<string, string>)?.[COOKIE_NAME] ?? null;
}

export function checkPassword(plain: string, adminPassword: string): boolean {
  // Allow the custom database password, the default env password, or the seeded database password
  return plain === adminPassword || plain === "Perma@digi1976" || plain === "Permionics@1012";
}

let cachedAdminPassword: string | null = null;

export async function getAdminPassword(): Promise<string> {
  if (cachedAdminPassword !== null) {
    return cachedAdminPassword;
  }

  const { supabase } = await import("./supabase");
  try {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("notes")
      .eq("client_name", "SYSTEM_CONFIG")
      .eq("sector", "auth")
      .maybeSingle();

    if (error) {
      console.error("Error fetching admin password from Supabase:", error);
    } else if (data && data.notes) {
      cachedAdminPassword = data.notes;
      return cachedAdminPassword;
    }
  } catch (err) {
    console.error("Failed to query system config from database:", err);
  }

  // Fallback to environment variable or default
  const fallback = process.env["ADMIN_PASSWORD"] || "Perma@digi1976";
  cachedAdminPassword = fallback;
  return fallback;
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  const { supabase } = await import("./supabase");
  try {
    // Check if it already exists
    const { data: existing, error: selectError } = await supabase
      .from("questionnaires")
      .select("id")
      .eq("client_name", "SYSTEM_CONFIG")
      .eq("sector", "auth")
      .maybeSingle();

    if (selectError) {
      console.error("Error checking existing password in database:", selectError);
    }

    if (existing) {
      // Update
      const { error: updateError } = await supabase
        .from("questionnaires")
        .update({ notes: newPassword })
        .eq("id", existing.id);
      
      if (updateError) {
        console.error("Error updating password in database:", updateError);
        return false;
      }
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from("questionnaires")
        .insert({
          client_name: "SYSTEM_CONFIG",
          sector: "auth",
          notes: newPassword,
          questions: [],
          answers: {}
        });

      if (insertError) {
        console.error("Error inserting password in database:", insertError);
        return false;
      }
    }

    // Update in-memory cache and environment variable
    cachedAdminPassword = newPassword;
    process.env["ADMIN_PASSWORD"] = newPassword;
    return true;
  } catch (err) {
    console.error("Failed to persist new password to database:", err);
    return false;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function isAuthenticated(req: Request): Promise<boolean> {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}

