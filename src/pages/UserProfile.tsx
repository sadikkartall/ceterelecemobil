import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Avatar, Text, useTheme, ActivityIndicator, Chip, Appbar, Button } from 'react-native-paper';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { 
  fetchUserPosts, 
  Post, 
  followUser, 
  unfollowUser, 
  getFollowersCount, 
  getFollowingCount, 
  isFollowingUser 
} from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert } from 'react-native';

interface UserProfileProps {
  route: { params: { userId: string } };
  navigation: any;
}

export default function UserProfile({ route, navigation }: UserProfileProps) {
  const theme = useTheme();
  const { userId } = route.params;
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          
          // Takip durumu ve sayıları yükle
          if (currentUser) {
            const [following, followersCount, followingCount] = await Promise.all([
              isFollowingUser(currentUser.uid, userId),
              getFollowersCount(userId),
              getFollowingCount(userId)
            ]);
            
            setIsFollowing(following);
            setFollowersCount(followersCount);
            setFollowingCount(followingCount);
          } else {
            const [followersCount, followingCount] = await Promise.all([
              getFollowersCount(userId),
              getFollowingCount(userId)
            ]);
            
            setFollowersCount(followersCount);
            setFollowingCount(followingCount);
          }
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, currentUser]);

  // Real-time takipçi sayısı dinleyicisi
  useEffect(() => {
    if (!userId) return;

    const followersUnsubscribe = onSnapshot(
      collection(db, 'users', userId, 'followers'),
      (snapshot) => {
        setFollowersCount(snapshot.size);
      },
      (error) => {
        console.error('Error listening to followers:', error);
      }
    );

    const followingUnsubscribe = onSnapshot(
      collection(db, 'users', userId, 'following'),
      (snapshot) => {
        setFollowingCount(snapshot.size);
      },
      (error) => {
        console.error('Error listening to following:', error);
      }
    );

    return () => {
      followersUnsubscribe();
      followingUnsubscribe();
    };
  }, [userId]);

  // Real-time takip durumu dinleyicisi
  useEffect(() => {
    if (!currentUser || !userId || currentUser.uid === userId) return;

    const followStatusUnsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid, 'following', userId),
      (docSnapshot) => {
        setIsFollowing(docSnapshot.exists());
      },
      (error) => {
        console.error('Error listening to follow status:', error);
      }
    );

    return () => followStatusUnsubscribe();
  }, [currentUser, userId]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const userPosts = await fetchUserPosts(userId);
        setPosts(userPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };
    loadPosts();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUser || !userData) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, userId);
      } else {
        await followUser(currentUser.uid, userId);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Hata', 'İşlem gerçekleştirilirken bir hata oluştu');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Kullanıcı Profili" />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Kullanıcı Bulunamadı" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Icon name="account-question" size={64} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={{ color: theme.colors.secondary, marginTop: 16, textAlign: 'center' }}>
            Kullanıcı bulunamadı
          </Text>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
            Geri Dön
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={userData.displayName || 'Kullanıcı Profili'} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {userData.photoURL ? (
            <Avatar.Image size={120} source={{ uri: userData.photoURL }} />
          ) : (
            <Avatar.Icon size={120} icon="account" />
          )}
          <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onBackground }]}>
            {userData.displayName || 'İsimsiz Kullanıcı'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
            @{userData.username || userData.email?.split('@')[0] || 'kullanıcı'}
          </Text>
          
          {/* Takip Butonu - Sadece başka kullanıcılar için göster */}
          {currentUser && currentUser.uid !== userId && (
            <View style={styles.followButtonContainer}>
              <Button
                mode={isFollowing ? "outlined" : "contained"}
                onPress={handleFollowToggle}
                loading={followLoading}
                disabled={followLoading}
                style={[styles.followButton, { 
                  borderColor: isFollowing ? theme.colors.primary : undefined 
                }]}
                contentStyle={styles.followButtonContent}
              >
                {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
              </Button>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {followersCount}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.secondary }]}>
              Takipçi
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {followingCount}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.secondary }]}>
              Takip
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {posts.length}
            </Text>
            <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.secondary }]}>
              Gönderi
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Gönderiler
          </Text>
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.postCard}
                onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                activeOpacity={0.7}
              >
                <Text style={[styles.postTitle, { color: theme.colors.onBackground }]} numberOfLines={4}>
                  {item.title}
                </Text>
                <Text style={[styles.postContent, { color: theme.colors.secondary }]} numberOfLines={5}>
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
                <View style={styles.postFooter}>
                  <Chip 
                    icon="tag" 
                    style={styles.categoryChip}
                    textStyle={{ fontSize: 13, fontWeight: '500' }}
                  >
                    {item.category}
                  </Chip>
                  <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="post-outline" size={48} color={theme.colors.secondary} />
                <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                  Henüz gönderi yok
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  userName: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  followButtonContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  followButton: {
    minWidth: 120,
  },
  followButtonContent: {
    paddingHorizontal: 16,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    height: 30,
    paddingHorizontal: 10,
    maxWidth: 150,
    borderRadius: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
}); 