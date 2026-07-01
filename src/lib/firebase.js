import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHS2I6PNrioYnvF93gPisqZ8CvS_WSAZw",
  authDomain: "pendataan-geografis-kkn.firebaseapp.com",
  projectId: "pendataan-geografis-kkn",
  storageBucket: "pendataan-geografis-kkn.firebasestorage.app",
  messagingSenderId: "445320968510",
  appId: "1:445320968510:web:56799a14d51866181c546f"
};

// Initialize Firebase (menghindari inisialisasi ganda di Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
