import { Router, type IRouter } from "express";
import {
  signToken,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromRequest,
  verifyToken,
  checkPassword,
  getAdminPassword,
  getAdminEmail,
  hashPassword,
  verifyPasswordHash,
} from "../lib/auth";
import { supabase } from "../lib/supabase";
import { firebaseAdmin } from "../lib/firebase-admin";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

// Login endpoint: Authenticate via Firebase ID Token
router.post("/auth/login", async (req, res): Promise<void> => {
  const { idToken, remember } = req.body as { idToken?: string; remember?: boolean };

  if (!idToken) {
    res.status(400).json({ error: "Firebase ID token is required" });
    return;
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    // Fetch user from Supabase to get role and check needs_password_reset
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (error || !user) {
       // Fallback by email if they were created before firebase_uid was saved (e.g. legacy admin)
       const { data: userByEmail } = await supabase
         .from("users")
         .select("*")
         .eq("email", email?.toLowerCase().trim())
         .single();
         
       if (userByEmail) {
          // Sync UID
          await supabase.from("users").update({ firebase_uid: firebaseUid }).eq("id", userByEmail.id);
          const token = await signToken({ id: String(userByEmail.id), email: userByEmail.email, role: userByEmail.role });
          setSessionCookie(res, token, !!remember);
          res.json({ authenticated: true, role: userByEmail.role, needsReset: userByEmail.needs_password_reset, message: "Login successful" });
          return;
       }
       
       res.status(401).json({ error: "User not found in database." });
       return;
    }

    const token = await signToken({ id: String(user.id), email: user.email, role: user.role });
    setSessionCookie(res, token, !!remember);
    res.json({ authenticated: true, role: user.role, needsReset: user.needs_password_reset, message: "Login successful" });
  } catch (err) {
    req.log.error({ err }, "Firebase token verification error");
    res.status(401).json({ error: "Invalid authentication token" });
  }
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
    let firebaseUid = "";
    try {
      const fbUser = await firebaseAdmin.auth().createUser({
        email: cleanEmail,
        password,
        displayName: name || "User"
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-exists") {
        res.status(400).json({ error: "An account with this email already exists" });
        return;
      }
      throw fbErr;
    }

    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name || "",
        email: cleanEmail,
        password_hash: passwordHash,
        role: "user",
        firebase_uid: firebaseUid
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: "Failed to create account in database" });
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
    let firebaseUid = "";
    try {
      const fbUser = await firebaseAdmin.auth().createUser({
        email: cleanEmail,
        password,
        displayName: name || "Operator"
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-exists") {
         const fbUser = await firebaseAdmin.auth().getUserByEmail(cleanEmail);
         firebaseUid = fbUser.uid;
         // Ensure password is set correctly for existing Firebase user if we are reclaiming
         await firebaseAdmin.auth().updateUser(firebaseUid, { password });
      } else {
         throw fbErr;
      }
    }

    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name || "Operator",
        email: cleanEmail,
        password_hash: passwordHash,
        role: "operator",
        firebase_uid: firebaseUid,
        needs_password_reset: true
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        // If already exists in DB, update it
        const { data: updatedData, error: updateError } = await supabase
           .from("users")
           .update({
             password_hash: passwordHash,
             firebase_uid: firebaseUid,
             needs_password_reset: true
           })
           .eq("email", cleanEmail)
           .select()
           .single();
           
        if (updateError) throw updateError;
        res.status(201).json({ success: true, operator: { id: updatedData.id, email: updatedData.email, name: updatedData.name, role: updatedData.role } });
        return;
      }
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
