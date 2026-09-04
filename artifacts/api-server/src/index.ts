import app from "./app";
import { logger } from "./lib/logger";
import { firebaseAuth } from "./lib/firebase-admin";
import { getAdminEmail, getAdminPassword } from "./lib/auth";
import { supabase } from "./lib/supabase";

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
    // Check if already seeded with Firebase
    const { data: existingAdmin } = await supabase
      .from("users")
      .select("firebase_uid")
      .eq("email", adminEmail)
      .single();
      
    if (existingAdmin && existingAdmin.firebase_uid) {
      logger.info("Admin user already seeded in DB. Skipping initialization.");
      return;
    }

    let firebaseUid = "";
    try {
      const fbUser = await firebaseAuth.getUserByEmail(adminEmail);
      firebaseUid = fbUser.uid;
      await firebaseAuth.updateUser(firebaseUid, { password: adminPassword });
      logger.info({ adminEmail }, "Firebase Admin user password updated.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const fbUser = await firebaseAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "Master Admin"
        });
        firebaseUid = fbUser.uid;
        logger.info({ adminEmail }, "Firebase Admin user created.");
      } else {
        throw err;
      }
    }

    // Upsert into Supabase `users` table
    const { error } = await supabase.from("users").upsert({
      email: adminEmail,
      name: "Master Admin",
      role: "admin",
      firebase_uid: firebaseUid
    }, { onConflict: "email" });

    if (error) throw error;
    logger.info("Admin user successfully synced to Supabase DB.");

  } catch (error) {
    logger.error({ error }, "Failed to initialize Admin user");
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
  const PUBLIC_URL = "https://permionics-insights-hub.onrender.com/api/healthz";
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
