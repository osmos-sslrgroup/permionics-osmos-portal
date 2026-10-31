import "./lib/env";
import app from "./app";
import { logger } from "./lib/logger";
import { firebaseAuth } from "./lib/firebase-admin";
import { getAdminEmail, getAdminPassword } from "./lib/auth";
import { supabase } from "./lib/db";

const rawPort = process.env["PORT"] || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure Master Admin is synced to Firebase Auth and Supabase on startup
async function ensureAdminUser() {
  const adminEmail = getAdminEmail();
  const adminPassword = await getAdminPassword();
  
  if (!adminEmail || !adminPassword) {
    logger.warn("ADMIN_EMAIL or ADMIN_PASSWORD missing. Skipping admin initialization.");
    return;
  }

  try {
    let firebaseUid = "";
    try {
      const fbUser = await firebaseAuth.getUserByEmail(adminEmail);
      firebaseUid = fbUser.uid;
      // Do NOT reset the password on every boot: that would silently revert an
      // admin-initiated password change back to the seed value from ADMIN_PASSWORD.
      logger.info({ adminEmail }, "Firebase Admin user present.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const fbUser = await firebaseAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "Master Admin"
        });
        firebaseUid = fbUser.uid;
        logger.info({ adminEmail }, "Firebase Admin user created in Firebase Auth.");
      } else {
        throw err;
      }
    }

    // Sync firebase_uid back to PostgreSQL — autoMigrate seeds admin without it
    // since it has no Firebase SDK access. This is the only place that can write it.
    await supabase
      .from("users")
      .update({ firebase_uid: firebaseUid })
      .eq("email", adminEmail);

    logger.info("Admin firebase_uid synced to PostgreSQL DB.");
  } catch (error: any) {
    logger.error({ error: error?.message || error }, "Failed to initialize Admin user in Firebase");
  }
}

app.listen(port, async (err?: any) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  
  await ensureAdminUser();

  logger.info({ port }, "Server listening");

  // Keep Render backend awake by self-pinging every 10 minutes
  const PUBLIC_URL = "https://permionics-osmos-portal.onrender.com/api/healthz";
  setInterval(() => {
    fetch(PUBLIC_URL)
      .then((res) => {
        logger.info({ status: res.status }, "keep-alive: Self-ping successful");
      })
      .catch((err) => {
        logger.warn({ err: err.message }, "keep-alive: Self-ping failed");
      });
  }, 600000); // 10 minutes
});
