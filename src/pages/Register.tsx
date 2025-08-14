import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { createUserWithEmailAndPassword } from '../services/auth';
import { auth } from '../firebase/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Tüm alanları doldurunuz.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Başarılı kayıt sonrası otomatik olarak giriş yapılacak
    } catch (err: any) {
      console.error('Register error:', err);
      let errorMessage = 'Kayıt başarısız.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. Daha güçlü bir şifre seçin.';
      }
      
      setError(errorMessage);
    }

    setLoading(false);
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
          Kayıt Ol
        </Text>
        
        {error ? (
          <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: 10 }}>{error}</Text>
        ) : null}
        
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={loading}
        />
        
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          disabled={loading}
        />
        
        <TextInput
          label="Şifre Tekrar"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          disabled={loading}
        />
        
        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          loading={loading}
        >
          Kayıt Ol
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.link}
          disabled={loading}
        >
          Zaten hesabınız var mı? Giriş yapın
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
});
