import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPostById } from '../../services/postService';
import { 
  getCommentsByPostId, 
  addComment 
} from '../../services/commentService';
import { 
  checkIfLiked, 
  addLike, 
  removeLike 
} from '../../services/likeService';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  // Kullanıcı yoksa login sayfasına yönlendirmek için useEffect kullan
  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    } else {
      loadPost();
    }
  }, [currentUser, router, id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await getPostById(id);
      setPost(postData);
      
      // Yorumları yükle
      const commentsData = await getCommentsByPostId(id);
      setComments(commentsData);
      
      // Beğeni durumunu kontrol et
      if (currentUser) {
        const liked = await checkIfLiked(id, currentUser.uid);
        setIsLiked(liked);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Hata', 'Gönderi yüklenirken bir sorun oluştu.');
      setTimeout(() => {
        router.back();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      if (isLiked) {
        await removeLike(id, currentUser.uid);
        setIsLiked(false);
        setPost(prev => ({ ...prev, likeCount: (prev.likeCount || 1) - 1 }));
      } else {
        await addLike(id, currentUser.uid);
        setIsLiked(true);
        setPost(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      setSubmitting(true);
      const commentId = await addComment(id, currentUser.uid, newComment.trim());
      
      // Yeni yorumu ekle
      const newCommentObj = {
        id: commentId,
        content: newComment.trim(),
        userId: currentUser.uid,
        postId: id,
        createdAt: new Date().toISOString()
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <Text style={[styles.errorText, isDarkMode && styles.darkText]}>
          Gönderi bulunamadı.
        </Text>
      </View>
    );
  }

  const formattedDate = new Date(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt).toLocaleDateString();

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={[styles.postCard, isDarkMode && styles.darkPostCard]}>
          <Text style={[styles.postTitle, isDarkMode && styles.darkText]}>
            {post.title}
          </Text>
          
          <Text style={[styles.postMeta, isDarkMode && styles.darkMeta]}>
            {formattedDate}
          </Text>
          
          <Text style={[styles.postContent, isDarkMode && styles.darkText]}>
            {post.content}
          </Text>
          
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#e74c3c" : (isDarkMode ? "#fff" : "#333")} 
              />
              <Text style={[styles.actionText, isDarkMode && styles.darkText]}>
                {post.likeCount || 0}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionButton}>
              <Ionicons 
                name="chatbubble-outline" 
                size={22} 
                color={isDarkMode ? "#fff" : "#333"} 
              />
              <Text style={[styles.actionText, isDarkMode && styles.darkText]}>
                {post.commentCount || 0}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Yorumlar
          </Text>
          
          <View style={[styles.commentInputContainer, isDarkMode && styles.darkCommentInputContainer]}>
            <TextInput
              style={[styles.commentInput, isDarkMode && styles.darkCommentInput]}
              placeholder="Yorum yap..."
              placeholderTextColor={isDarkMode ? '#999' : '#777'}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!newComment.trim() || submitting) && styles.disabledButton]} 
              onPress={handleAddComment}
              disabled={!newComment.trim() || submitting}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {comments.length === 0 ? (
            <Text style={[styles.noCommentsText, isDarkMode && styles.darkMeta]}>
              Henüz yorum yapılmamış. İlk yorumu sen yap!
            </Text>
          ) : (
            comments.map((comment) => {
              const commentDate = new Date(comment.createdAt?.toDate ? comment.createdAt.toDate() : comment.createdAt).toLocaleDateString();
              
              return (
                <View key={comment.id} style={[styles.commentItem, isDarkMode && styles.darkCommentItem]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, isDarkMode && styles.darkText]}>
                      Kullanıcı
                    </Text>
                    <Text style={[styles.commentDate, isDarkMode && styles.darkMeta]}>
                      {commentDate}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, isDarkMode && styles.darkText]}>
                    {comment.content}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkPostCard: {
    backgroundColor: '#1e1e1e',
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  postMeta: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#333',
  },
  commentsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkCommentInputContainer: {
    backgroundColor: '#1e1e1e',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#333',
  },
  darkCommentInput: {
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#4285F4',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  commentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  darkCommentItem: {
    backgroundColor: '#1e1e1e',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  darkText: {
    color: '#f0f0f0',
  },
  darkMeta: {
    color: '#aaa',
  },
}); 