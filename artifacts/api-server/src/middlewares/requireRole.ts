import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken, type UserRole } from "../lib/auth";

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

    // Attach user session payload to request
    (req as any).user = payload;

    if (!allowedRoles.includes(payload.role)) {
      res.status(403).json({ error: `Access denied. Requires ${allowedRoles.join(" or ")} role.` });
      return;
    }

    next();
  };
}
