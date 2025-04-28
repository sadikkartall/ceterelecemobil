import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createPost } from '../../services/postService';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  // Kullanıcı yoksa login sayfasına yönlendirmek için useEffect kullan
  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    }
  }, [currentUser, router]);

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik alanlarını doldurun.');
      return;
    }

    try {
      setLoading(true);
      const postData = {
        title: title.trim(),
        content: content.trim(),
      };
      
      await createPost(postData, currentUser.uid);
      
      Alert.alert(
        'Başarılı', 
        'Gönderiniz başarıyla oluşturuldu!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              setTimeout(() => {
                router.replace('/');
              }, 100);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Hata', 'Gönderi oluşturulurken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formContainer}>
        <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Başlık</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.darkInput]}
          placeholder="Gönderi başlığı..."
          placeholderTextColor={isDarkMode ? '#999' : '#777'}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        
        <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>İçerik</Text>
        <TextInput
          style={[styles.textArea, isDarkMode && styles.darkInput]}
          placeholder="Gönderi içeriğinizi buraya yazın..."
          placeholderTextColor={isDarkMode ? '#999' : '#777'}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCreatePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Gönderi Oluştur</Text>
          )}
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
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  darkText: {
    color: '#f0f0f0',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    color: '#333',
    textAlignVertical: 'top',
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
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 