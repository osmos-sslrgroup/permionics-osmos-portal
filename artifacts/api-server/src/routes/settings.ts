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

  const adminPassword = await getAdminPassword();
  if (!adminPassword) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (!checkPassword(currentPassword, adminPassword)) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const success = await setAdminPassword(newPassword);
  if (!success) {
    res.status(500).json({ error: "Failed to persist new password to database" });
    return;
  }

  req.log.info("Admin password changed");
  res.json({
    authenticated: true,
    message: "Password updated successfully in database.",
  });
});

router.get("/settings/status", requireAuth, async (req, res): Promise<void> => {
  const dbConnected = !!process.env["SUPABASE_URL"] && !!process.env["SUPABASE_SERVICE_KEY"];
  const llmConnected = !!process.env["GROQ_API_KEY"] || !!process.env["GEMINI_API_KEY"];

  res.json({
    database: dbConnected,
    llm: llmConnected,
  });
});

export default router;
