import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity, Animated } from 'react-native';
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
  FAB
} from 'react-native-paper';
import { fetchPosts, Post, CATEGORIES, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '../services/api';
import { auth } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface BlogScreenProps {
  navigation: any;
}

export default function BlogScreen({ navigation }: BlogScreenProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState(0); // 0: For You, 1: Following, 2: Featured
  const user = auth.currentUser;

  // Scroll animation
  const headerHeight = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await fetchPosts(50, selectedCategory);
      setPosts(postsData);
      setFilteredPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Hata', 'Gönderiler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Reset header when refreshing
    Animated.spring(headerHeight, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
    await loadPosts();
    setRefreshing(false);
  }, [selectedCategory, headerHeight]);

  // Scroll handler
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: new Animated.Value(0) } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (diff > 0 && currentScrollY > 20) {
          // Scrolling down - hide header
          Animated.timing(headerHeight, {
            toValue: 0,
            duration: 80,
            useNativeDriver: false,
          }).start();
        } else if (diff < 0 || currentScrollY < 5) {
          // Scrolling up or at top - show header
          Animated.timing(headerHeight, {
            toValue: 1,
            duration: 120,
            useNativeDriver: false,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = posts;

    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchQuery]);

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

  const getCategoryColor = (category: string) => {
    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const index = category.length % colors.length;
    return colors[index];
  };

  // Modern post kartı - Medium tarzı
  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(user?.uid || '') || false;
    const isBookmarked = item.bookmarks?.includes(user?.uid || '') || false;
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments || 0;

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

            {/* Thumbnail */}
            {item.imageUrl && (
              <View style={styles.thumbnailContainer}>
                <Avatar.Image 
                  size={64} 
                  source={{ uri: item.imageUrl }}
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
  };

  // Tab button - Medium tarzı
  const renderTabButton = (title: string, index: number) => (
    <Button
      key={index}
      mode="text"
      onPress={() => setSelectedTab(index)}
      style={[
        styles.modernTabButton,
        selectedTab === index && styles.activeTab
      ]}
      labelStyle={[
        styles.tabLabel,
        { 
          color: selectedTab === index ? theme.colors.onBackground : theme.colors.secondary,
          fontWeight: selectedTab === index ? '600' : '400'
        }
      ]}
    >
      {title}
    </Button>
  );

  // Animated styles
  const animatedHeaderStyle = {
    height: headerHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 120],
      extrapolate: 'clamp',
    }),
    opacity: headerHeight,
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
          <Text variant="headlineSmall" style={[styles.compactTitle, { color: theme.colors.onBackground }]}>
            Blog
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={[styles.compactTitle, { color: theme.colors.onBackground }]}>
          Blog
        </Text>
        <IconButton icon="bell-outline" size={24} onPress={() => {}} />
      </View>

      {/* Collapsible Header */}
      <Animated.View style={[styles.collapsibleHeader, animatedHeaderStyle]}>
        {/* Modern Tabs */}
        <View style={styles.modernTabsContainer}>
          {renderTabButton('Senin İçin', 0)}
          {renderTabButton('Takip Edilenler', 1)}
          {renderTabButton('Öne Çıkanlar', 2)}
          {renderTabButton('Matematik', 3)}
        </View>

        {/* Search Bar - Compact */}
        <View style={styles.compactSearchContainer}>
          <Searchbar
            placeholder="Arama..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.compactSearchbar}
            inputStyle={{ fontSize: 14 }}
          />
        </View>
      </Animated.View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={8}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={8}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.secondary, textAlign: 'center' }}>
              Henüz gönderi bulunmuyor
            </Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreatePost')}
      />
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
  modernTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modernTabButton: {
    marginHorizontal: 4,
    borderRadius: 0,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabLabel: {
    fontSize: 14,
    textTransform: 'none',
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
  modernCategoryChip: {
    height: 30,
    marginRight: 8,
    borderRadius: 15,
    paddingHorizontal: 10,
    maxWidth: 150,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
}); 