
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkFPM9tyEhOX8u58_u0JwK5x12P_yAE44",
  authDomain: "black-beach-464110-j9.firebaseapp.com",
  projectId: "black-beach-464110-j9",
  storageBucket: "black-beach-464110-j9.firebasestorage.app",
  messagingSenderId: "896146425398",
  appId: "1:896146425398:web:a02bb5a9bb90f9400efa97",
  measurementId: "G-DJKDL8P9ZL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);

export const Auth = getAuth(app);
export const db = getFirestore(app)