import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const isEmulatorMode = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true" || import.meta.env.DEV;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (isEmulatorMode ? "demo-api-key" : ""),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (isEmulatorMode ? "127.0.0.1" : ""),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (isEmulatorMode ? "demo-permionics" : ""),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null as any;

if (auth && isEmulatorMode) {
  try {
    const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || "127.0.0.1:9099";
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
    console.log(`🔥 Frontend connected to Firebase Auth Emulator at http://${emulatorHost}`);
  } catch (err) {
    // Prevent duplicate connection warning on hot reloads
  }
}

