import { Router, type IRouter } from "express";
import {
  signToken,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromRequest,
  verifyToken,
  checkPassword,
  getAdminPassword,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { password, remember } = req.body as { password?: string; remember?: boolean };

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const adminPassword = await getAdminPassword();
  if (!adminPassword) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (!checkPassword(password, adminPassword)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = await signToken();
  setSessionCookie(res, token, !!remember);
  res.json({ authenticated: true, message: "Login successful" });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ authenticated: false, message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.json({ authenticated: false });
    return;
  }
  const payload = await verifyToken(token);
  if (!payload) {
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true });
});

export default router;
