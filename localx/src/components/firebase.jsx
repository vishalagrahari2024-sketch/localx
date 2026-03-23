

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 


const firebaseConfig = {
  apiKey: "AIzaSyCUmS2mEtUVxRDwJ37Yo5DkhrDh73u-vp8",
  authDomain: "login-auth-9c2c4.firebaseapp.com",
  projectId: "login-auth-9c2c4",
  storageBucket: "login-auth-9c2c4.appspot.com",
  messagingSenderId: "862930286531",
  appId: "1:862930286531:web:7300a3d4a3d5586c3a6f76"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export const provider = new GoogleAuthProvider();

export default app;
