import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, List, Appbar } from 'react-native-paper';

interface PrivacyPolicyProps {
  navigation: any;
}

const sections = [
  {
    title: 'Giriş',
    content: 'Ceterelece Mobil olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.'
  },
  {
    title: 'Toplanan Bilgiler',
    content: [
      'Kayıt Bilgileri: Ad, e-posta adresi, kullanıcı adı, profil fotoğrafı gibi bilgiler.',
      'Kullanıcı İçeriği: Paylaştığınız gönderiler, yorumlar, hobiler ve ilgi alanları.',
      'Otomatik Toplanan Bilgiler: IP adresi, cihaz bilgisi, uygulama kullanım istatistikleri (Firebase Analytics ile).'
    ]
  },
  {
    title: 'Bilgilerin Kullanımı',
    content: [
      'Hesap oluşturma ve yönetimi',
      'Kişiselleştirilmiş içerik sunma',
      'Platformun güvenliğini sağlama',
      'İstatistiksel analiz ve geliştirme',
      'Kullanıcıya bildirim gönderme'
    ]
  },
  {
    title: 'Bilgilerin Paylaşımı',
    content: [
      'Üçüncü Taraf Servisler: Firebase (barındırma, kimlik doğrulama, veri tabanı, depolama)',
      'Yasal zorunluluklar haricinde bilgileriniz üçüncü kişilerle paylaşılmaz.'
    ]
  },
  {
    title: 'Verilerin Saklanması ve Güvenliği',
    content: 'Verileriniz güvenli sunucularda saklanır. Yetkisiz erişime karşı teknik ve idari önlemler alınır. Firebase güvenlik kuralları ile verileriniz korunur.'
  },
  {
    title: 'Kullanıcı Hakları',
    content: [
      'Kişisel verilerinize erişme, düzeltme veya silme hakkınız vardır.',
      'Hesabınızı istediğiniz zaman silebilirsiniz.',
      'Veri taşınabilirlik hakkınız bulunmaktadır.'
    ]
  },
  {
    title: 'Çocukların Gizliliği',
    content: 'Uygulamamız 13 yaş altındaki çocuklara yönelik değildir. 13 yaş altından veri toplamamaktayız.'
  },
  {
    title: 'Değişiklikler',
    content: 'Gizlilik politikamızda değişiklik yapıldığında uygulama içinden ve e-posta ile duyurulur.'
  },
  {
    title: 'İletişim',
    content: 'Sorularınız için: info@ceterelece.net'
  }
];

export default function PrivacyPolicy({ navigation }: PrivacyPolicyProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gizlilik Politikası" />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          Gizlilik Politikası
        </Text>
        
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.secondary }]}>
          Kişisel verilerinizin gizliliği ve güvenliği bizim için önemlidir. Lütfen aşağıdaki politikamızı dikkatlice okuyun.
        </Text>

        {sections.map((section, index) => (
          <Card key={index} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {section.title}
              </Text>
              
              {Array.isArray(section.content) ? (
                <View style={styles.listContainer}>
                  {section.content.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.listItem}>
                      <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
                      <Text variant="bodyMedium" style={[styles.listText, { color: theme.colors.onSurface }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="bodyMedium" style={[styles.sectionContent, { color: theme.colors.onSurface }]}>
                  {section.content}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}

        <Card style={[styles.contactCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.contactTitle, { color: theme.colors.onPrimaryContainer }]}>
              Son Güncelleme
            </Text>
            <Text variant="bodyMedium" style={[styles.contactText, { color: theme.colors.onPrimaryContainer }]}>
              Bu gizlilik politikası son olarak 2024 yılında güncellenmiştir.
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    lineHeight: 22,
  },
  listContainer: {
    marginTop: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    lineHeight: 22,
  },
  contactCard: {
    marginTop: 8,
    elevation: 2,
  },
  contactTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
    lineHeight: 22,
  },
}); 