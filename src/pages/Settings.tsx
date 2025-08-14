import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Button, Text, useTheme } from 'react-native-paper';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/types';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';


type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function SettingsScreen({ navigation }: Props) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const user = auth.currentUser;

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut(auth);
      
              // RootNavigator otomatik olarak Auth ekranına yönlendirecek
            } catch (error) {
              console.error('Çıkış hatası:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Bilgi', 'Hesap silme özelliği yakında eklenecek. Şimdilik destek ekibiyle iletişime geçebilirsiniz.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        Ayarlar
      </Text>

      {/* User Info Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onBackground }}>Hesap Bilgileri</List.Subheader>
        <List.Item
          title="E-posta"
          description={user?.email || 'Bilinmiyor'}
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Hesap Oluşturma"
          description={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          left={(props) => <List.Icon {...props} icon="calendar" />}
        />
      </List.Section>



      {/* Bildirimler */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onBackground }}>Bildirimler</List.Subheader>
        <List.Item
          title="Push Bildirimleri"
          description="Anlık bildirimler"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              color={theme.colors.primary}
            />
          )}
        />
        <List.Item
          title="E-posta Bildirimleri"
          description="Önemli güncellemeler için e-posta al"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="email-outline" />}
          right={() => (
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              color={theme.colors.primary}
            />
          )}
        />
      </List.Section>

      {/* Gizlilik ve Güvenlik */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onBackground }}>Gizlilik ve Güvenlik</List.Subheader>
        <List.Item
          title="Profil Görünürlüğü"
          description="Profilinizi herkese göster"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="account-eye" />}
          right={() => (
            <Switch
              value={profileVisibility}
              onValueChange={setProfileVisibility}
              color={theme.colors.primary}
            />
          )}
        />
        <List.Item
          title="Analitik Verileri"
          description="Uygulama geliştirme için veri paylaş"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={() => (
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              color={theme.colors.primary}
            />
          )}
        />
        <List.Item
          title="Şifre Değiştir"
          description="Hesap şifrenizi güncelleyin"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="lock-reset" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <List.Item
          title="Gizlilik Politikası"
          description="Veri toplama ve kullanım politikası"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <List.Item
          title="Kullanım Koşulları"
          description="Uygulama kullanım kuralları"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="file-document-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Terms')}
        />
      </List.Section>

      {/* Hesap İşlemleri */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onBackground }}>Hesap İşlemleri</List.Subheader>
        <List.Item
          title="Verilerimi İndir"
          description="Hesap verilerinizi dışa aktarın"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="download" />}
          onPress={() => {
            Alert.alert('Bilgi', 'Veri indirme özelliği yakında eklenecek.');
          }}
        />
        <List.Item
          title="Hesabı Sil"
          description="Hesabınızı kalıcı olarak silin"
          titleStyle={{ color: theme.colors.error }}
          descriptionStyle={{ color: theme.colors.error }}
          left={(props) => <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />}
          onPress={handleDeleteAccount}
        />
      </List.Section>

      {/* Uygulama */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onBackground }}>Uygulama</List.Subheader>
        <List.Item
          title="Hakkında"
          description="Uygulama hakkında bilgi"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="information" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('About')}
        />
        <List.Item
          title="Destek"
          description="Yardım ve destek"
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.secondary }}
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Support')}
        />
      </List.Section>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
        loading={loading}
        icon="logout"
      >
        Çıkış Yap
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  logoutButton: {
    margin: 20,
    marginTop: 30,
  },
}); 