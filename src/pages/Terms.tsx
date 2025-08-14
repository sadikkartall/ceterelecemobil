import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, Appbar } from 'react-native-paper';

interface TermsProps {
  navigation: any;
}

const sections = [
  {
    title: 'Giriş',
    content: 'Ceterelece Mobil\'e hoş geldiniz! Bu kullanım koşulları, uygulamamızı kullanırken uymanız gereken kuralları ve haklarınızı açıklar.'
  },
  {
    title: 'Hesap Oluşturma ve Güvenlik',
    content: [
      'Hesap oluştururken doğru ve güncel bilgiler vermelisiniz.',
      'Hesabınızın güvenliğinden siz sorumlusunuz.',
      'Şifrenizi güvende tutmalı ve başkalarıyla paylaşmamalısınız.',
      'Hesabınızın izinsiz kullanıldığını fark ederseniz hemen bize bildirin.'
    ]
  },
  {
    title: 'İçerik Paylaşımı',
    content: [
      'Paylaştığınız içeriklerden siz sorumlusunuz.',
      'Yasa dışı, zararlı, tehdit edici, hakaret içeren veya telif hakkı ihlali yapan içerikler paylaşmak yasaktır.',
      'Platformda paylaşılan içerikler, topluluk kurallarına ve yasalara uygun olmalıdır.',
      'Spam, reklam veya yanıltıcı içerik paylaşmak yasaktır.',
      'Başkalarının kişisel bilgilerini izinsiz paylaşmak yasaktır.'
    ]
  },
  {
    title: 'Fikri Mülkiyet',
    content: [
      'Uygulamadaki tüm marka, logo ve içeriklerin hakları saklıdır.',
      'Kullanıcılar, başkalarına ait içerikleri izinsiz paylaşamaz.',
      'Telif hakkı ihlali yapan içerikler derhal kaldırılır.'
    ]
  },
  {
    title: 'Uygulamanın Kullanımı',
    content: [
      'Uygulamayı yasalara ve topluluk kurallarına uygun şekilde kullanmalısınız.',
      'Uygulamanın işleyişini bozacak, zarar verecek veya kötüye kullanacak eylemler yasaktır.',
      'Otomatik bot veya script kullanmak yasaktır.',
      'Diğer kullanıcıları rahatsız edecek veya taciz edecek davranışlar yasaktır.'
    ]
  },
  {
    title: "Hesabın Askıya Alınması veya Sonlandırılması",
    content: [
      'Kurallara aykırı davranışlarda bulunan kullanıcıların hesapları askıya alınabilir veya silinebilir.',
      'Tekrarlanan ihlallerde kalıcı yasaklama uygulanabilir.',
      'Hesap kapatma durumunda verileriniz 30 gün içinde silinir.'
    ]
  },
  {
    title: 'Sorumluluk Reddi',
    content: [
      'Uygulamada paylaşılan içeriklerden kullanıcılar sorumludur.',
      'Ceterelece Mobil, kullanıcılar tarafından paylaşılan içeriklerin doğruluğunu garanti etmez.',
      'Uygulama kesintilerinden veya veri kayıplarından sorumlu değiliz.',
      'Üçüncü taraf bağlantılarından sorumlu değiliz.'
    ]
  },
  {
    title: 'Değişiklikler',
    content: 'Kullanım koşullarında değişiklik yapma hakkımız saklıdır. Değişiklikler uygulama içinden ve e-posta ile duyurulur.'
  },
  {
    title: 'Geçerli Hukuk',
    content: 'Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir.'
  },
  {
    title: 'İletişim',
    content: 'Sorularınız için: info@ceterelece.net'
  }
];

export default function Terms({ navigation }: TermsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Kullanım Koşulları" />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          Kullanım Koşulları
        </Text>
        
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.secondary }]}>
          Uygulamamızı kullanmadan önce lütfen aşağıdaki koşulları dikkatlice okuyun.
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
              Bu kullanım koşulları son olarak 2024 yılında güncellenmiştir.
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