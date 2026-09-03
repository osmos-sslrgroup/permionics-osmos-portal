import { Router, type IRouter } from "express";
import {
  signToken,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromRequest,
  verifyToken,
  checkPassword,
  getAdminPassword,
  hashPassword,
  verifyPasswordHash,
} from "../lib/auth";
import { supabase } from "../lib/supabase";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

// Login endpoint: supports shared Admin password OR registered User/Operator email & password
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, remember } = req.body as { email?: string; password?: string; remember?: boolean };

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  // 1. Check if it's the Admin password
  const adminPassword = await getAdminPassword();
  if (checkPassword(password, adminPassword || "")) {
    const token = await signToken({ id: "admin-001", email: "admin@permionics.com", role: "admin" });
    setSessionCookie(res, token, !!remember);
    res.json({ authenticated: true, role: "admin", message: "Admin login successful" });
    return;
  }

  // 2. Otherwise check against registered users table (by email or name)
  if (email) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (user && user.password_hash) {
        const isMatch = await verifyPasswordHash(password, user.password_hash);
        if (isMatch) {
          const token = await signToken({ id: String(user.id), email: user.email, role: user.role });
          setSessionCookie(res, token, !!remember);
          res.json({ authenticated: true, role: user.role, message: `${user.role} login successful` });
          return;
        }
      }
    } catch (err) {
      req.log.error({ err }, "Database user auth error");
    }
  }

  res.status(401).json({ error: "Invalid email or password" });
});

// Public User Signup (Creates account with 'user' role)
router.post("/auth/signup", async (req, res): Promise<void> => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  try {
    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name || "",
        email: cleanEmail,
        password_hash: passwordHash,
        role: "user",
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        res.status(400).json({ error: "An account with this email already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create account" });
      return;
    }

    const token = await signToken({ id: String(data.id), email: data.email, role: "user" });
    setSessionCookie(res, token, true);

    res.status(201).json({ authenticated: true, role: "user", user: { id: data.id, email: data.email, name: data.name } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Admin-only: Create Operator Account (with email & password)
router.post("/auth/operator", requireRole(["admin"]), async (req, res): Promise<void> => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  try {
    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name || "Operator",
        email: cleanEmail,
        password_hash: passwordHash,
        role: "operator",
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: "Failed to create operator account" });
      return;
    }

    res.status(201).json({ success: true, operator: { id: data.id, email: data.email, name: data.name, role: data.role } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Admin-only: List all users & operators
router.get("/auth/users", requireRole(["admin"]), async (_req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: "Database error" });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only: Delete user or operator
router.delete("/auth/users/:id", requireRole(["admin"]), async (req, res): Promise<void> => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", req.params.id);
    if (error) {
      res.status(500).json({ error: "Failed to delete user" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ authenticated: false, message: "Logged out" });
});

// Current User Session Info
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
  res.json({ authenticated: true, user: { userId: payload.userId, email: payload.email, role: payload.role } });
});

export default router;
