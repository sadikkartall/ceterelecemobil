import { auth, storage, db } from '../firebase/config';
import { ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';

// Base64'ten Blob oluştur
const b64ToBlob = (b64Data: string, contentType = 'image/jpeg'): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};

// Profil fotoğrafı yükleme fonksiyonu
export const uploadProfilePhoto = async (imageUri: string, userId: string): Promise<string> => {
  try {
    // 1. Get the storage reference with explicit bucket
    const filename = `users/${userId}/profile_${Date.now()}.jpg`;
    const storageRef = ref(storage, `gs://ceterelecenet.firebasestorage.app/${filename}`);

    // 2. Get file content
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 3. Upload the file
    const metadata = {
      contentType: 'image/jpeg',
    };
    const uploadResult = await uploadBytes(storageRef, blob, metadata);

    // 4. Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 5. Update auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }

    // 6. Update Firestore
    await setDoc(doc(db, 'users', userId), {
      photoURL: downloadURL,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return downloadURL;
  } catch (error) {
    console.error('Profil fotoğrafı yükleme hatası:', error);
    throw new Error(error instanceof Error ? error.message : 'Fotoğraf yüklenirken bilinmeyen bir hata oluştu');
  }
};

// Profil fotoğrafını silme fonksiyonu
export const deleteProfilePhoto = async (userId: string): Promise<void> => {
  try {
    // Get user data to find the current photo URL
    const userDoc = await getDoc(doc(db, 'users', userId));
    const photoURL = userDoc.data()?.photoURL;

    // Delete from Storage if exists
    if (photoURL && photoURL.includes(`users/${userId}`)) {
      const storageRef = ref(storage, photoURL);
      await deleteObject(storageRef);
    }

    // Update auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: null
      });
    }

    // Update Firestore
    await setDoc(doc(db, 'users', userId), {
      photoURL: null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    throw error;
  }
};

// Medya dosyası yükleme (gönderiler için)
export const uploadMediaFile = async (imageUri: string, userId: string, postId?: string): Promise<string> => {
  try {
    // URI'yi düzelt
    const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    
    // Dosyayı binary olarak oku
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `editor-images/post_${userId}_${postId || Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload the blob
    const uploadResult = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Media upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Medya yüklenirken hata oluştu: ${error.message}`);
    }
    throw new Error('Medya yüklenirken bilinmeyen bir hata oluştu');
  }
};

 