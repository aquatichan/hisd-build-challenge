import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// The API key comes from .env.local (see .env.example). Other values are
// public identifiers; access is controlled by Firebase Security Rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hisd-build-challenge.firebaseapp.com",
  projectId: "hisd-build-challenge",
  storageBucket: "hisd-build-challenge.firebasestorage.app",
  messagingSenderId: "541711516022",
  appId: "1:541711516022:web:f029563b882e94bedaba57",
  measurementId: "G-3D6WLX9BHX",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
