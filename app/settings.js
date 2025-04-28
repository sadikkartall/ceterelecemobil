import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currentUser, deleteAccount } = useAuth();
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Modal kapatıldığında state'i sıfırla
  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setPassword('');
    setDeleteError('');
    setIsDeleting(false);
  };
  
  // Hesap silme işlemini başlat
  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError('Lütfen şifrenizi girin');
      return;
    }
    
    Alert.alert(
      "Hesap Silme",
      "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Evet, Hesabımı Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAccount(password);
              closeDeleteModal();
              router.replace('/auth/login');
            } catch (error) {
              console.error("Account deletion error:", error);
              if (error.code === 'auth/wrong-password') {
                setDeleteError('Hatalı şifre. Lütfen şifrenizi kontrol edin.');
              } else {
                setDeleteError('Hesap silme sırasında bir hata oluştu: ' + error.message);
              }
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Kullanıcı yoksa login sayfasına yönlendirmek için useEffect kullan
  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    }
  }, [currentUser, router]);
  
  if (!currentUser) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Hesap silme modal'ı
  const DeleteAccountModal = () => (
    <Modal
      visible={isDeleteModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeDeleteModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
              Hesabı Sil
            </Text>
            <TouchableOpacity onPress={closeDeleteModal}>
              <Ionicons 
                name="close-outline" 
                size={28} 
                color={isDarkMode ? '#fff' : '#333'} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalDescription, isDarkMode && styles.darkText]}>
            Hesabınızı silmek için şifrenizi girin. Bu işlem kalıcıdır ve geri alınamaz.
          </Text>
          
          <TextInput
            style={[
              styles.passwordInput, 
              isDarkMode && styles.darkPasswordInput,
              deleteError ? styles.inputError : null
            ]}
            placeholder="Şifrenizi girin"
            placeholderTextColor={isDarkMode ? '#999' : '#777'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          {deleteError ? (
            <Text style={styles.errorText}>{deleteError}</Text>
          ) : null}
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>
                Hesabımı Sil
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={closeDeleteModal}
            disabled={isDeleting}
          >
            <Text style={styles.cancelButtonText}>
              İptal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          Uygulama Ayarları
        </Text>
        
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Koyu Tema
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: '#4285F4' }}
            thumbColor="#fff"
          />
        </View>
        
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <View style={styles.settingInfo}>
            <Ionicons 
              name="notifications-outline" 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Bildirimler
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ccc', true: '#4285F4' }}
            thumbColor="#fff"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          Hesap
        </Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => Alert.alert('Bilgi', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderilecektir.')}
        >
          <View style={styles.settingInfo}>
            <Ionicons 
              name="key-outline" 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Şifremi Değiştir
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => Alert.alert('Bilgi', 'Profil düzenleme şu an aktif değil.')}
        >
          <View style={styles.settingInfo}>
            <Ionicons 
              name="person-outline" 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Profili Düzenle
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
        
        {/* Hesap Silme Butonu */}
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => setIsDeleteModalVisible(true)}
        >
          <View style={styles.settingInfo}>
            <Ionicons 
              name="trash-outline" 
              size={22} 
              color="#e74c3c" 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, {color: '#e74c3c'}]}>
              Hesabımı Sil
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          Diğer
        </Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => Alert.alert('Bilgi', 'Uygulama sürümü: 1.0.0')}
        >
          <View style={styles.settingInfo}>
            <Ionicons 
              name="information-circle-outline" 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Hakkında
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
          onPress={() => Alert.alert('Bilgi', 'Yardım merkezi şu an aktif değil.')}
        >
          <View style={styles.settingInfo}>
            <Ionicons 
              name="help-circle-outline" 
              size={22} 
              color={isDarkMode ? '#fff' : '#333'} 
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
              Yardım
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#aaa' : '#999'} />
        </TouchableOpacity>
      </View>
      
      {/* Modal'ı göster */}
      <DeleteAccountModal />
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  darkText: {
    color: '#f0f0f0',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContainer: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  darkPasswordInput: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    color: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
}); 