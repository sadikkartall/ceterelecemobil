import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyD5h-Ezu83f1KqhVhUjJMhClTXBdBLup20",
  authDomain: "ceterelecenet.firebaseapp.com",
  projectId: "ceterelecenet",
  storageBucket: "ceterelecenet.firebasestorage.app",
  messagingSenderId: "424785111488",
  appId: "1:424785111488:web:c997563cefd7b65918c025",
  measurementId: "G-ZFWF6EV9JD"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth'u AsyncStorage ile başlat
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export default app; 