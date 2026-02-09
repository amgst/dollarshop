
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Firebase Config for DollarDash
 * 
 * TO FIX PERMISSION ERRORS:
 * 1. Go to your Firebase Console -> Project Overview -> Project Settings.
 * 2. Copy your actual config object below.
 * 3. Go to Firestore Database -> Rules tab.
 * 4. Change rules to:
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /{document=**} {
 *          allow read, write: if true;
 *        }
 *      }
 *    }
 */
const firebaseConfig = {
  apiKey: "AIzaSy_Placeholder_Key",
  authDomain: "dollardash-bundler.firebaseapp.com",
  projectId: "dollardash-bundler",
  storageBucket: "dollardash-bundler.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
