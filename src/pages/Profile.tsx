import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar, Text, Button, useTheme, Chip, IconButton, SegmentedButtons, ActivityIndicator, Menu, Portal, Modal } from 'react-native-paper';
import { auth } from '../firebase/config';
import { fetchPosts, fetchUserPosts, fetchBookmarkedPosts, Post, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, deleteProfilePhoto } from '../services/uploadService';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { collection } from 'firebase/firestore';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const user = auth.currentUser;
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Kullanıcı verilerini yükle
  useEffect(() => {
    loadUserData();
  }, []);

  // Sayfaya odaklandığında veriyi yenile (bookmark değişiklikleri için)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData(false); // Loading göstermeden güncelle
      }
    }, [user])
  );

  // Real-time kullanıcı verisi dinleyicisi
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const newData = docSnapshot.data();
        setUserData(newData);
      }
    }, (error: any) => {
      console.error('Error listening to user data:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time takipçi sayısı dinleyicisi
  useEffect(() => {
    if (!user) return;

    const followersUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'followers'),
      (snapshot) => {
        setUserData((prevData: any) => ({
          ...prevData,
          followersCount: snapshot.size
        }));
      },
      (error) => {
        console.error('Error listening to followers:', error);
      }
    );

    const followingUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'following'),
      (snapshot) => {
        setUserData((prevData: any) => ({
          ...prevData,
          followingCount: snapshot.size
        }));
      },
      (error) => {
        console.error('Error listening to following:', error);
      }
    );

    return () => {
      followersUnsubscribe();
      followingUnsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().photoURL) {
        setProfilePhoto(snap.data().photoURL);
      } else {
        setProfilePhoto(null);
      }
    };
    fetchProfilePhoto();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDoc(doc(db, 'userProfiles', user.uid), {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: profilePhoto || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }, [user, profilePhoto]);

  const loadUserData = async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading) setLoading(true);
      
      // Paralel olarak veri çek - daha hızlı
      const [userPostsData, bookmarkedData, userDoc] = await Promise.all([
        fetchUserPosts(user.uid), // Optimize edilmiş kullanıcı postları
        fetchBookmarkedPosts(user.uid), // Yeni bookmark fonksiyonu
        getDoc(doc(db, 'users', user.uid)) // Kullanıcı verileri
      ]);
      
      setUserPosts(userPostsData);
      setBookmarkedPosts(bookmarkedData);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (showLoading) {
        Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fotoğraf seçme ve yükleme fonksiyonu
  const handlePhotoUpload = async (useCamera: boolean = false) => {
    if (!user) return;
    
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kameraya erişim izni gerekli.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Fotoğraf galerisinize erişim izni gerekli.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadingPhoto(true);
        setPhotoMenuVisible(false);
        
        try {
          const photoURL = await uploadProfilePhoto(result.assets[0].uri, user.uid);
          setProfilePhoto(photoURL);
          Alert.alert('Başarılı!', 'Profil fotoğrafınız güncellendi.');
        } catch (error) {
          console.error('Error uploading photo:', error);
          Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyiniz.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fotoğraf silme fonksiyonu
  const handleDeletePhoto = async () => {
    if (!user) return;
    
    Alert.alert(
      'Fotoğrafı Sil',
      'Profil fotoğrafınızı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingPhoto(true);
              setPhotoMenuVisible(false);
              await deleteProfilePhoto(user.uid);
              setProfilePhoto(null);
              Alert.alert('Başarılı', 'Profil fotoğrafınız silindi.');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Hata', 'Fotoğraf silinirken bir hata oluştu.');
            } finally {
              setUploadingPhoto(false);
            }
          }
        }
      ]
    );
  };

  // Like işlemi - Optimistic Update  
  const handleLike = async (post: Post) => {
    if (!user) return;

    const isLiked = post.likes?.includes(user.uid) || false;
    
    // Optimistic update - UI'ı hemen güncelle
    const updatePost = (p: Post) => {
      if (p.id === post.id) {
        return isLiked 
          ? { ...p, likes: p.likes?.filter(uid => uid !== user.uid) || [] }
          : { ...p, likes: [...(p.likes || []), user.uid] };
      }
      return p;
    };
    
    setUserPosts(prev => prev.map(updatePost));
    setBookmarkedPosts(prev => prev.map(updatePost));
    
    try {
      if (isLiked) {
        await unlikePost(post.id, user.uid);
      } else {
        await likePost(post.id, user.uid);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Hata durumunda geri al
      const revertPost = (p: Post) => {
        if (p.id === post.id) {
          return isLiked 
            ? { ...p, likes: [...(p.likes || []), user.uid] }
            : { ...p, likes: p.likes?.filter(uid => uid !== user.uid) || [] };
        }
        return p;
      };
      
      setUserPosts(prev => prev.map(revertPost));
      setBookmarkedPosts(prev => prev.map(revertPost));
      
      Alert.alert('Hata', 'Beğenme işlemi sırasında bir hata oluştu');
    }
  };

  // Bookmark işlemi - Optimistic Update
  const handleBookmark = async (post: Post) => {
    if (!user) return;

    const isBookmarked = post.bookmarks?.includes(user.uid) || false;
    
    // Optimistic update - UI'ı hemen güncelle
    if (isBookmarked) {
      // Bookmark'tan kaldır
      setUserPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, bookmarks: p.bookmarks?.filter(uid => uid !== user.uid) || [] }
          : p
      ));
      setBookmarkedPosts(prev => prev.filter(p => p.id !== post.id));
    } else {
      // Bookmark'a ekle
      setUserPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, bookmarks: [...(p.bookmarks || []), user.uid] }
          : p
      ));
      // Eğer bu post zaten bookmarked posts'ta yoksa ekle
      if (activeTab === 'posts') {
        setBookmarkedPosts(prev => [post, ...prev]);
      }
    }
    
    try {
      if (isBookmarked) {
        await unbookmarkPost(post.id, user.uid);
      } else {
        await bookmarkPost(post.id, user.uid);
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      
      // Hata durumunda geri al
      if (isBookmarked) {
        setUserPosts(prev => prev.map(p => 
          p.id === post.id 
            ? { ...p, bookmarks: [...(p.bookmarks || []), user.uid] }
            : p
        ));
        setBookmarkedPosts(prev => [post, ...prev]);
      } else {
        setUserPosts(prev => prev.map(p => 
          p.id === post.id 
            ? { ...p, bookmarks: p.bookmarks?.filter(uid => uid !== user.uid) || [] }
            : p
        ));
        setBookmarkedPosts(prev => prev.filter(p => p.id !== post.id));
      }
      
      Alert.alert('Hata', 'Bookmark işlemi sırasında bir hata oluştu');
    }
  };

  // Post kartı render
  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(user?.uid || '') || false;
    const isBookmarked = item.bookmarks?.includes(user?.uid || '') || false;
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments || 0;

    return (
      <View style={styles.postCard}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.postHeader}>
            <View style={styles.postInfo}>
              <Text variant="titleMedium" style={[styles.postTitle, { color: theme.colors.onBackground }]} numberOfLines={4}>
                {item.title}
              </Text>
                              <Text variant="bodyMedium" style={[styles.postContent, { color: theme.colors.onSurfaceVariant }]} numberOfLines={5}>
                  {(() => {
                    let cleanContent = item.content
                      .replace(/<img[^>]*>/gi, '') // img taglarını kaldır
                      .replace(/<[^>]*>/g, '') // Diğer HTML taglarını kaldır
                      .replace(/\[IMAGE:[^\]]+\]/g, '') // [IMAGE:url] placeholder'larını kaldır
                      .replace(/!\[.*?\]\(.*?\)/g, '') // Markdown image formatını kaldır ![alt](url)
                      .replace(/\[.*?\]\(.*?\)/g, '') // Markdown link formatını kaldır [text](url)
                      .replace(/#{1,6}\s/g, '') // Markdown başlık formatını kaldır (# ## ### vb.)
                      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold formatını kaldır **text**
                      .replace(/\*(.*?)\*/g, '$1') // Italic formatını kaldır *text*
                      .replace(/`(.*?)`/g, '$1') // Code formatını kaldır `code`
                      .replace(/\s+/g, ' ') // Fazla boşlukları temizle
                      .trim();
                    
                    return cleanContent.length > 180 ? cleanContent.substring(0, 180) + '...' : cleanContent;
                  })()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>
            {item.imageUrl && (
              <Avatar.Image 
                size={60} 
                source={{ uri: item.imageUrl }}
                style={styles.postThumbnail}
              />
            )}
          </View>

          <View style={styles.postMeta}>
            <Chip 
              mode="outlined"
              compact
              style={styles.categoryChip}
              textStyle={{ fontSize: 13, fontWeight: '500' }}
            >
              {item.category}
            </Chip>
            
            <View style={styles.postActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleLike(item);
                }}
                style={styles.actionButton}
              >
                <Icon
                  name={isLiked ? "heart" : "heart-outline"}
                  color={isLiked ? "#e74c3c" : theme.colors.onSurfaceVariant}
                  size={16}
                />
                <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                  {likesCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
              >
                <Icon
                  name="comment-outline"
                  color={theme.colors.onSurfaceVariant}
                  size={16}
                />
                <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                  {commentsCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleBookmark(item);
                }}
                style={styles.actionButton}
              >
                <Icon
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  color={isBookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  size={16}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const tabs = [
    { value: 'posts', label: 'GÖNDERİLER' },
    { value: 'bookmarks', label: 'KAYDEDİLENLER' }
  ];

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
          Giriş Yapmanız Gerekiyor
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 16 }}
        >
          Giriş Yap
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Profil
        </Text>
        <IconButton icon="dots-vertical" size={24} onPress={() => {}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Fotoğrafı ve Bilgiler */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => setPhotoMenuVisible(true)}
              activeOpacity={0.7}
              style={styles.avatarWrapper}
            >
              {profilePhoto ? (
                <Avatar.Image
                  size={120}
                  source={{ uri: profilePhoto }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Icon
                  size={120}
                  icon="account"
                  style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                />
              )}
              
              <View style={styles.avatarOverlay}>
                <View style={styles.overlayContent}>
                  <Icon name="camera" size={24} color="white" />
                  <Text style={styles.overlayText}>Değiştir</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Menu
              visible={photoMenuVisible}
              onDismiss={() => setPhotoMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={[styles.menu, { position: 'relative', top: 10 }]}
            >
              <Menu.Item 
                onPress={() => {
                  setPhotoMenuVisible(false);
                  handlePhotoUpload(false);
                }}
                title="Galeriden Seç"
                leadingIcon="image"
              />
              <Menu.Item 
                onPress={() => {
                  setPhotoMenuVisible(false);
                  handlePhotoUpload(true);
                }}
                title="Fotoğraf Çek"
                leadingIcon="camera"
              />
              {profilePhoto && (
                <Menu.Item 
                  onPress={() => {
                    setPhotoMenuVisible(false);
                    handleDeletePhoto();
                  }}
                  title="Fotoğrafı Sil"
                  leadingIcon="delete"
                  titleStyle={{ color: theme.colors.error }}
                />
              )}
            </Menu>
          </View>

          <View style={styles.userInfo}>
            <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onBackground }]}>
              {user.displayName || 'İsimsiz Kullanıcı'}
            </Text>
            
            <View style={styles.usernameRow}>
              <Icon name="account" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.username, { color: theme.colors.onSurfaceVariant }]}>
                @{user.email?.split('@')[0] || 'kullanıcı'}
              </Text>
            </View>

            <View style={styles.emailRow}>
              <Icon name="email" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {userData?.followersCount || 0}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Takipçi
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {userData?.followingCount || 0}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Takip
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {userPosts.length}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Gönderi
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={tabs}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Content */}
        <View style={styles.tabContent}>
          {activeTab === 'posts' ? (
            <FlatList
              data={userPosts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                              <View style={styles.emptyContainer}>
                <Icon name="post-outline" size={64} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 16 }}>
                  Henüz gönderi yok
                </Text>
                  <Button 
                    mode="contained" 
                    onPress={() => navigation.navigate('CreatePost')}
                    style={{ marginTop: 16 }}
                  >
                    İlk Gönderini Oluştur
                  </Button>
                </View>
              )}
            />
          ) : (
            <FlatList
              data={bookmarkedPosts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                              <View style={styles.emptyContainer}>
                <Icon name="bookmark-outline" size={64} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 16 }}>
                  Henüz kaydedilen gönderi yok
                </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Fotoğraf Önizleme Modalı */}
      <Portal>
        <Modal
          visible={previewVisible}
          onDismiss={() => setPreviewVisible(false)}
          contentContainerStyle={styles.modalContainer}
          dismissable={true}
        >
          {profilePhoto && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: profilePhoto }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatar: {
    width: 120,
    height: 120,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  overlayText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    marginLeft: 6,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  email: {
    marginLeft: 6,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postInfo: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postContent: {
    lineHeight: 20,
  },
  postThumbnail: {
    borderRadius: 4,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  categoryChip: {
    height: 30,
    paddingHorizontal: 10,
    maxWidth: 150,
    borderRadius: 15,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContainer: {
    margin: 0,
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  menu: {
    marginTop: 8,
    width: 200,
    alignSelf: 'center',
  },
}); 