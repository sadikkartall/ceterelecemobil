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
  limit,
  where,
  serverTimestamp
} from 'firebase/firestore';

// Tüm gönderileri getir
export async function getPosts(limitCount = 10, type = 'recent') {
  try {
    let q;
    
    switch (type) {
      case 'popular':
        // Popüler gönderileri beğeni sayısına göre sırala
        q = query(
          collection(db, 'posts'),
          orderBy('likeCount', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        break;
        
      case 'following':
        // Şu an için takip edilen kullanıcı özelliği olmadığı için
        // normal gönderiler gösteriliyor
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        // Not: Takip sistemi eklendiğinde, burayı güncellemek gerekecek
        break;
        
      case 'recent':
      default:
        // En son gönderileri getir
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        break;
    }
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
}

// Belirli bir kullanıcının gönderilerini getir
export async function getUserPosts(userId) {
  try {
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
}

// Gönderi detaylarını getir
export async function getPostById(postId) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      return {
        id: postSnap.id,
        ...postSnap.data()
      };
    } else {
      throw new Error('Post not found');
    }
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
}

// Yeni gönderi oluştur
export async function createPost(postData, userId) {
  try {
    const postRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0
    });
    
    return postRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Gönderiyi güncelle
export async function updatePost(postId, updatedData) {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// Gönderiyi sil
export async function deletePost(postId) {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
} 