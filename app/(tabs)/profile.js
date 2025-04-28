import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserPosts } from '../../services/postService';

export default function Profile() {
  const { currentUser, signOut, loading: authLoading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let redirectTimer;
    if (!authLoading && !currentUser) {
      redirectTimer = setTimeout(() => {
        router.replace('/auth/login');
      }, 500);
    } else if (currentUser) {
      loadUserPosts();
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [currentUser, router, authLoading]);

  const loadUserPosts = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const posts = await getUserPosts(currentUser.uid);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Hata', 'Çıkış yaparken bir sorun oluştu.');
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  const username = currentUser.profile?.username || 'Kullanıcı';
  const email = currentUser.email || '';
  const postCount = userPosts.length;

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{username[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.username, isDarkMode && styles.darkText]}>{username}</Text>
            <Text style={[styles.email, isDarkMode && styles.darkMeta]}>{email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>{postCount}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkMeta]}>Gönderiler</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>0</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkMeta]}>Takipçiler</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>0</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkMeta]}>Takip Edilen</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Ayarlar</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]} 
          onPress={toggleTheme}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
            />
          </View>
          <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
            {isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons name="settings-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
          </View>
          <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Hesap Ayarları</Text>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={handleSignOut}
        >
          <View style={styles.settingIconContainer}>
            <Ionicons name="log-out-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
          </View>
          <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Çıkış Yap</Text>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  settingsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSettingItem: {
    backgroundColor: '#1e1e1e',
  },
  settingIconContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  darkText: {
    color: '#f0f0f0',
  },
  darkMeta: {
    color: '#aaa',
  },
}); 