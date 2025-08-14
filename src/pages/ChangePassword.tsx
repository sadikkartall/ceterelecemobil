import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Card, Appbar, Button, TextInput } from 'react-native-paper';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChangePasswordProps {
  navigation: any;
}

export default function ChangePassword({ navigation }: ChangePasswordProps) {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const user = auth.currentUser;

  const validateInputs = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Hata', 'Mevcut şifrenizi girin.');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Hata', 'Yeni şifrenizi girin.');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Hata', 'Yeni şifre mevcut şifreden farklı olmalıdır.');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateInputs() || !user?.email) return;

    setLoading(true);
    try {
      // Önce kullanıcıyı mevcut şifresi ile yeniden doğrula
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Şifreyi güncelle
      await updatePassword(user, newPassword);

      Alert.alert(
        'Başarılı!',
        'Şifreniz başarıyla değiştirildi.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Şifre değiştirirken bir hata oluştu.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mevcut şifreniz hatalı.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Yeni şifre çok zayıf.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Güvenlik için lütfen çıkış yapıp tekrar giriş yapın.';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Şifre Değiştir" />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
          <Card.Content style={styles.infoContent}>
            <Icon name="shield-lock" size={32} color={theme.colors.onPrimaryContainer} />
            <View style={styles.infoText}>
              <Text variant="titleMedium" style={[styles.infoTitle, { color: theme.colors.onPrimaryContainer }]}>
                Güvenlik
              </Text>
              <Text variant="bodyMedium" style={[styles.infoDescription, { color: theme.colors.onPrimaryContainer }]}>
                Hesabınızın güvenliği için güçlü bir şifre seçin.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Form */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.formContent}>
            <Text variant="headlineSmall" style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              Şifre Değiştir
            </Text>

            <Text variant="bodyMedium" style={[styles.formDescription, { color: theme.colors.onSurfaceVariant }]}>
              Şifrenizi değiştirmek için aşağıdaki alanları doldurun.
            </Text>

            {/* Mevcut Şifre */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Mevcut Şifre"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showCurrentPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </View>

            {/* Yeni Şifre */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-plus" />}
                right={
                  <TextInput.Icon 
                    icon={showNewPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <Text variant="bodySmall" style={[styles.inputHelper, { color: theme.colors.onSurfaceVariant }]}>
                En az 6 karakter olmalıdır
              </Text>
            </View>

            {/* Şifre Tekrarı */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Yeni Şifre (Tekrar)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon 
                    icon={showConfirmPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </View>

            {/* Şifre Gücü Göstergesi */}
            {newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text variant="bodySmall" style={[styles.strengthLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Şifre Gücü:
                </Text>
                <View style={styles.strengthBars}>
                  <View style={[
                    styles.strengthBar,
                    { backgroundColor: newPassword.length >= 6 ? '#4caf50' : '#e0e0e0' }
                  ]} />
                  <View style={[
                    styles.strengthBar,
                    { backgroundColor: newPassword.length >= 8 ? '#4caf50' : '#e0e0e0' }
                  ]} />
                  <View style={[
                    styles.strengthBar,
                    { backgroundColor: /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '#4caf50' : '#e0e0e0' }
                  ]} />
                </View>
                <Text variant="bodySmall" style={[styles.strengthText, { color: theme.colors.onSurfaceVariant }]}>
                  {newPassword.length < 6 ? 'Zayıf' : 
                   newPassword.length < 8 ? 'Orta' : 
                   /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'Güçlü' : 'Orta'}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={loading}
                disabled={loading}
                style={styles.saveButton}
                icon="content-save"
              >
                Şifreyi Değiştir
              </Button>

              <Button
                mode="outlined"
                onPress={resetForm}
                disabled={loading}
                style={styles.resetButton}
                icon="refresh"
              >
                Temizle
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Tips Card */}
        <Card style={[styles.tipsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Card.Content style={styles.tipsContent}>
            <View style={styles.tipHeader}>
              <Icon name="lightbulb-on" size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                Güvenli Şifre İpuçları
              </Text>
            </View>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Icon name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                  En az 8 karakter kullanın
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Icon name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                  Büyük ve küçük harf karışımı
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Icon name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                  Sayı ve özel karakter ekleyin
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Icon name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodySmall" style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
                  Kişisel bilgilerinizi kullanmayın
                </Text>
              </View>
            </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDescription: {
    lineHeight: 20,
  },
  formCard: {
    marginBottom: 16,
  },
  formContent: {
    padding: 20,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  formDescription: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 4,
  },
  inputHelper: {
    marginLeft: 12,
    marginTop: 4,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  strengthLabel: {
    marginRight: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 8,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  strengthText: {
    marginLeft: 8,
    minWidth: 40,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    paddingVertical: 4,
  },
  resetButton: {
    paddingVertical: 4,
  },
  tipsCard: {
    marginTop: 8,
  },
  tipsContent: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    marginLeft: 8,
    flex: 1,
  },
}); 