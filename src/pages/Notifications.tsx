import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { 
  Text, 
  useTheme, 
  Card,
  Avatar,
  IconButton,
  ActivityIndicator,
  Button,
  Appbar
} from 'react-native-paper';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  Notification 
} from '../services/api';
import { auth, db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface NotificationsProps {
  navigation: any;
  route?: any;
}

export default function NotificationsScreen({ navigation }: NotificationsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time bildirim dinleyicisi
  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Notification);
      });
      
      // Client-side sıralama
      notificationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setNotifications(notificationsData.slice(0, 50));
      setLoading(false);
    }, (error: any) => {
      console.error('Error listening to notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const notificationsData = await fetchNotifications(user.uid, 50);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // İlgili sayfaya yönlendir
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'bookmark':
        if (notification.postId) {
          navigation.navigate('PostDetail', { postId: notification.postId });
        }
        break;
      case 'follow':
        if (notification.fromUserId) {
          navigation.navigate('UserProfile', { userId: notification.fromUserId });
        }
        break;
      case 'post':
        if (notification.postId) {
          navigation.navigate('PostDetail', { postId: notification.postId });
        }
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'comment';
      case 'follow': return 'account-plus';
      case 'post': return 'note-plus';
      case 'bookmark': return 'bookmark';
      default: return 'bell';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'like': return '#e74c3c';
      case 'comment': return '#3498db';
      case 'follow': return '#2ecc71';
      case 'post': return '#9b59b6';
      case 'bookmark': return '#f39c12';
      default: return theme.colors.secondary;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <Card 
        style={[
          styles.notificationCard, 
          { backgroundColor: item.isRead ? theme.colors.surface : theme.colors.primaryContainer }
        ]}
      >
        <Card.Content style={styles.notificationContent}>
          <View style={styles.notificationRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {item.fromUserAvatar ? (
                <Avatar.Image 
                  size={40} 
                  source={{ uri: item.fromUserAvatar }}
                />
              ) : (
                <Avatar.Icon 
                  size={40} 
                  icon="account"
                />
              )}
              
              {/* Notification type icon */}
              <View 
                style={[
                  styles.typeIcon, 
                  { backgroundColor: getNotificationIconColor(item.type) }
                ]}
              >
                <Icon 
                  name={getNotificationIcon(item.type)} 
                  size={12} 
                  color="white" 
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.notificationTextContainer}>
              <Text 
                variant="bodyMedium" 
                style={[
                  styles.notificationText,
                  { 
                    color: theme.colors.onBackground,
                    fontWeight: item.isRead ? 'normal' : 'bold'
                  }
                ]}
                numberOfLines={4}
              >
                {item.message}
              </Text>
              
              <Text 
                variant="bodySmall" 
                style={[styles.timeText, { color: theme.colors.secondary }]}
              >
                {getTimeAgo(item.createdAt)}
              </Text>
            </View>

            {/* Unread indicator */}
            {!item.isRead && (
              <View 
                style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} 
              />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Bildirimler" />
        </Appbar.Header>
        
        <View style={styles.centerContainer}>
          <Icon name="account-alert" size={64} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={{ color: theme.colors.secondary, marginTop: 16, textAlign: 'center' }}>
            Bildirimleri görmek için giriş yapmalısınız
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Bildirimler" />
        {notifications.some(n => !n.isRead) && (
          <Appbar.Action 
            icon="check-all" 
            onPress={handleMarkAllAsRead}
          />
        )}
      </Appbar.Header>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>
            Bildirimler yükleniyor...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="bell-outline" size={64} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={{ color: theme.colors.secondary, marginTop: 16, textAlign: 'center' }}>
            Henüz bildirim yok
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginTop: 8, textAlign: 'center' }}>
            Etkileşimleriniz burada görünecek
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 8,
    elevation: 1,
  },
  notificationContent: {
    padding: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  typeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationText: {
    lineHeight: 20,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
}); 