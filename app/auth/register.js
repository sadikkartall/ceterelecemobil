import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, username);
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu!', [
        {
          text: 'Tamam',
          onPress: () => router.replace('/')
        }
      ]);
    } catch (error) {
      console.error('Register error:', error);
      
      let errorMessage = 'Kayıt olurken bir hata oluştu.';
      
      // Firebase hata kodlarını kontrol et ve özelleştirilmiş mesaj göster
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda. Farklı bir e-posta adresi kullanın veya giriş yapmayı deneyin.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi formatı.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. Daha güçlü bir şifre kullanın.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      
      // Expo Go içinde çalışıyorken bilgi mesajı göster
      Alert.alert(
        "Google ile Kayıt", 
        "Expo Go uygulamasında Google giriş özelliği şu anda desteklenmiyor. Uygulamanızı geliştirme derlemesi olarak çalıştırmanız gerekiyor.",
        [
          {
            text: "Tamam",
            onPress: () => console.log("Anlaşıldı")
          },
          {
            text: "Geliştirme Bilgisi",
            onPress: () => WebBrowser.openBrowserAsync('https://docs.expo.dev/guides/authentication/#firebase')
          }
        ]
      );
      
    } catch (error) {
      console.error('Google sign up error:', error);
      
      let errorMessage = 'Google ile kayıt olurken bir hata oluştu.';
      
      if (error.message?.includes('auth/popup-closed-by-user')) {
        errorMessage = 'Google kayıt penceresi kapatıldı.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      } else if (error.message?.includes('access denied') || error.message?.includes('erişim engellendi')) {
        errorMessage = 'Google erişimi reddetti. Muhtemelen yetkilendirme sorunu. Lütfen daha sonra tekrar deneyin.';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, isDarkMode && styles.darkContainer]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Hesap Oluştur</Text>
      
      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="Kullanıcı Adı"
        placeholderTextColor={isDarkMode ? '#999' : '#777'}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="E-posta"
        placeholderTextColor={isDarkMode ? '#999' : '#777'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="Şifre"
        placeholderTextColor={isDarkMode ? '#999' : '#777'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="Şifreyi Onayla"
        placeholderTextColor={isDarkMode ? '#999' : '#777'}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
        <Text style={[styles.dividerText, isDarkMode && styles.darkText]}>veya</Text>
        <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
      </View>
      
      <TouchableOpacity 
        style={styles.googleButton} 
        onPress={handleGoogleSignUp}
        disabled={googleLoading}
      >
        <Image 
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
          style={styles.googleIcon} 
        />
        <Text style={styles.googleButtonText}>
          {googleLoading ? 'İşleniyor...' : 'Google ile kayıt ol'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/auth/login')}>
        <Text style={[styles.linkText, isDarkMode && styles.darkLinkText]}>
          Zaten hesabınız var mı? Giriş yapın
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    color: '#fff',
  },
  button: {
    backgroundColor: '#4285F4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  darkDivider: {
    backgroundColor: '#444',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#4285F4',
    textAlign: 'center',
    marginTop: 20,
  },
  darkLinkText: {
    color: '#8ab4f8',
  },
}); 