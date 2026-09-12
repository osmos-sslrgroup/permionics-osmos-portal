import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

const initFirebaseAdmin = (): Auth => {
  if (getApps().length > 0) return getAuth();

  const isEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      });
      console.log("Firebase Admin initialized with Service Account Key.");
    } else {
      // Offline / Firebase Auth Emulator initialization
      const projectId = process.env.FIREBASE_PROJECT_ID || "demo-permionics";
      if (isEmulator) {
        console.log(`🔥 Firebase Admin connecting to Auth Emulator (${process.env.FIREBASE_AUTH_EMULATOR_HOST})`);
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY missing. Initializing Firebase Admin with local demo project.");
      }
      initializeApp({ projectId });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }

  return getAuth();
};

export const firebaseAuth = initFirebaseAdmin();

