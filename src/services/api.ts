import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Query,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Veri türleri
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorEmail?: string;
  category: string;
  tags?: string[];
  imageUrl?: string; // Backward compatibility
  images?: Array<{url: string, position: string}>; // New multi-image support
  likes?: string[]; // Array of user IDs who liked
  bookmarks?: string[]; // Array of user IDs who bookmarked
  comments?: number;
  views?: number;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in-progress' | 'completed';
  startDate: string;
  endDate?: string;
  client?: string;
  location?: string;
  images?: string[];
  tags?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features?: string[];
  price?: string;
  createdAt: any;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  hobbies?: string[];
  bookmarks?: string[];
  followersCount?: number; // Sub-collection count'u
  followingCount?: number; // Sub-collection count'u
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string; // Bildirimi alacak kullanıcı
  type: 'like' | 'comment' | 'follow' | 'post' | 'bookmark';
  title: string;
  message: string;
  fromUserId?: string; // Bildirimi tetikleyen kullanıcı
  fromUserName?: string;
  fromUserAvatar?: string;
  postId?: string; // İlgili gönderi (varsa)
  postTitle?: string;
  isRead: boolean;
  createdAt: any;
}

// Kategoriler
export const CATEGORIES = [
  'all', 
  'Yazılım', 
  'Donanım', 
  'Siber Güvenlik', 
  'Python', 
  'Yapay Zeka', 
  'Mobil', 
  'Web', 
  'Oyun', 
  'Veri Bilimi', 
  'Diğer'
];

// Helper function for author data
const getAuthorData = (authorDataRaw: any) => ({
  displayName: authorDataRaw?.displayName || 'Anonim',
  username: authorDataRaw?.username || 'anonim',
  photoURL: authorDataRaw?.photoURL
});

// Posts servisleri - Optimized
export const fetchPosts = async (limitCount: number = 10, category?: string): Promise<Post[]> => {
  try {
    // Kategori filtresi varsa daha fazla çek
    const fetchLimit = category && category !== 'all' ? limitCount * 3 : limitCount + 5;
    
    // Optimize edilmiş query - daha az veri çek
    let postsQuery: Query<DocumentData> = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(fetchLimit)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const posts: Post[] = [];
    
    // Her post için yazar bilgilerini çek
    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data();
      
      // Kategori filtresi (client-side)
      if (category && category !== 'all' && postData.category !== category) {
        continue;
      }
      
      // Yazar bilgilerini getir
      let authorDataRaw = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorDataRaw = authorDoc.data();
        }
      }
      
      const authorData = getAuthorData(authorDataRaw);
      
      posts.push({
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName,
        authorUsername: authorData.username,
        authorAvatar: authorData.photoURL,
        comments: postData.comments || 0, // Eksik comments field'ını 0 yap
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      } as Post);
      
      // İstenen sayıya ulaştıysak dur
      if (posts.length >= limitCount) {
        break;
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const fetchPostsByCategory = async (category: string): Promise<Post[]> => {
  return fetchPosts(50, category);
};

export const fetchPost = async (postId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const postData = docSnap.data();
      
      // Yazar bilgilerini getir
      let authorDataRaw = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorDataRaw = authorDoc.data();
        }
      }
      
      const authorData = getAuthorData(authorDataRaw);
      
      return {
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName,
        authorUsername: authorData.username,
        authorAvatar: authorData.photoURL,
        comments: postData.comments || 0, // Eksik comments field'ını 0 yap
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      } as Post;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const posts: Post[] = [];
    
    // Yazar bilgilerini bir kez çek
    let authorDataRaw = {};
    const authorDoc = await getDoc(doc(db, 'users', userId));
    if (authorDoc.exists()) {
      authorDataRaw = authorDoc.data();
    }
    
    const authorData = getAuthorData(authorDataRaw);
    
    querySnapshot.forEach((docSnap) => {
      const postData = docSnap.data();
      posts.push({
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName,
        authorUsername: authorData.username,
        authorAvatar: authorData.photoURL,
        comments: postData.comments || 0, // Eksik comments field'ını 0 yap
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Advanced Popular Posts Algorithm
export const fetchPopularPosts = async (limitCount: number = 15, category?: string): Promise<Post[]> => {
  try {
    // Daha fazla post çek analizler için (kategori filter için daha fazla)
    const fetchLimit = category && category !== 'all' ? 150 : 100;
    const posts = await fetchPosts(fetchLimit, category);
    
    // Popülerlik skoru hesapla
    const postsWithScore = posts.map(post => {
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
      const commentsCount = post.comments || 0;
      const bookmarksCount = Array.isArray(post.bookmarks) ? post.bookmarks.length : 0;
      
      // Engagement Score - Yorumlar daha değerli
      const engagementScore = (likesCount * 1.0) + (commentsCount * 2.5) + (bookmarksCount * 1.5);
      
      // Time calculations
      const now = new Date();
      const postDate = new Date(post.createdAt);
      const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
      const hoursDiff = daysDiff * 24;
      
      // Viral Content Detection - Çok kısa sürede yüksek etkileşim
      const engagementPerHour = hoursDiff > 0 ? engagementScore / hoursDiff : 0;
      
      let timeFactor = 1.0;
      if (hoursDiff <= 6 && engagementPerHour >= 2) {
        timeFactor = 2.0; // Viral olabilir - %100 bonus!
      } else if (hoursDiff <= 12 && engagementPerHour >= 1) {
        timeFactor = 1.8; // Hızlı etkileşim - %80 bonus
      } else if (daysDiff <= 1) {
        timeFactor = 1.5; // Son 24 saat - %50 bonus
      } else if (daysDiff <= 3) {
        timeFactor = 1.3; // Son 3 gün - %30 bonus  
      } else if (daysDiff <= 7) {
        timeFactor = 1.1; // Son hafta - %10 bonus
      } else if (daysDiff <= 30) {
        timeFactor = 1.0; // Son ay - normal
      } else {
        timeFactor = 0.8; // 30+ gün eski - %20 penalty
      }
      
      // Content Quality Bonus
      let qualityBonus = 1.0;
      if (post.content.length >= 200) {
        qualityBonus += 0.1; // Uzun içerik bonusu
      }
      if (post.imageUrl || (post.images && post.images.length > 0)) {
        qualityBonus += 0.1; // Medya bonusu
      }
      if (post.tags && post.tags.length > 0) {
        qualityBonus += 0.05; // Tag bonusu
      }
      
      // Final Popularity Score
      const popularityScore = engagementScore * timeFactor * qualityBonus;
      
      return {
        ...post,
        popularityScore,
        engagementScore,
        timeFactor,
        qualityBonus,
        daysDiff: Math.round(daysDiff)
      };
    });
    
    // Minimum etkileşim threshold'u - Çok az etkileşimi olanları eleme
    const minEngagementThreshold = 2; // En az 2 etkileşim (like/comment/bookmark)
    const qualifiedPosts = postsWithScore.filter(post => 
      post.engagementScore >= minEngagementThreshold
    );
    
    // Popülerlik skoruna göre sırala
    const sortedPosts = qualifiedPosts.sort((a, b) => b.popularityScore - a.popularityScore);
    
    
    
         // Extra property'leri kaldırıp clean Post array döndür
     const cleanPosts = sortedPosts.slice(0, limitCount).map(post => {
       const { popularityScore, engagementScore, timeFactor, qualityBonus, daysDiff, ...cleanPost } = post;
       return cleanPost as Post;
     });
     
     return cleanPosts;
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    throw error;
  }
};

// Takip edilen kullanıcıların gönderileri
export const fetchFollowingPosts = async (userId: string, limitCount: number = 20, category?: string): Promise<Post[]> => {
  try {
    // Kullanıcının takip ettiği kişileri sub-collection'dan çek
    const followingSnapshot = await getDocs(collection(db, 'users', userId, 'following'));
    const followingIds = followingSnapshot.docs.map(doc => doc.id);
    
    if (followingIds.length === 0) {
      return [];
    }

    // Batches halinde sorgu yap (Firestore'da 'in' operatörü max 10 değer alabilir)
    const batches = [];
    for (let i = 0; i < followingIds.length; i += 10) {
      const batch = followingIds.slice(i, i + 10);
      
      let postsQuery: Query<DocumentData> = query(
        collection(db, 'posts'),
        where('authorId', 'in', batch),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(Math.ceil(limitCount / Math.ceil(followingIds.length / 10)))
      );

      if (category && category !== 'all') {
        postsQuery = query(
          collection(db, 'posts'),
          where('authorId', 'in', batch),
          where('category', '==', category),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(Math.ceil(limitCount / Math.ceil(followingIds.length / 10)))
        );
      }

      batches.push(getDocs(postsQuery));
    }

    // Tüm batch'leri paralel çalıştır
    const batchResults = await Promise.all(batches);
    const posts: Post[] = [];

    // Sonuçları birleştir
    for (const querySnapshot of batchResults) {
      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data();
        
        // Yazar bilgilerini getir
        let authorDataRaw = {};
        if (postData.authorId) {
          const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
          if (authorDoc.exists()) {
            authorDataRaw = authorDoc.data();
          }
        }
        
        const authorData = getAuthorData(authorDataRaw);
        
        posts.push({
          id: docSnap.id,
          ...postData,
          authorName: authorData.displayName,
          authorUsername: authorData.username,
          authorAvatar: authorData.photoURL,
          comments: postData.comments || 0,
          createdAt: postData.createdAt?.toDate?.() || new Date(),
          updatedAt: postData.updatedAt?.toDate?.() || new Date()
        } as Post);
      }
    }

    // Tarihe göre sırala ve limitle
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return posts.slice(0, limitCount);
    
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return [];
  }
};

// Like işlemleri
export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });

    // Bildirim oluştur
    try {
      const postSnap = await getDoc(postRef);
      const userSnap = await getDoc(doc(db, 'users', userId));
      
      if (postSnap.exists() && userSnap.exists()) {
        const postData = postSnap.data();
        const userData = userSnap.data();
        
        await createNotification({
          userId: postData.authorId,
          type: 'like',
          title: 'Gönderiniz Beğenildi',
          message: `${userData.displayName || 'Bir kullanıcı'} gönderinizi beğendi`,
          fromUserId: userId,
          fromUserName: userData.displayName,
          fromUserAvatar: userData.photoURL,
          postId: postId,
          postTitle: postData.title,
          isRead: false
        });
      }
    } catch (notificationError) {
      console.error('Error creating like notification:', notificationError);
      // Like işlemi başarılı oldu, sadece bildirim hatası
    }
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

// Bookmark işlemleri
export const bookmarkPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      bookmarks: arrayUnion(userId)
    });
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      bookmarks: arrayUnion(postId)
    });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    throw error;
  }
};

export const unbookmarkPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      bookmarks: arrayRemove(userId)
    });
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      bookmarks: arrayRemove(postId)
    });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    throw error;
  }
};

// Comment işlemleri
export const addComment = async (postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<void> => {
  try {
    // Yorumu alt koleksiyona ekle
    const commentsRef = collection(db, 'posts', postId, 'comments');
    await addDoc(commentsRef, {
      ...commentData,
      createdAt: serverTimestamp()
    });

    // Ana post dokümanındaki yorum sayısını artır
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const currentComments = postSnap.data().comments || 0;
      await updateDoc(postRef, {
        comments: currentComments + 1
      });

      // Bildirim oluştur
      try {
        const postData = postSnap.data();
        
        await createNotification({
          userId: postData.authorId,
          type: 'comment',
          title: 'Gönderinize Yorum Yapıldı',
          message: `${commentData.authorName} gönderinize yorum yaptı`,
          fromUserId: commentData.authorId,
          fromUserName: commentData.authorName,
          fromUserAvatar: commentData.authorAvatar,
          postId: postId,
          postTitle: postData.title,
          isRead: false
        });
      } catch (notificationError) {
        console.error('Error creating comment notification:', notificationError);
        // Comment işlemi başarılı oldu, sadece bildirim hatası
      }
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const fetchComments = async (postId: string): Promise<Comment[]> => {
  try {
    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    const comments: Comment[] = [];
    
    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      comments.push({
        id: doc.id,
        ...commentData,
        createdAt: commentData.createdAt?.toDate?.() || new Date()
      } as Comment);
    });
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    // Yorumu alt koleksiyondan sil
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);

    // Ana post dokümanındaki yorum sayısını azalt
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const currentComments = postSnap.data().comments || 0;
      await updateDoc(postRef, {
        comments: Math.max(0, currentComments - 1) // Negatif olmayacak şekilde
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Yardımcı fonksiyon: Post'un gerçek yorum sayısını güncelle
export const syncPostCommentCount = async (postId: string): Promise<void> => {
  try {
    // Alt koleksiyondaki gerçek yorum sayısını say
    const commentsQuery = query(collection(db, 'posts', postId, 'comments'));
    const commentsSnapshot = await getDocs(commentsQuery);
    const actualCommentCount = commentsSnapshot.size;

    // Ana post dokümanını güncelle
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: actualCommentCount
    });


  } catch (error) {
    console.error('Error syncing comment count:', error);
    throw error;
  }
};

// Migration fonksiyonu: Tüm postların yorum sayılarını senkronize et
export const syncAllPostsCommentCounts = async (): Promise<void> => {
  try {
    const postsQuery = query(collection(db, 'posts'));
    const postsSnapshot = await getDocs(postsQuery);
    
    let updatedCount = 0;
    
    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      
      // Her post için yorum sayısını say
      const commentsQuery = query(collection(db, 'posts', postId, 'comments'));
      const commentsSnapshot = await getDocs(commentsQuery);
      const actualCommentCount = commentsSnapshot.size;
      
      // Eğer mevcut değer farklıysa güncelle
      const currentComments = postDoc.data().comments;
      if (currentComments !== actualCommentCount) {
        await updateDoc(doc(db, 'posts', postId), {
          comments: actualCommentCount
        });
        updatedCount++;
      }
    }
  } catch (error) {
    console.error('Error syncing all posts comment counts:', error);
    throw error;
  }
};

// Projects servisleri
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    // Basit query ile başlayalım - orderBy olmadan
    const projectsQuery = collection(db, 'projects');
    
    const querySnapshot = await getDocs(projectsQuery);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    
    // Client-side sıralama
    projects.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return []; // Projeler yoksa boş dizi döndür
  }
};

export const fetchProjectsByStatus = async (status: string): Promise<Project[]> => {
  try {
    // Basit query ile başlayalım
    const projectsQuery = collection(db, 'projects');
    
    const querySnapshot = await getDocs(projectsQuery);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      const projectData = doc.data();
      // Client-side filtreleme
      if (projectData.status === status) {
        projects.push({
          id: doc.id,
          ...projectData
        } as Project);
      }
    });
    
    // Client-side sıralama
    projects.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return projects;
  } catch (error) {
    console.error('Error fetching projects by status:', error);
    return [];
  }
};

// Services servisleri
export const fetchServices = async (): Promise<Service[]> => {
  try {
    // Basit query ile başlayalım
    const servicesQuery = collection(db, 'services');
    
    const querySnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];
    
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      } as Service);
    });
    
    // Client-side sıralama
    services.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return []; // Servisler yoksa boş dizi döndür
  }
};

// Real-time listeners
export const subscribeToPosts = (callback: (posts: Post[]) => void, category?: string) => {
  // Index hatası almamak için kategori filtresi olmadan dinle
  let postsQuery: Query<DocumentData> = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(50) // Daha fazla veri çekip client-side filtreleyeceğiz
  );
  
  return onSnapshot(postsQuery, async (querySnapshot) => {
    const posts: Post[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data();
      
      // Kategori filtresi (client-side)
      if (category && category !== 'all' && postData.category !== category) {
        continue;
      }
      
      // Yazar bilgilerini getir
      let authorDataRaw = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorDataRaw = authorDoc.data();
        }
      }
      
      const authorData = getAuthorData(authorDataRaw);
      
      posts.push({
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName,
        authorUsername: authorData.username,
        authorAvatar: authorData.photoURL,
        comments: postData.comments || 0, // Eksik comments field'ını 0 yap
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      } as Post);
      
      // İlk 20 gönderiyi aldıktan sonra dur
      if (posts.length >= 20) {
        break;
      }
    }
    
    callback(posts);
  });
};

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  // Basit query ile dinle
  const projectsQuery = collection(db, 'projects');
  
  return onSnapshot(projectsQuery, (querySnapshot) => {
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    
    // Client-side sıralama
    projects.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    callback(projects);
  });
};

// User servisleri
export const fetchUser = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      return {
        id: docSnap.id,
        email: userData.email || '',
        displayName: userData.displayName,
        username: userData.username,
        photoURL: userData.photoURL,
        hobbies: userData.hobbies || [],
        bookmarks: userData.bookmarks || [],
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
        updatedAt: userData.updatedAt?.toDate?.() || new Date()
      } as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Kullanıcı arama
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    // Basit arama - displayName ve username'de arama yap
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      const displayName = (userData.displayName || '').toLowerCase();
      const username = (userData.username || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      if (displayName.includes(search) || username.includes(search)) {
        users.push({
          id: doc.id,
          email: userData.email || '',
          displayName: userData.displayName,
          username: userData.username,
          photoURL: userData.photoURL,
          hobbies: userData.hobbies || [],
          bookmarks: userData.bookmarks || [],
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.updatedAt?.toDate?.() || new Date()
        });
      }
    });
    
    return users.slice(0, 10); // İlk 10 sonuç
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Follow işlemleri - Web projesiyle uyumlu (sub-collections)
export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    // Kendini takip etmeyi engelle
    if (currentUserId === targetUserId) {
      throw new Error('Kendinizi takip edemezsiniz');
    }

    // Kullanıcıların var olup olmadığını kontrol et
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    
    if (!currentUserDoc.exists()) {
      throw new Error('Takip eden kullanıcı bulunamadı');
    }
    
    if (!targetUserDoc.exists()) {
      throw new Error('Takip edilecek kullanıcı bulunamadı');
    }

    // Zaten takip ediyorsa işlem yapma
    const followingDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    if (followingDoc.exists()) {
      throw new Error('Bu kullanıcıyı zaten takip ediyorsunuz');
    }

    // Sub-collections kullanarak takip işlemi
    const batch = writeBatch(db);

    // Takip edilen kullanıcının followers alt koleksiyonuna ekle
    batch.set(doc(db, 'users', targetUserId, 'followers', currentUserId), {
      userId: currentUserId,
      followedAt: Timestamp.now()
    });

    // Takip eden kullanıcının following alt koleksiyonuna ekle
    batch.set(doc(db, 'users', currentUserId, 'following', targetUserId), {
      userId: targetUserId,
      followedAt: Timestamp.now()
    });

    // Batch işlemini gerçekleştir
    await batch.commit();

    // Bildirim oluştur
    try {
      const currentUserData = currentUserDoc.data();
      
      // Duplicate bildirim kontrolü
      const existingNotificationQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', targetUserId),
        where('fromUserId', '==', currentUserId),
        where('type', '==', 'follow')
      );
      
      const existingNotifications = await getDocs(existingNotificationQuery);
      
      if (existingNotifications.empty) {
        const notification: Omit<Notification, 'id'> = {
          userId: targetUserId,
          type: 'follow',
          title: 'Yeni Takipçi',
          message: `${currentUserData.displayName || currentUserData.email || 'Bir kullanıcı'} sizi takip etmeye başladı.`,
          fromUserId: currentUserId,
          fromUserName: currentUserData.displayName || currentUserData.email || 'Kullanıcı',
          fromUserAvatar: currentUserData.photoURL || null,
          isRead: false,
          createdAt: Timestamp.now()
        };

        await addDoc(collection(db, 'notifications'), notification);
      }
    } catch (notificationError: any) {
      console.error('Error creating follow notification:', notificationError);
      // Bildirim hatası ana işlemi engellemez
    }

    return;
  } catch (error) {
    console.error('Error in followUser:', error);
    throw error;
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    // Takip durumunu kontrol et
    const followingDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    if (!followingDoc.exists()) {
      throw new Error('Bu kullanıcıyı takip etmiyorsunuz');
    }

    // Sub-collections'dan sil
    const batch = writeBatch(db);
    
    batch.delete(doc(db, 'users', targetUserId, 'followers', currentUserId));
    batch.delete(doc(db, 'users', currentUserId, 'following', targetUserId));
    
    await batch.commit();
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    throw error;
  }
};

// Bookmark edilen postları çek
export const fetchBookmarkedPosts = async (userId: string): Promise<Post[]> => {
  try {
    // Önce kullanıcının bookmark ettiği post ID'lerini al
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    
    const userData = userDoc.data();
    const bookmarkIds = userData.bookmarks || [];
    
    if (bookmarkIds.length === 0) {
      return [];
    }
    
    // Her bookmark için post'u çek
    const bookmarkedPosts: Post[] = [];
    
    for (const postId of bookmarkIds) {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          
          // Yazar bilgilerini getir
          let authorDataRaw = {};
          if (postData.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
            if (authorDoc.exists()) {
              authorDataRaw = authorDoc.data();
            }
          }
          
          const authorData = getAuthorData(authorDataRaw);
          
          bookmarkedPosts.push({
            id: postDoc.id,
            ...postData,
            authorName: authorData.displayName,
            authorUsername: authorData.username,
            authorAvatar: authorData.photoURL,
            comments: postData.comments || 0,
            createdAt: postData.createdAt?.toDate?.() || new Date(),
            updatedAt: postData.updatedAt?.toDate?.() || new Date()
          } as Post);
        }
      } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
      }
    }
    
    // Tarihe göre sırala (en yeni önce)
    bookmarkedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return bookmarkedPosts;
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    throw error;
  }
};

// Bildirim servisleri
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  try {
    // Kendi kendine bildirim gönderme
    if (notificationData.userId === notificationData.fromUserId) {
      return;
    }

    // Follow bildirimi için duplicate kontrol
    if (notificationData.type === 'follow' && notificationData.fromUserId) {
      const existingNotificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', notificationData.userId),
        where('type', '==', 'follow'),
        where('fromUserId', '==', notificationData.fromUserId),
        where('isRead', '==', false)
      );
      
      const existingNotifications = await getDocs(existingNotificationsQuery);
      
      if (!existingNotifications.empty) {
        console.log('Follow notification already exists');
        return;
      }
    }

    await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const fetchNotifications = async (userId: string, limitCount: number = 20): Promise<Notification[]> => {
  try {
    // Index gerektirmeyen basit query
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(50) // Daha fazla çekip client-side sıralayacağız
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Notification);
    });
    
    // Client-side sıralama ve limitleme
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return notifications.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    // Basit query - sadece userId'ye göre filtrele
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Client-side filtreleme: sadece okunmamışları güncelle
      if (!data.isRead) {
        batch.update(doc.ref, { isRead: true });
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    // Basit query - sadece userId'ye göre filtrele
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    
    // Client-side sayma: sadece okunmamışları say
    let unreadCount = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.isRead) {
        unreadCount++;
      }
    });
    
    return unreadCount;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Sub-collections için yardımcı fonksiyonlar
export const getFollowersCount = async (userId: string): Promise<number> => {
  try {
    const followersSnapshot = await getDocs(collection(db, 'users', userId, 'followers'));
    return followersSnapshot.size;
  } catch (error) {
    console.error('Error getting followers count:', error);
    return 0;
  }
};

export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const followingSnapshot = await getDocs(collection(db, 'users', userId, 'following'));
    return followingSnapshot.size;
  } catch (error) {
    console.error('Error getting following count:', error);
    return 0;
  }
};

export const isFollowingUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const followingDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    return followingDoc.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

export const getUserFollowers = async (userId: string): Promise<string[]> => {
  try {
    const followersSnapshot = await getDocs(collection(db, 'users', userId, 'followers'));
    return followersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting user followers:', error);
    return [];
  }
};

export const getUserFollowing = async (userId: string): Promise<string[]> => {
  try {
    const followingSnapshot = await getDocs(collection(db, 'users', userId, 'following'));
    return followingSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting user following:', error);
    return [];
  }
}; 