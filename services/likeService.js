import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  updateDoc,
  increment
} from 'firebase/firestore';

// Kullanıcı gönderiyi beğenmiş mi kontrol et
export async function checkIfLiked(postId, userId) {
  try {
    const q = query(
      collection(db, 'likes'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking like status:', error);
    throw error;
  }
}

// Gönderiyi beğen
export async function addLike(postId, userId) {
  try {
    // Zaten beğenilmiş mi kontrol et
    const isAlreadyLiked = await checkIfLiked(postId, userId);
    if (isAlreadyLiked) {
      return false; // Zaten beğenilmiş
    }
    
    // Beğeni ekle
    await addDoc(collection(db, 'likes'), {
      postId,
      userId,
      createdAt: new Date().toISOString()
    });
    
    // Gönderi beğeni sayısını artır
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likeCount: increment(1)
    });
    
    return true;
  } catch (error) {
    console.error('Error adding like:', error);
    throw error;
  }
}

// Beğeniyi kaldır
export async function removeLike(postId, userId) {
  try {
    // Beğeni belgesi bul
    const q = query(
      collection(db, 'likes'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return false; // Beğeni zaten yok
    }
    
    // Beğeniyi sil
    const likeDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, 'likes', likeDoc.id));
    
    // Gönderi beğeni sayısını azalt
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likeCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('Error removing like:', error);
    throw error;
  }
}

// Bir gönderinin tüm beğenilerini getir
export async function getLikesByPostId(postId) {
  try {
    const q = query(
      collection(db, 'likes'),
      where('postId', '==', postId)
    );
    
    const querySnapshot = await getDocs(q);
    const likes = [];
    
    querySnapshot.forEach((doc) => {
      likes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return likes;
  } catch (error) {
    console.error('Error getting likes:', error);
    throw error;
  }
} 