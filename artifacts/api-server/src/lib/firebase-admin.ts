import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

const initFirebaseAdmin = (): Auth => {
  if (getApps().length > 0) return getAuth();

  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables. Firebase Admin might not initialize correctly if not in GCP environment.");
        credential = applicationDefault();
    }
    
    initializeApp({
      credential,
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }
  
  return getAuth();
};

export const firebaseAuth = initFirebaseAdmin();
