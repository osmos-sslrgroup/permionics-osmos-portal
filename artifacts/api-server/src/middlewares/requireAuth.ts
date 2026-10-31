import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken } from "../lib/auth";
import { supabase } from "../lib/db";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  // Reject suspended accounts. Best-effort: a missing row (e.g. local mock mode with no
  // users table) does not lock the user out; we only block when is_blocked is positively set.
  try {
    const { data: user } = await supabase
      .from("users")
      .select("is_blocked")
      .eq("id", payload.userId)
      .maybeSingle();
    if (user && (user as { is_blocked?: boolean }).is_blocked) {
      res.status(403).json({ error: "Account suspended" });
      return;
    }
  } catch {
    /* ignore lookup failures - do not lock out on transient errors */
  }

  (req as any).user = payload;
  next();
}
