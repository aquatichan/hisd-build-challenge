import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase web config (these values are public identifiers, not secrets;
// access is controlled by Firebase Security Rules).
const firebaseConfig = {
  apiKey: "AIzaSyCBP2HNe99QtTpT26wJl_K1HmYQGxtr7Ho",
  authDomain: "hisd-build-challenge.firebaseapp.com",
  projectId: "hisd-build-challenge",
  storageBucket: "hisd-build-challenge.firebasestorage.app",
  messagingSenderId: "541711516022",
  appId: "1:541711516022:web:f029563b882e94bedaba57",
  measurementId: "G-3D6WLX9BHX",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
