// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD5h-Ezu83f1KqhVhUjJMhClTXBdBLup20",
  authDomain: "ceterelecenet.firebaseapp.com",
  projectId: "ceterelecenet",
  storageBucket: "ceterelecenet.firebasestorage.app",
  messagingSenderId: "424785111488",
  appId: "1:424785111488:web:c997563cefd7b65918c025",
  measurementId: "G-ZFWF6EV9JD"
};

// Firebase uygulamasını başlat
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Firebase servislerini başlat
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, "gs://ceterelecenet.firebasestorage.app");

export { auth, db, storage };
