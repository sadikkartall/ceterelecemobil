import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential
} from 'firebase/auth';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../firebase/config';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth yapılandırması
const GOOGLE_CLIENT_ID = '918678311878-thqii5ocl986umk3p2ashglir8s8eo0e.apps.googleusercontent.com';

export async function signInWithGoogleAsync() {
  try {
    const redirectUri = makeRedirectUri({
      scheme: 'ceterelecemobil',
      path: 'auth'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=id_token&` +
      `scope=openid%20profile%20email&` +
      `nonce=${Math.random().toString(36)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    
    if (result.type === 'success' && result.url) {
      const idTokenMatch = result.url.match(/id_token=([^&]+)/);
      if (idTokenMatch) {
        const idToken = idTokenMatch[1];
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      } else {
        throw new Error('ID token bulunamadı');
      }
    } else {
      throw new Error('Google ile giriş iptal edildi veya başarısız oldu');
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
}; 