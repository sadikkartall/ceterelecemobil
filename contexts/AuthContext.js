import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  getAdditionalUserInfo,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert } from 'react-native';

// Web tarayıcı oturumlarını tamamlamaya yardımcı olur
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google ile giriş yapmak için alternatif yöntem - sadece bir web sayfasını aç
  const signInWithGoogle = async () => {
    try {
      // Kullanıcıyı Firebase Auth yönlendirme sayfasına yönlendir
      Alert.alert(
        "Google Giriş", 
        "Şu an Expo Go içinde bu özellik kullanamıyoruz. Gerçek uygulamada geliştirme derlemesi yapmanız gerekecek.",
        [
          {
            text: "Tamam",
            onPress: () => console.log("Bilgi anlaşıldı")
          }
        ]
      );
      
      return null;

    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  async function signup(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestore'da kullanıcı profili oluştur
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        createdAt: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Kullanıcı bilgilerini hemen güncelle
      const profile = await getUserProfile(result.user.uid);
      setCurrentUser({ ...result.user, profile });
      return result;
    } catch (error) {
      throw error;
    }
  }

  function signOut() {
    return firebaseSignOut(auth);
  }
  
  async function getUserProfile(userId) {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  }

  // Kullanıcı hesabını silme fonksiyonu
  async function deleteAccount(password) {
    try {
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      // Kullanıcıyı yeniden doğrula
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Kullanıcının verilerini Firestore'dan sil
      await deleteDoc(doc(db, "users", currentUser.uid));
      
      // Kullanıcının gönderilerini bul ve sil
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", currentUser.uid)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      
      // Batch kullanmak için çok fazla gönderi olabilir,
      // bu yüzden tek tek siliyoruz
      const deletePromises = [];
      postsSnapshot.forEach((postDoc) => {
        deletePromises.push(deleteDoc(doc(db, "posts", postDoc.id)));
      });
      
      await Promise.all(deletePromises);
      
      // Firebase Auth'dan kullanıcıyı sil
      await deleteUser(currentUser);
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const profile = await getUserProfile(user.uid);
          setCurrentUser({ ...user, profile });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    signOut,
    getUserProfile,
    signInWithGoogle,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 