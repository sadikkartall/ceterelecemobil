import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen as RouterSplashScreen } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { View } from 'react-native';
import { SplashAnimation } from '../components/SplashAnimation';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // Splash animasyonu için state
  const [showSplash, setShowSplash] = useState(true);
  // Navigasyon için hazır olma durumu
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (loaded) {
      // Native splash screen gizle
      SplashScreen.hideAsync();
      
      // Özel animasyonu 1.8 saniye göster, sonra ana ekrana geç
      const timer = setTimeout(() => {
        setShowSplash(false);
        // Navigasyon için hazır olduğunu belirt
        setIsNavigationReady(true);
      }, 1800);
      
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return <View style={{ flex: 1 }} />;
  }
  
  // Özel splash screen göster
  if (showSplash) {
    return <SplashAnimation />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack initialRouteName="(tabs)">
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerTitle: 'Giriş Yap', presentation: 'modal' }} />
            <Stack.Screen name="auth/register" options={{ headerTitle: 'Kayıt Ol', presentation: 'modal' }} />
            <Stack.Screen name="post/[id]" options={{ headerTitle: 'Gönderi', headerBackTitle: 'Geri' }} />
            <Stack.Screen name="settings" options={{ headerTitle: 'Ayarlar', headerBackTitle: 'Geri' }} />
            <Stack.Screen name="+not-found" options={{ title: 'Sayfa Bulunamadı' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
