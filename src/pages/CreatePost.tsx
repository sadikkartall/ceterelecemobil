import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, FlatList } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  useTheme, 
  Card,
  Chip,
  ActivityIndicator,
  IconButton,
  SegmentedButtons,
  Divider,
  Menu
} from 'react-native-paper';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/types';
import { auth } from '../firebase/config';
import { CATEGORIES } from '../services/api';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaFile } from '../services/uploadService';

type Props = BottomTabScreenProps<MainTabParamList, 'CreatePost'>;

interface PostImage {
  id: string;
  uri: string;
  placeholder: string; // [IMG1], [IMG2], etc.
  uploaded?: boolean;
  uploadedUrl?: string;
}

export default function CreatePostScreen({ navigation }: Props) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<PostImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const user = auth.currentUser;

  // Fotoğraf seçme fonksiyonu
  const pickImage = async () => {
    try {
      // İzin iste
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni vermelisiniz.');
        return;
      }

      // Fotoğraf seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImageToContent(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  // Kamera ile fotoğraf çekme
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera erişim izni vermelisiniz.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImageToContent(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
    }
  };

  // Fotoğrafı metin içine ekleme
  const addImageToContent = (imageUri: string) => {
    const imageNumber = images.length + 1;
    const placeholder = `[IMG${imageNumber}]`;
    
    const newImage: PostImage = {
      id: Date.now().toString(),
      uri: imageUri,
      placeholder: placeholder,
      uploaded: false
    };

    // Fotoğrafı listeye ekle
    setImages(prev => [...prev, newImage]);

    // Cursor pozisyonuna placeholder ekle
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const newContent = beforeCursor + `\n\n${placeholder}\n\n` + afterCursor;
    
    setContent(newContent);
    setCursorPosition(cursorPosition + placeholder.length + 4); // 4 = \n\n chars
  };

  // Fotoğraf kaldırma
  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      // Metin içindeki placeholder'ı kaldır
      const newContent = content.replace(new RegExp(`\\n\\n?\\[IMG\\d+\\]\\n\\n?`, 'g'), (match) => {
        return match.includes(imageToRemove.placeholder) ? '' : match;
      });
      setContent(newContent);
      
      // Listeden kaldır
      setImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  // Placeholder'ı metin içinde farklı konuma taşı
  const moveImageInContent = (imageId: string, direction: 'up' | 'down') => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const lines = content.split('\n');
    const placeholderIndex = lines.findIndex(line => line.trim() === image.placeholder);
    
    if (placeholderIndex === -1) return;

    let newIndex = placeholderIndex;
    if (direction === 'up' && placeholderIndex > 0) {
      newIndex = Math.max(0, placeholderIndex - 2); // 2 lines up to skip empty line
    } else if (direction === 'down' && placeholderIndex < lines.length - 1) {
      newIndex = Math.min(lines.length - 1, placeholderIndex + 2); // 2 lines down
    }

    if (newIndex !== placeholderIndex) {
      // Remove from old position
      lines.splice(placeholderIndex, 1);
      // Insert at new position
      lines.splice(newIndex, 0, image.placeholder);
      
      setContent(lines.join('\n'));
    }
  };

  // Fotoğraf seçeneklerini göster
  const showImageOptions = () => {
    Alert.alert(
      'Fotoğraf Ekle',
      'Fotoğraf cursor pozisyonuna eklenecek',
      [
        { text: 'Galeri', onPress: pickImage },
        { text: 'Kamera', onPress: takePhoto },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  // Metin içindeki placeholder'ları fotoğraflarla değiştir (preview için)
  const renderContentWithImages = (text: string) => {
    const parts = text.split(/(\[IMG\d+\])/);
    
    return parts.map((part, index) => {
      const imageMatch = part.match(/\[IMG(\d+)\]/);
      if (imageMatch) {
        const imageNumber = parseInt(imageMatch[1]);
        const image = images.find(img => img.placeholder === part);
        
        if (image) {
          return (
            <Image 
              key={`preview-${index}`} 
              source={{ uri: image.uri }} 
              style={styles.previewContentImage}
            />
          );
        } else {
          return (
            <View key={`placeholder-${index}`} style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>{part}</Text>
            </View>
          );
        }
      }
      
      return part ? (
        <Text key={`text-${index}`} variant="bodyMedium" style={styles.previewText}>
          {part}
        </Text>
      ) : null;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Hata', 'Gönderi oluşturmak için giriş yapmalısınız');
      return;
    }

    // Kullanıcı profilini Firestore'a ekle/güncelle
    await setDoc(doc(db, 'userProfiles', user.uid), {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (!title.trim() || !content.trim() || !selectedCategory) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);

    try {
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      let contentWithImages = content;
      let uploadedImages: Array<{url: string, placeholder: string}> = [];

      // Fotoğrafları yükle
      if (images.length > 0) {
        setImageUploading(true);
        try {
          for (const image of images) {
            const uploadedUrl = await uploadMediaFile(image.uri, user.uid);
            uploadedImages.push({
              url: uploadedUrl,
              placeholder: image.placeholder
            });
            
            // Content'teki placeholder'ı gerçek URL ile değiştir (gösterim için)
            contentWithImages = contentWithImages.replace(
              image.placeholder, 
              `[IMAGE:${uploadedUrl}]`
            );
          }
        } catch (error) {
          console.error('Image upload error:', error);
          Alert.alert('Hata', 'Fotoğraflar yüklenirken bir hata oluştu');
          setLoading(false);
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }

      // Create post data
      const postData = {
        title: title.trim(),
        content: contentWithImages, // Placeholder'ları içeren content
        category: selectedCategory,
        tags: tagArray,
        authorId: user.uid,
        authorEmail: user.email,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        bookmarks: [],
        comments: 0,
        views: 0,
        ...(uploadedImages.length > 0 && { images: uploadedImages }) // Fotoğraf metadata'sı
      };

      // Add to Firestore
      await addDoc(collection(db, 'posts'), postData);

      Alert.alert(
        'Başarılı', 
        'Gönderiniz başarıyla oluşturuldu!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Reset form
              setTitle('');
              setContent('');
              setSelectedCategory('');
              setTags('');
              setImages([]);
              setCursorPosition(0);
              // Navigate to home
              navigation.navigate('Home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Hata', 'Gönderi oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Fotoğraf yönetimi component
  const renderImageManager = ({ item }: { item: PostImage }) => (
    <View style={styles.imageManagerContainer}>
      <Image source={{ uri: item.uri }} style={styles.managerImage} />
      
      <View style={styles.imageManagerControls}>
        <Text variant="bodySmall" style={styles.placeholderLabel}>
          {item.placeholder}
        </Text>
        
        <View style={styles.moveButtons}>
          <IconButton
            icon="arrow-up"
            size={16}
            onPress={() => moveImageInContent(item.id, 'up')}
            style={styles.moveButton}
          />
          <IconButton
            icon="arrow-down"
            size={16}
            onPress={() => moveImageInContent(item.id, 'down')}
            style={styles.moveButton}
          />
        </View>
      </View>
      
      <IconButton
        icon="close"
        iconColor={theme.colors.error}
        size={16}
        onPress={() => removeImage(item.id)}
        style={styles.removeButton}
      />
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
            Gönderi Oluştur
          </Text>
        </View>
        
        <View style={styles.notLoggedInContainer}>
          <Icon name="account-alert" size={64} color={theme.colors.secondary} />
          <Text variant="titleLarge" style={{ color: theme.colors.secondary, marginTop: 16, textAlign: 'center' }}>
            Gönderi oluşturmak için giriş yapmalısınız
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Settings')}
            style={{ marginTop: 24 }}
          >
            Giriş Yap
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Gönderi Oluştur
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.secondary }]}>
          Fotoğrafları metin içine yerleştirin
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Form Card */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.formContent}>
            
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text variant="titleSmall" style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
                Başlık *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Gönderinizin başlığını yazın..."
                mode="outlined"
                style={styles.input}
                maxLength={100}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.secondary, textAlign: 'right' }}>
                {title.length}/100
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.inputContainer}>
              <Text variant="titleSmall" style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
                Kategori *
              </Text>
              <Text variant="bodySmall" style={[styles.inputHelper, { color: theme.colors.secondary }]}>
                Gönderinizin konusunu belirleyin
              </Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.filter(cat => cat !== 'all').map((category) => (
                  <Chip
                    key={category}
                    mode={selectedCategory === category ? 'flat' : 'outlined'}
                    selected={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && { backgroundColor: theme.colors.primary }
                    ]}
                    textStyle={{
                      color: selectedCategory === category ? theme.colors.onPrimary : theme.colors.primary
                    }}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Content Input with Image Support */}
            <View style={styles.inputContainer}>
              <View style={styles.contentHeader}>
                <Text variant="titleSmall" style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
                  İçerik *
                </Text>
                <Button
                  mode="outlined"
                  onPress={showImageOptions}
                  icon="camera-plus"
                  compact
                  style={styles.addImageButton}
                >
                  Fotoğraf Ekle
                </Button>
              </View>
              <Text variant="bodySmall" style={[styles.inputHelper, { color: theme.colors.secondary }]}>
                Fotoğraf eklemek için butonu kullanın. [IMG1], [IMG2] placeholder'larını görürsünüz.
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                onSelectionChange={(event) => setCursorPosition(event.nativeEvent.selection.start)}
                placeholder="Gönderinizin içeriğini yazın... Fotoğraf eklemek için yukarıdaki butonu kullanın."
                mode="outlined"
                multiline
                numberOfLines={12}
                style={[styles.input, styles.contentInput]}
                maxLength={3000}
              />
                             <Text variant="bodySmall" style={{ color: theme.colors.secondary, textAlign: 'right' }}>
                 {content.length}/3000
               </Text>
            </View>

            {/* Image Manager */}
            {images.length > 0 && (
              <View style={styles.inputContainer}>
                <Text variant="titleSmall" style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
                  Fotoğraf Yönetimi ({images.length})
                </Text>
                <Text variant="bodySmall" style={[styles.inputHelper, { color: theme.colors.secondary }]}>
                  Fotoğrafları yukarı/aşağı taşıyabilir veya silebilirsiniz
                </Text>
                
                <FlatList
                  data={images}
                  renderItem={renderImageManager}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageManagerList}
                />
              </View>
            )}

            {/* Tags Input */}
            <View style={styles.inputContainer}>
              <Text variant="titleSmall" style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
                Etiketler
              </Text>
              <Text variant="bodySmall" style={[styles.inputHelper, { color: theme.colors.secondary }]}>
                Virgülle ayırarak yazın (örn: react, javascript, web)
              </Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="react, javascript, web..."
                mode="outlined"
                style={styles.input}
                maxLength={200}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Preview Section */}
        {(title || content || images.length > 0) && (
          <Card style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.previewHeader}>
                <Icon name="eye" size={20} color={theme.colors.primary} />
                <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  Önizleme
                </Text>
              </View>
              <Divider style={{ marginVertical: 12 }} />
              
              {title && (
                <Text variant="headlineSmall" style={[styles.previewTitle, { color: theme.colors.onBackground }]}>
                  {title}
                </Text>
              )}
              
              <View style={styles.previewContainer}>
                {renderContentWithImages(content)}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Submit Button */}
        <Card style={[styles.submitCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={loading || imageUploading || !title.trim() || !content.trim() || !selectedCategory}
              loading={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {loading ? 'Gönderiliyor...' : imageUploading ? 'Fotoğraflar Yükleniyor...' : 'Gönderiyi Yayınla'}
            </Button>
            
            <Text variant="bodySmall" style={[styles.helpText, { color: theme.colors.secondary }]}>
              Gönderiniz yayınlandıktan sonra diğer kullanıcılar tarafından görülebilir olacaktır.
            </Text>
          </Card.Content>
        </Card>

        {/* Author Info */}
        <Card style={[styles.authorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: theme.colors.onBackground, marginBottom: 8 }}>
              Yazar Bilgileri
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
              {user.email}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.secondary, marginTop: 4 }}>
              Bu gönderi yukarıdaki hesap adına yayınlanacaktır.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    elevation: 2,
    marginBottom: 16,
  },
  formContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputHelper: {
    marginBottom: 8,
    fontSize: 12,
  },
  input: {
    marginBottom: 4,
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  // New content header with add image button
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addImageButton: {
    height: 32,
  },
  // Image manager styles
  imageManagerList: {
    marginTop: 12,
  },
  imageManagerContainer: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    width: 180,
  },
  managerImage: {
    width: 164,
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageManagerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderLabel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  moveButtons: {
    flexDirection: 'row',
  },
  moveButton: {
    margin: 0,
    width: 28,
    height: 28,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    margin: 0,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  // Preview styles
  previewCard: {
    elevation: 1,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  previewText: {
    marginBottom: 8,
    lineHeight: 24,
  },
  previewContentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  placeholderBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
    marginVertical: 8,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Submit styles
  submitCard: {
    elevation: 2,
    marginBottom: 16,
  },
  submitButton: {
    marginBottom: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  helpText: {
    textAlign: 'center',
    fontSize: 12,
  },
  authorCard: {
    elevation: 1,
    marginBottom: 24,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
}); 