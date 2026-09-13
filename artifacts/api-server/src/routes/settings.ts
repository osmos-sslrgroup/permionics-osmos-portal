import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { checkPassword, getAdminPassword, setAdminPassword } from "../lib/auth";

const router: IRouter = Router();

router.post("/settings/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Both current and new passwords are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const { getTokenFromRequest, verifyToken, checkPassword, getAdminPassword, setAdminPassword, signToken, setSessionCookie } = await import("../lib/auth");
  const { supabase } = await import("../lib/db");
  const { firebaseAuth } = await import("../lib/firebase-admin");

  const token = getTokenFromRequest(req);
  const payload = token ? await verifyToken(token) : null;

  const adminPassword = await getAdminPassword();

  let isUserPasswordUpdated = false;

  // Check if session user exists in Supabase DB with a Firebase UID
  if (payload?.userId) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.userId)
      .maybeSingle();

    if (dbUser && dbUser.firebase_uid) {
      try {
        await firebaseAuth.updateUser(dbUser.firebase_uid, { password: newPassword });
        await supabase
          .from("users")
          .update({ needs_password_reset: false })
          .eq("id", dbUser.id);
        isUserPasswordUpdated = true;
      } catch (fbErr: any) {
        req.log.warn({ fbErr }, "Firebase password update warning, falling back to admin check");
      }
    }
  }

  // Fallback / Admin check
  if (!isUserPasswordUpdated) {
    if (!adminPassword || !checkPassword(currentPassword, adminPassword)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const success = await setAdminPassword(newPassword);
    if (!success) {
      res.status(500).json({ error: "Failed to persist new password to database" });
      return;
    }
  }

  // Re-issue valid session cookie signed with current secret so session does not drop
  const newToken = await signToken({
    id: payload?.userId || "admin-001",
    email: payload?.email || "admin@permionics.com",
    role: payload?.role || "admin",
  });
  setSessionCookie(res, newToken, true);

  req.log.info("Password updated successfully");
  res.json({
    authenticated: true,
    message: "Password updated successfully.",
  });
});

router.get("/settings/status", requireAuth, async (req, res): Promise<void> => {
  const dbConnected = !!process.env["DATABASE_URL"];
  const llmConnected = !!process.env["GROQ_API_KEY"] || !!process.env["GEMINI_API_KEY"];

  res.json({
    database: dbConnected,
    llm: llmConnected,
  });
});

export default router;
