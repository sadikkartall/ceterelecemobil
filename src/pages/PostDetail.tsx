import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { 
  Text, 
  useTheme, 
  Card,
  Avatar,
  IconButton,
  Button,
  Chip,
  TextInput,
  ActivityIndicator,
  Appbar
} from 'react-native-paper';
import { 
  fetchPost, 
  fetchComments, 
  addComment,
  deleteComment,
  likePost, 
  unlikePost, 
  bookmarkPost, 
  unbookmarkPost,
  Post, 
  Comment 
} from '../services/api';
import { auth } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PostDetailProps {
  route: {
    params: {
      postId: string;
    };
  };
  navigation: any;
}

export default function PostDetailScreen({ route, navigation }: PostDetailProps) {
  const { postId } = route.params;
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    loadPostDetail();
    loadComments();
  }, [postId]);

  const loadPostDetail = async () => {
    try {
      setLoading(true);
      const postData = await fetchPost(postId);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Hata', 'Gönderi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await fetchComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Metin içindeki [IMAGE:url] placeholder'larını ve HTML img taglarını gerçek fotoğraflarla değiştir
  const renderContentWithImages = (content: string) => {
    // Önce HTML img taglarını [IMAGE:url] formatına çevir
    let processedContent = content;
    
    // HTML img taglarını bul ve [IMAGE:url] formatına çevir
    const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    processedContent = processedContent.replace(imgTagRegex, (match, src) => {
      // URL'deki HTML entity'leri decode et
      const decodedSrc = src
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      return `[IMAGE:${decodedSrc}]`;
    });
    
    // HTML paragraph taglarını temizle
    processedContent = processedContent
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\n\s*\n/g, '\n\n') // Çoklu satırları düzenle
      .trim();
    
    // Şimdi [IMAGE:url] formatındaki placeholder'ları işle
    const parts = processedContent.split(/(\[IMAGE:[^\]]+\])/);
    
    return parts.map((part, index) => {
      const imageMatch = part.match(/\[IMAGE:([^\]]+)\]/);
      if (imageMatch) {
        const imageUrl = imageMatch[1];
        return (
          <Image 
            key={`content-image-${index}`}
            source={{ uri: imageUrl }} 
            style={styles.contentImage}
            resizeMode="cover"
          />
        );
      }
      
      // Normal metin kısmı - boş satırları paragraf olarak ayır
      if (part && part.trim()) {
        const paragraphs = part.split('\n\n').filter(p => p.trim());
        return paragraphs.map((paragraph, pIndex) => (
          <Text 
            key={`content-text-${index}-${pIndex}`} 
            variant="bodyLarge" 
            style={[styles.postBody, { color: theme.colors.onBackground }]}
          >
            {paragraph.trim()}
          </Text>
        ));
      }
      
      return null;
    });
  };

  const handleLike = async () => {
    if (!user || !post) {
      Alert.alert('Giriş Gerekli', 'Gönderiyi beğenmek için giriş yapmalısınız');
      return;
    }

    const isLiked = post.likes?.includes(user.uid) || false;
    
    try {
      if (isLiked) {
        await unlikePost(post.id, user.uid);
        setPost(prev => prev ? {
          ...prev,
          likes: prev.likes?.filter(uid => uid !== user.uid) || []
        } : null);
      } else {
        await likePost(post.id, user.uid);
        setPost(prev => prev ? {
          ...prev,
          likes: [...(prev.likes || []), user.uid]
        } : null);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Hata', 'Gönderi beğenilirken bir hata oluştu');
    }
  };

  const handleBookmark = async () => {
    if (!user || !post) {
      Alert.alert('Giriş Gerekli', 'Gönderiyi kaydetmek için giriş yapmalısınız');
      return;
    }

    const isBookmarked = post.bookmarks?.includes(user.uid) || false;
    
    try {
      if (isBookmarked) {
        await unbookmarkPost(post.id, user.uid);
        setPost(prev => prev ? {
          ...prev,
          bookmarks: prev.bookmarks?.filter(uid => uid !== user.uid) || []
        } : null);
      } else {
        await bookmarkPost(post.id, user.uid);
        setPost(prev => prev ? {
          ...prev,
          bookmarks: [...(prev.bookmarks || []), user.uid]
        } : null);
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      Alert.alert('Hata', 'Gönderi kaydedilirken bir hata oluştu');
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Hata', 'Lütfen bir yorum yazın');
      return;
    }

    setSubmittingComment(true);
    const commentContent = commentText.trim();
    
    // Optimistic update - önce UI'ı güncelle
    const tempComment = {
      id: 'temp-' + Date.now(),
      postId,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonim',
      authorAvatar: user.photoURL || undefined,
      content: commentContent,
      createdAt: new Date()
    };

    // UI'ı hemen güncelle
    setComments(prev => [tempComment, ...prev]);
    setPost(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
    setCommentText('');

    try {
      // Arka planda gerçek işlemi yap  
      await addComment(postId, {
        postId,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonim',
        authorAvatar: user.photoURL || undefined,
        content: commentContent
      });

      // Gerçek verilerle güncelle
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Hata durumunda geri al
      setComments(prev => prev.filter(comment => comment.id !== tempComment.id));
      setPost(prev => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : null);
      setCommentText(commentContent);
      
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    Alert.alert(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const commentToDelete = comments.find(c => c.id === commentId);
            
            try {
              // Optimistic update - UI'dan hemen kaldır
              setComments(prev => prev.filter(comment => comment.id !== commentId));
              setPost(prev => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : null);

              // Arka planda sil
              await deleteComment(postId, commentId);
            } catch (error) {
              console.error('Error deleting comment:', error);
              
              // Hata durumunda geri al
              if (commentToDelete) {
                setComments(prev => [commentToDelete, ...prev]);
                setPost(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
              }
              
              Alert.alert('Hata', 'Yorum silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Gönderi Detayı" />
        </Appbar.Header>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>
            Gönderi yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Gönderi Bulunamadı" />
        </Appbar.Header>
        
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={{ color: theme.colors.secondary, marginTop: 16, textAlign: 'center' }}>
            Gönderi bulunamadı
          </Text>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
            Geri Dön
          </Button>
        </View>
      </View>
    );
  }

  const isLiked = post.likes?.includes(user?.uid || '') || false;
  const isBookmarked = post.bookmarks?.includes(user?.uid || '') || false;
  const likesCount = post.likes?.length || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gönderi Detayı" />
        <Appbar.Action icon="share" onPress={() => Alert.alert('Paylaş', 'Paylaşım özelliği yakında')} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Content */}
        <Card style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.postContent}>
            
            {/* Author Info */}
            <View style={styles.authorSection}>
              {post.authorAvatar ? (
                <Avatar.Image 
                  size={48} 
                  source={{ uri: post.authorAvatar }}
                  style={styles.authorAvatar}
                />
              ) : (
                <Avatar.Icon 
                  size={48} 
                  icon="account" 
                  style={styles.authorAvatar}
                />
              )}
              <View style={styles.authorInfo}>
                <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: post.authorId })}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {post.authorName}
                  </Text>
                </TouchableOpacity>
                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                  @{post.authorUsername}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                  {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              
              <Chip 
                mode="flat"
                style={[styles.categoryChip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                {post.category}
              </Chip>
            </View>

            {/* Post Title */}
            <Text variant="headlineSmall" style={[styles.postTitle, { color: theme.colors.onBackground }]}>
              {post.title}
            </Text>

            {/* Post Content with Embedded Images */}
            <View style={styles.contentContainer}>
              {renderContentWithImages(post.content)}
            </View>

            {/* Backward compatibility - show old single image if exists */}
            {post.imageUrl && !post.content.includes('[IMAGE:') && (
              <Card.Cover 
                source={{ uri: post.imageUrl }} 
                style={styles.postMedia}
              />
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {post.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    mode="outlined" 
                    compact 
                    style={styles.tagChip}
                  >
                    #{tag}
                  </Chip>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <View style={styles.actionButton}>
                <IconButton
                  icon={isLiked ? "heart" : "heart-outline"}
                  iconColor={isLiked ? "#e74c3c" : theme.colors.secondary}
                  size={24}
                  onPress={handleLike}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
                  {likesCount}
                </Text>
              </View>

              <View style={styles.actionButton}>
                <IconButton
                  icon="comment-outline"
                  iconColor={theme.colors.secondary}
                  size={24}
                  onPress={() => {}} // Scroll to comments
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
                  {comments.length}
                </Text>
              </View>

              <IconButton
                icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                iconColor={isBookmarked ? theme.colors.primary : theme.colors.secondary}
                size={24}
                onPress={handleBookmark}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <Card style={[styles.commentsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.commentsTitle, { color: theme.colors.onBackground }]}>
              Yorumlar ({comments.length})
            </Text>

            {/* Add Comment */}
            {user && (
              <View style={styles.addCommentContainer}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Yorumunuzu yazın..."
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.commentInput}
                  maxLength={500}
                />
                <View style={styles.commentActions}>
                  <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                    {commentText.length}/500
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    loading={submittingComment}
                    compact
                  >
                    Yorum Ekle
                  </Button>
                </View>
              </View>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Icon name="comment-outline" size={48} color={theme.colors.secondary} />
                <Text variant="titleMedium" style={{ color: theme.colors.secondary, marginTop: 16 }}>
                  Henüz yorum yapılmamış
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, textAlign: 'center' }}>
                  İlk yorumu sen yap!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      {comment.authorAvatar ? (
                        <Avatar.Image 
                          size={32} 
                          source={{ uri: comment.authorAvatar }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <Avatar.Icon 
                          size={32} 
                          icon="account" 
                          style={styles.commentAvatar}
                        />
                      )}
                      <View style={styles.commentAuthor}>
                        <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                          {comment.authorName}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                          {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      
                      {/* Silme butonu - sadece kendi yorumlarında */}
                      {user && comment.authorId === user.uid && (
                        <IconButton
                          icon="delete"
                          iconColor={theme.colors.error}
                          size={16}
                          onPress={() => handleDeleteComment(comment.id)}
                          style={styles.deleteButton}
                        />
                      )}
                    </View>
                    <Text variant="bodyMedium" style={[styles.commentContent, { color: theme.colors.onBackground }]}>
                      {comment.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    flex: 1,
  },
  postCard: {
    margin: 16,
    elevation: 2,
  },
  postContent: {
    padding: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  authorAvatar: {
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  postTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 32,
  },
  contentContainer: {
    marginBottom: 16,
  },
  postBody: {
    lineHeight: 24,
    marginBottom: 8,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
  },
  postMedia: {
    borderRadius: 12,
    marginBottom: 16,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  middleImagesPlaceholder: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  commentsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  commentsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addCommentContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  commentInput: {
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentAuthor: {
    flex: 1,
  },
  commentContent: {
    lineHeight: 20,
    paddingLeft: 40,
  },
  deleteButton: {
    marginLeft: 'auto',
  },
}); 