import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getPosts } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('recent'); // recent, popular, following

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      // Aktif sekmeye göre farklı veriler yükle
      let postData;
      
      switch (activeTab) {
        case 'popular':
          // Popüler gönderileri getir (beğeni sayısına göre)
          postData = await getPosts(20, 'popular');
          break;
        case 'following':
          // Takip edilen kullanıcıların gönderilerini getir
          // Not: Bu özellik henüz uygulanmadı, popüler gönderileri gösteriyoruz
          postData = await getPosts(20, 'following');
          break;
        case 'recent':
        default:
          // Son gönderileri getir
          postData = await getPosts(20);
          break;
      }
      
      setPosts(postData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadPosts();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    let redirectTimer;
    if (!authLoading && !currentUser) {
      redirectTimer = setTimeout(() => {
        router.replace('/auth/login');
      }, 500);
    }
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [currentUser, router, authLoading]);

  const renderPostItem = ({ item }) => {
    const date = new Date(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={[styles.postCard, isDarkMode && styles.darkPostCard]} 
        onPress={() => router.push(`/post/${item.id}`)}
      >
        <Text style={[styles.postTitle, isDarkMode && styles.darkText]}>
          {item.title}
        </Text>
        
        <Text 
          style={[styles.postContent, isDarkMode && styles.darkText]} 
          numberOfLines={3}
        >
          {item.content}
        </Text>
        
        <View style={styles.postFooter}>
          <Text style={[styles.postMeta, isDarkMode && styles.darkMeta]}>
            {date}
          </Text>
          
          <View style={styles.postStats}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={16} color={isDarkMode ? '#aaa' : '#666'} />
              <Text style={[styles.statText, isDarkMode && styles.darkMeta]}>
                {item.likeCount || 0}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={16} color={isDarkMode ? '#aaa' : '#666'} />
              <Text style={[styles.statText, isDarkMode && styles.darkMeta]}>
                {item.commentCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Tab bar render fonksiyonu
  const renderTabBar = () => {
    return (
      <View style={[styles.tabBar, isDarkMode && styles.darkTabBar]}>
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            activeTab === 'recent' && styles.activeTabItem,
            isDarkMode && activeTab === 'recent' && styles.darkActiveTabItem
          ]}
          onPress={() => setActiveTab('recent')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'recent' 
              ? '#4285F4' 
              : isDarkMode ? '#aaa' : '#777'} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'recent' && styles.activeTabText,
              isDarkMode && styles.darkTabText,
              isDarkMode && activeTab === 'recent' && styles.darkActiveTabText
            ]}
          >
            Son Gönderiler
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            activeTab === 'popular' && styles.activeTabItem,
            isDarkMode && activeTab === 'popular' && styles.darkActiveTabItem
          ]}
          onPress={() => setActiveTab('popular')}
        >
          <Ionicons 
            name="flame-outline" 
            size={18} 
            color={activeTab === 'popular' 
              ? '#4285F4' 
              : isDarkMode ? '#aaa' : '#777'} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'popular' && styles.activeTabText,
              isDarkMode && styles.darkTabText,
              isDarkMode && activeTab === 'popular' && styles.darkActiveTabText
            ]}
          >
            Popüler
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            activeTab === 'following' && styles.activeTabItem,
            isDarkMode && activeTab === 'following' && styles.darkActiveTabItem
          ]}
          onPress={() => setActiveTab('following')}
        >
          <Ionicons 
            name="people-outline" 
            size={18} 
            color={activeTab === 'following' 
              ? '#4285F4' 
              : isDarkMode ? '#aaa' : '#777'} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'following' && styles.activeTabText,
              isDarkMode && styles.darkTabText,
              isDarkMode && activeTab === 'following' && styles.darkActiveTabText
            ]}
          >
            Takip Edilenler
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (postsLoading && !refreshing) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {renderTabBar()}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4285F4']}
            tintColor={isDarkMode ? '#fff' : '#4285F4'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
              {activeTab === 'recent' ? 'Henüz gönderi yok.' : 
               activeTab === 'popular' ? 'Popüler gönderi bulunamadı.' : 
               'Takip ettiğiniz kişilerden gönderi bulunamadı.'}
            </Text>
          </View>
        }
      />
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
  listContainer: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  postMeta: {
    fontSize: 12,
    color: '#999',
  },
  postStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  darkText: {
    color: '#f0f0f0',
  },
  darkMeta: {
    color: '#aaa',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // Tab bar stilleri
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkTabBar: {
    backgroundColor: '#1e1e1e',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  darkActiveTabItem: {
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#777',
  },
  darkTabText: {
    color: '#aaa',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  darkActiveTabText: {
    color: '#4285F4',
  },
});
