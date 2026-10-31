import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken, type UserRole } from "../lib/auth";
import { supabase } from "../lib/db";

export function requireRole(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Reject suspended accounts (best-effort; see requireAuth for the rationale).
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
      /* ignore lookup failures */
    }

    // Attach user session payload to request
    (req as any).user = payload;

    if (!allowedRoles.includes(payload.role)) {
      res.status(403).json({ error: `Access denied. Requires ${allowedRoles.join(" or ")} role.` });
      return;
    }

    next();
  };
}
