import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PostDetailScreen from '../pages/PostDetail';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import UserProfile from '../pages/UserProfile';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import About from '../pages/About';
import Support from '../pages/Support';
import ChangePassword from '../pages/ChangePassword';
import NotificationsScreen from '../pages/Notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    // Loading ekranı gösterebiliriz
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="UserProfile" component={UserProfile} options={{ title: 'Kullanıcı Profili' }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="Terms" component={Terms} />
          <Stack.Screen name="About" component={About} />
          <Stack.Screen name="Support" component={Support} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 