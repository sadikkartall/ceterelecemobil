import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, ScrollView, TouchableOpacity, Animated, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Card, 
  Text, 
  useTheme, 
  Chip, 
  ActivityIndicator, 
  Button,
  Searchbar,
  Avatar,
  IconButton,
  SegmentedButtons,
  Badge
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { fetchPosts, fetchPopularPosts, fetchFollowingPosts, Post, likePost, unlikePost, bookmarkPost, unbookmarkPost, CATEGORIES, searchUsers, User, syncAllPostsCommentCounts, getUnreadNotificationCount } from '../services/api';
import { auth, db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Post | User)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTabs, setShowTabs] = useState(true); // Tab'ları göster/gizle
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const user = auth.currentUser;

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const HEADER_MAX_HEIGHT = 200;
  const HEADER_MIN_HEIGHT = 60;

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      let postsData: Post[] = [];
      
      switch (selectedTab) {
        case 'recent':
          postsData = await fetchPosts(20, selectedCategory);
          break;
        case 'popular':
          postsData = await fetchPopularPosts(20, selectedCategory);
          break;
        case 'following':
          if (user) {
            postsData = await fetchFollowingPosts(user.uid, 20, selectedCategory);
          }
          break;
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, selectedCategory, user]);

  const loadNotificationCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await getUnreadNotificationCount(user.uid);
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
    loadNotificationCount();
  }, [loadPosts, loadNotificationCount]);

  // Real-time bildirim sayısı dinleyicisi
  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
      let unreadCount = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isRead) {
          unreadCount++;
        }
      });
      
      setUnreadNotificationCount(unreadCount);
    }, (error: any) => {
      console.error('Error listening to notifications:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Sayfaya odaklandığında postları yenile (yorum sayıları güncellensin)
  useFocusEffect(
    useCallback(() => {
      loadPosts();
      loadNotificationCount();
    }, [loadPosts, loadNotificationCount])
  );

  // Migration: Uygulama ilk yüklendiğinde tüm postların yorum sayılarını senkronize et (sadece bir kez)
  useEffect(() => {
    const runMigration = async () => {
      try {
        // Sadece bir kez çalıştır (AsyncStorage kontrol et)
        const migrationDone = await AsyncStorage.getItem('comments_migration_done');
        if (!migrationDone) {
          await syncAllPostsCommentCounts();
          await AsyncStorage.setItem('comments_migration_done', 'true');
          await loadPosts(); // Migration sonrası postları yenile
        }
      } catch (error) {
        console.error('Migration error:', error);
      }
    };

    // Sadece kullanıcı giriş yaptıysa migration'ı çalıştır
    if (user) {
      runMigration();
    }
  }, [user, loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Reset header when refreshing
    Animated.spring(headerHeight, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
    await loadPosts();
      setRefreshing(false);
  }, [loadPosts, headerHeight]);

  // Arama fonksiyonu
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Şimdilik sadece kullanıcı arama
      const userResults = await searchUsers(query);
      setSearchResults(userResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Scroll handler - daha az agresif
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (searchQuery) return; // Don't hide header during search

        // Sadece search bar'ı gizle/göster, tab'ları sabit tut
        if (diff > 5 && currentScrollY > 50) {
          // Scrolling down - hide search
          Animated.timing(headerHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else if (diff < -5 || currentScrollY < 10) {
          // Scrolling up or at top - show search
          Animated.timing(headerHeight, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  // Like işlemi
  const handleLike = async (post: Post) => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Gönderiyi beğenmek için giriş yapmalısınız');
      return;
    }

    const isLiked = post.likes?.includes(user.uid) || false;
    
    try {
      if (isLiked) {
        await unlikePost(post.id, user.uid);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, likes: p.likes?.filter(uid => uid !== user.uid) || [] }
              : p
          )
        );
      } else {
        await likePost(post.id, user.uid);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, likes: [...(p.likes || []), user.uid] }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Hata', 'Gönderi beğenilirken bir hata oluştu');
    }
  };

  // Bookmark işlemi
  const handleBookmark = async (post: Post) => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Gönderiyi kaydetmek için giriş yapmalısınız');
      return;
    }

    const isBookmarked = post.bookmarks?.includes(user.uid) || false;
    
    try {
      if (isBookmarked) {
        await unbookmarkPost(post.id, user.uid);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, bookmarks: p.bookmarks?.filter(uid => uid !== user.uid) || [] }
              : p
          )
        );
      } else {
        await bookmarkPost(post.id, user.uid);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === post.id
              ? { ...p, bookmarks: [...(p.bookmarks || []), user.uid] }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      Alert.alert('Hata', 'Gönderi kaydedilirken bir hata oluştu');
    }
  };

  // Modern post kartı - Medium tarzı (Memoized)
  const renderPost = useCallback(({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(user?.uid || '') || false;
    const isBookmarked = item.bookmarks?.includes(user?.uid || '') || false;
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments || 0;

    // Thumbnail URL'sini belirle (web içeriğinden de extract et)
    const getThumbnailUrl = () => {
      // Önce direkt imageUrl'e bak
      if (item.imageUrl) return item.imageUrl;
      
      // Sonra images array'ine bak
      if (item.images && item.images.length > 0) {
        return item.images[0]?.url;
      }
      
      // Son olarak content içindeki HTML img taglarından extract et
      if (item.content) {
        const imgTagMatch = item.content.match(/<img[^>]+src=["']([^"']+)["'][^>]*/i);
        if (imgTagMatch) {
          // HTML entity'leri decode et
          return imgTagMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        }
        
        // [IMAGE:url] formatını da kontrol et
        const placeholderMatch = item.content.match(/\[IMAGE:([^\]]+)\]/);
        if (placeholderMatch) {
          return placeholderMatch[1];
        }
      }
      
      return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
      <View style={styles.postContainer}>
        <TouchableOpacity 
          style={styles.postContent}
          onPress={() => navigation.navigate('PostDetail' as any, { postId: item.id })}
          activeOpacity={0.7}
          delayPressIn={100}
        >
          {/* Author Info - Compact */}
          <View style={styles.authorRow}>
            {item.authorAvatar ? (
              <Avatar.Image 
                size={20} 
                source={{ uri: item.authorAvatar }}
                style={styles.miniAvatar}
              />
            ) : (
              <Avatar.Icon 
                size={20} 
                icon="account" 
                style={styles.miniAvatar}
              />
            )}
            <Text variant="bodySmall" style={[styles.authorText, { color: theme.colors.onBackground }]}>
              {item.authorName}
            </Text>
            <Text variant="bodySmall" style={[styles.dotSeparator, { color: theme.colors.secondary }]}>
              •
            </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        
          {/* Main Content Row */}
          <View style={styles.mainContentRow}>
            <View style={styles.textContent}>
              <Text variant="titleMedium" style={[styles.modernTitle, { color: theme.colors.onBackground }]} numberOfLines={4}>
          {item.title}
        </Text>
        
              {/* İçerikteki HTML taglarını temizle */}
              <Text variant="bodyMedium" style={[styles.modernSummary, { color: theme.colors.secondary }]} numberOfLines={5}>
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
            </View>

            {/* Thumbnail - Optimized */}
            {thumbnailUrl && (
              <View style={styles.thumbnailContainer}>
                <Avatar.Image 
                  size={64} 
                  source={{ 
                    uri: thumbnailUrl,
                    cache: 'force-cache' // Cache images
                  }}
                  style={styles.thumbnail}
                />
              </View>
            )}
          </View>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            <View style={styles.leftMeta}>
              <Chip 
                mode="outlined"
                compact
                style={styles.modernCategoryChip}
                textStyle={{ fontSize: 13, fontWeight: '500', color: theme.colors.secondary }}
              >
                {item.category}
              </Chip>
              <Text variant="bodySmall" style={[styles.readTime, { color: theme.colors.secondary }]}>
                3 dk okuma
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleLike(item);
                }}
                style={styles.actionButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={isLiked ? "heart" : "heart-outline"}
                  color={isLiked ? "#e74c3c" : theme.colors.secondary}
                  size={16}
                />
                <Text style={[styles.actionText, { color: theme.colors.secondary }]}>
                  {likesCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => e.stopPropagation()}
                style={styles.actionButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name="comment-outline"
                  color={theme.colors.secondary}
                  size={16}
                />
                <Text style={[styles.actionText, { color: theme.colors.secondary }]}>
                  {commentsCount}
        </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleBookmark(item);
                }}
                style={styles.actionButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  color={isBookmarked ? theme.colors.primary : theme.colors.secondary}
                  size={16}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [user, theme.colors, handleLike, handleBookmark, navigation]);

  // Arama sonucu item render
  const renderSearchResult = ({ item }: { item: Post | User }) => {
    if ('email' in item) {
      // User
      return (
        <View style={styles.searchUserItem}>
          {item.photoURL ? (
            <Avatar.Image size={32} source={{ uri: item.photoURL }} />
          ) : (
            <Avatar.Icon size={32} icon="account" />
          )}
          <View style={styles.searchUserInfo}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onBackground }}>
              {item.displayName || 'İsimsiz Kullanıcı'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              @{item.email}
            </Text>
          </View>
        </View>
      );
    } else {
      // Post
      return renderPost({ item });
    }
  };

  const tabs = [
    { value: 'recent', label: 'Son Gönderiler' },
    { value: 'popular', label: 'Popüler' },
    { value: 'following', label: 'Takip Edilenler' }
  ];

  // Animated styles - sadece search bar için
  const animatedSearchStyle = {
    height: headerHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 50],
      extrapolate: 'clamp',
    }),
    opacity: headerHeight,
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
          <Text variant="headlineSmall" style={[styles.compactTitle, { color: theme.colors.onBackground }]}>
            CetereleceNet
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Fixed Header - Always visible */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
          <View>
            <Text variant="headlineSmall" style={[styles.compactTitle, { color: theme.colors.onBackground }]}>
              CetereleceNet
            </Text>
            <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.secondary }]}>
              Bilgi paylaşım platformu
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton 
              icon={showTabs ? "chevron-up" : "chevron-down"} 
              size={20} 
              onPress={() => setShowTabs(!showTabs)}
              style={styles.toggleButton}
            />
            <View style={styles.notificationContainer}>
              <IconButton 
                icon="bell-outline" 
                size={24} 
                onPress={() => navigation.navigate('Notifications' as any)} 
              />
              {unreadNotificationCount > 0 && (
                <Badge 
                  style={styles.notificationBadge}
                  size={18}
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Badge>
              )}
            </View>
          </View>
        </View>

      {/* Animated Search Bar */}
      <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
        <View style={styles.compactSearchContainer}>
          <Searchbar
            placeholder="Arama..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.compactSearchbar}
            inputStyle={{ fontSize: 14 }}
            onBlur={() => Keyboard.dismiss()}
            clearButtonMode="while-editing"
          />
        </View>
      </Animated.View>

      {/* Fixed Tabs - Always visible when showTabs is true */}
      {showTabs && !searchQuery && (
        <View style={[styles.fixedTabsContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modernTabsContainer}>
            <SegmentedButtons
              value={selectedTab}
              onValueChange={setSelectedTab}
              buttons={tabs}
              style={styles.segmentedButtons}
            />
          </View>

          {/* Category Filter */}
          <View style={styles.categoryFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  mode={selectedCategory === category ? 'flat' : 'outlined'}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.modernCategoryChip,
                    selectedCategory === category && styles.selectedCategoryChip
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.selectedCategoryChipText
                  ]}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {searchQuery ? (
        // Arama Sonuçları
        <View style={styles.searchResultsContainer}>
          <Text variant="titleSmall" style={[styles.searchTitle, { color: theme.colors.onBackground }]}>
            Arama Sonuçları
          </Text>
          
          {isSearching ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => ('email' in item) ? item.id : item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              windowSize={5}
              initialNumToRender={5}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}
        </View>
      ) : (
        // Posts List with Scroll Handler - Optimized
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 220, // Arttırılmış post yüksekliği
            offset: 220 * index,
            index,
          })}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: theme.colors.secondary, textAlign: 'center' }}>
                {selectedTab === 'following' ? 'Takip ettiğiniz kişilerin gönderisi bulunmuyor' : 'Henüz gönderi bulunmuyor'}
              </Text>
            </View>
          )}
        />
      )}
      </View>
    </TouchableWithoutFeedback>
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
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
  },
  collapsibleHeader: {
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
  },
  compactTitle: {
    fontWeight: '700',
    fontSize: 24,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  compactSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compactSearchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    height: 36,
  },
  modernTabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  categoryFilterContainer: {
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  modernCategoryChip: {
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    paddingHorizontal: 10,
    maxWidth: 150,
  },
  selectedCategoryChip: {
    backgroundColor: '#000',
  },
  categoryChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: 100,
  },
  postContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  postContent: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniAvatar: {
    marginRight: 8,
  },
  authorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dotSeparator: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  modernTitle: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  modernSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  thumbnailContainer: {
    width: 64,
    height: 64,
  },
  thumbnail: {
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 30,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  searchUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  // New styles for fixed tabs
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    margin: 0,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
  },
  fixedTabsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e74c3c',
    color: 'white',
  },
}); 