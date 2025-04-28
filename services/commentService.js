import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Bir gönderinin yorumlarını getir
export async function getCommentsByPostId(postId) {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
}

// Yorum ekle
export async function addComment(postId, userId, content) {
  try {
    // Yorumu ekle
    const commentRef = await addDoc(collection(db, 'comments'), {
      postId,
      userId,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Gönderi yorum sayısını artır
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
    
    return commentRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Yorumu güncelle
export async function updateComment(commentId, updatedContent) {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      content: updatedContent,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

// Yorumu sil
export async function deleteComment(commentId, postId) {
  try {
    // Yorumu sil
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);
    
    // Gönderi yorum sayısını azalt
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
} 