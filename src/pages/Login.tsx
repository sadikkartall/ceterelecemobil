import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { signInWithGoogleAsync, signInWithEmailAndPassword } from '../services/auth';
import { auth } from '../firebase/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('E-posta ve şifre gereklidir.');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Başarılı giriş sonrası yönlendirme otomatik olarak olacak
      
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Giriş başarısız.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Hatalı şifre.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edin veya önce kayıt olun.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      }
      
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogleAsync();
      // Başarılı giriş sonrası yönlendirme veya state güncellemesi
    } catch (err: any) {
      setError(err.message || 'Google ile giriş başarısız.');
    }
    setGoogleLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Giriş Yap
        </Text>
        {error ? (
          <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: 10 }}>{error}</Text>
        ) : null}
        
        <Button
          mode="outlined"
          onPress={handleGoogleLogin}
          style={styles.button}
          loading={googleLoading}
          disabled={loading}
          icon="google"
        >
          Google ile Giriş Yap
        </Button>
        
        <Text style={[styles.divider, { color: theme.colors.onBackground }]}>veya</Text>
        
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={loading || googleLoading}
        />
        
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          disabled={loading || googleLoading}
        />
        
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          disabled={googleLoading}
        >
          Giriş Yap
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.link}
          disabled={loading || googleLoading}
        >
          Hesabınız yok mu? Kayıt olun
        </Button>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  link: {
    marginTop: 16,
  },
  divider: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
}); 