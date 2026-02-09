
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
  apiKey: "AIzaSyARY5ZIykjn6Nd9GphGDbyAmXwHWZBdlJQ", 
  authDomain: "dollarshop-304a0.firebaseapp.com", 
  projectId: "dollarshop-304a0", 
  storageBucket: "dollarshop-304a0.firebasestorage.app", 
  messagingSenderId: "990077363444", 
  appId: "1:990077363444:web:693d486f38db3ec096eaa1" 
}; 

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
