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
} from "../lib/auth";
import { supabase } from "../lib/db";
import { firebaseAuth } from "../lib/firebase-admin";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

// Login endpoint: Authenticate via Firebase ID Token with auto-provisioning sync to PostgreSQL
router.post("/auth/login", async (req, res): Promise<void> => {
  const { idToken, remember } = req.body as { idToken?: string; remember?: boolean };

  if (!idToken) {
    res.status(400).json({ error: "Firebase ID token is required" });
    return;
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken, true); // checkRevoked
    const firebaseUid = decodedToken.uid;
    const cleanEmail = String(decodedToken.email || "").toLowerCase().trim();

    // Fetch user from Supabase PostgreSQL by firebase_uid. A lookup ERROR (transient DB
    // failure) must NOT be treated as "user absent" — otherwise the auto-provision below
    // would overwrite an existing admin/operator row and downgrade its role to "user".
    const { data: userByUid, error: uidErr } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle();

    if (uidErr) {
      req.log.error({ err: uidErr }, "User lookup by firebase_uid failed");
      res.status(500).json({ error: "Login temporarily unavailable. Please try again." });
      return;
    }

    let user = userByUid;

    if (!user && cleanEmail) {
      // Fallback by email
      const { data: userByEmail, error: emailErr } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (emailErr) {
        req.log.error({ err: emailErr }, "User lookup by email failed");
        res.status(500).json({ error: "Login temporarily unavailable. Please try again." });
        return;
      }

      if (userByEmail) {
        await supabase.from("users").update({ firebase_uid: firebaseUid }).eq("id", userByEmail.id);
        user = { ...userByEmail, firebase_uid: firebaseUid };
      }
    }

    // Auto-provision if user exists in Firebase Auth but missing in PostgreSQL users table.
    // Role is ALWAYS "user" here: admin is seeded only via ensureAdminUser, never derived from email.
    // Both lookups above succeeded with no row, so a plain insert is correct; a concurrent
    // conflict surfaces as an error (ignored below) instead of silently downgrading a role.
    if (!user && cleanEmail) {
      const defaultRole = "user";
      const { data: newUser, error: autoErr } = await supabase
        .from("users")
        .insert({
          name: decodedToken.name || cleanEmail.split("@")[0] || "User",
          email: cleanEmail,
          role: defaultRole,
          firebase_uid: firebaseUid,
        })
        .select()
        .maybeSingle();

      if (!autoErr && newUser) {
        user = newUser;
      }
    }

    if (!user) {
      res.status(401).json({ error: "User not found in database." });
      return;
    }

    if (user.is_blocked) {
      res.status(403).json({ error: "Account suspended. Contact an administrator." });
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

// Public User Signup: creates a NEW 'user' account only. Never takes over or
// re-authenticates an existing account, and never grants admin/operator.
router.post("/auth/signup", async (req, res): Promise<void> => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  try {
    // Reject if the account already exists in PostgreSQL (never hijack/overwrite it).
    const { data: existingDbUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingDbUser) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    // Create the Firebase Auth user; a pre-existing Firebase account is also rejected
    // (we never look up and reuse an existing UID without a verified password).
    let firebaseUid = "";
    try {
      const fbUser = await firebaseAuth.createUser({
        email: cleanEmail,
        password,
        displayName: name || "User"
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-exists") {
        res.status(400).json({ error: "An account with this email already exists." });
        return;
      }
      throw fbErr;
    }

    // Insert a fresh PostgreSQL row. Public signups are ALWAYS role "user".
    const { data: dbUser, error: dbErr } = await supabase
      .from("users")
      .insert({
        name: name || cleanEmail.split("@")[0] || "User",
        email: cleanEmail,
        role: "user",
        firebase_uid: firebaseUid,
      })
      .select()
      .single();

    if (dbErr || !dbUser) {
      req.log.error({ dbErr }, "Database insert error during signup");
      // The Firebase account was created but the DB row failed. Remove the orphaned
      // Firebase account so a retry is not permanently blocked by auth/email-already-exists.
      try {
        await firebaseAuth.deleteUser(firebaseUid);
      } catch (cleanupErr: any) {
        if (cleanupErr?.code !== "auth/user-not-found") {
          req.log.warn({ cleanupErr }, "Failed to delete orphaned Firebase user after signup DB failure");
        }
      }
      res.status(500).json({ error: "Failed to sync user account to database" });
      return;
    }

    const token = await signToken({ id: String(dbUser.id), email: dbUser.email, role: dbUser.role });
    setSessionCookie(res, token, true);

    res.status(201).json({ authenticated: true, role: dbUser.role, user: { id: dbUser.id, email: dbUser.email, name: dbUser.name } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Clear the needs_password_reset flag
router.post("/auth/reset-flag", async (req, res): Promise<void> => {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updates: any = { needs_password_reset: false };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", payload.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset flag" });
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
      const fbUser = await firebaseAuth.createUser({
        email: cleanEmail,
        password,
        displayName: name || "Operator"
      });
      firebaseUid = fbUser.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-exists") {
         // Reuse the existing Firebase account WITHOUT resetting its password: an admin
         // promoting someone to operator must not silently overwrite their credentials.
         const fbUser = await firebaseAuth.getUserByEmail(cleanEmail);
         firebaseUid = fbUser.uid;
      } else {
         throw fbErr;
      }
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name || "Operator",
        email: cleanEmail,
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
      .select("id, name, email, role, created_at, is_blocked, firebase_uid")
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

// Admin-only: Toggle block status for user or operator
router.post("/auth/users/:id/block", requireRole(["admin"]), async (req, res): Promise<void> => {
  const { blocked } = req.body;

  if (typeof blocked !== "boolean") {
    res.status(400).json({ error: "blocked must be a boolean" });
    return;
  }

  try {
    const { data: user, error: fetchErr } = await supabase.from("users").select("firebase_uid, role").eq("id", req.params.id).single();
    if (fetchErr || !user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    if (user.role === "admin") {
      res.status(403).json({ error: "Cannot block an admin account" });
      return;
    }

    if (user.firebase_uid) {
      await firebaseAuth.updateUser(user.firebase_uid, { disabled: blocked });
    }

    const { error } = await supabase.from("users").update({ is_blocked: blocked }).eq("id", req.params.id);
    if (error) throw error;
    
    res.json({ success: true, is_blocked: blocked });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only: Delete user or operator
router.delete("/auth/users/:id", requireRole(["admin"]), async (req, res): Promise<void> => {
  try {
    const callerId = (req as any).user?.userId;
    if (callerId && String(callerId) === String(req.params.id)) {
      res.status(403).json({ error: "You cannot delete your own account" });
      return;
    }

    const { data: user } = await supabase.from("users").select("firebase_uid, role").eq("id", req.params.id).single();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if ((user as { role?: string }).role === "admin") {
      res.status(403).json({ error: "Cannot delete an admin account" });
      return;
    }

    if (user?.firebase_uid) {
      try {
        await firebaseAuth.deleteUser(user.firebase_uid);
      } catch (fbErr: any) {
        if (fbErr.code !== "auth/user-not-found") throw fbErr;
      }
    }

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
