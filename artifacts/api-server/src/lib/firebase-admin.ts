import admin from "firebase-admin";

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) return admin;

  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables. Firebase Admin might not initialize correctly if not in GCP environment.");
        credential = admin.credential.applicationDefault();
    }
    
    admin.initializeApp({
      credential,
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }
  
  return admin;
};

export const firebaseAdmin = initFirebaseAdmin();
