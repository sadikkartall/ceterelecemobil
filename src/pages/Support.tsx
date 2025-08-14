import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, useTheme, Card, Appbar, Button, TextInput, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SupportProps {
  navigation: any;
}

const faqData = [
  {
    question: 'Hesap nasıl oluşturabilirim?',
    answer: 'Uygulamayı açtığınızda "Kayıt Ol" butonuna tıklayarak e-posta adresiniz ve şifreniz ile hesap oluşturabilirsiniz.'
  },
  {
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Giriş ekranında "Şifremi Unuttum" linkine tıklayarak e-posta adresinize şifre sıfırlama bağlantısı gönderebilirsiniz.'
  },
  {
    question: 'Gönderi nasıl paylaşabilirim?',
    answer: 'Ana sayfada "+" butonuna tıklayarak yeni gönderi oluşturabilirsiniz. Başlık, içerik ve kategori seçerek gönderinizi paylaşabilirsiniz.'
  },
  {
    question: 'Profil fotoğrafımı nasıl değiştirebilirim?',
    answer: 'Profil sayfanızda profil fotoğrafınıza tıklayarak galeriden seçebilir veya kamera ile çekebilirsiniz.'
  },
  {
    question: 'Bildirimleri nasıl açıp kapatabilirim?',
    answer: 'Ayarlar menüsünden Bildirimler bölümünde push bildirimleri ve e-posta bildirimlerini açıp kapatabilirsiniz.'
  },
  {
    question: 'Karanlık mod nasıl etkinleştirilir?',
    answer: 'Ayarlar menüsünden Görünüm bölümünde "Karanlık Mod" seçeneğini açabilirsiniz.'
  },
  {
    question: 'Hesabımı nasıl silebilirim?',
    answer: 'Ayarlar > Hesap İşlemleri > Hesabı Sil seçeneğinden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.'
  }
];

const contactMethods = [
  {
    icon: 'email',
    title: 'E-posta',
    description: 'info@ceterelece.net',
    action: () => Linking.openURL('mailto:info@ceterelece.net')
  },
  {
    icon: 'web',
    title: 'Web Sitesi',
    description: 'www.ceterelece.net',
    action: () => Linking.openURL('https://www.ceterelece.net')
  },
  {
    icon: 'phone',
    title: 'Telefon',
    description: '+90 XXX XXX XX XX',
    action: () => Alert.alert('Bilgi', 'Telefon desteği yakında eklenecek.')
  }
];

export default function Support({ navigation }: SupportProps) {
  const theme = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFaqToggle = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackText.trim() === '') {
      Alert.alert('Uyarı', 'Lütfen geri bildiriminizi yazın.');
      return;
    }

    setSubmittingFeedback(true);
    
    // Simüle edilmiş gönderim
    setTimeout(() => {
      Alert.alert(
        'Teşekkürler!', 
        'Geri bildiriminiz alındı. En kısa sürede değerlendirip size dönüş yapacağız.',
        [{ text: 'Tamam', onPress: () => setFeedbackText('') }]
      );
      setSubmittingFeedback(false);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Destek & Yardım" />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Icon name="help-circle" size={64} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: theme.colors.onBackground }]}>
            Size Nasıl Yardımcı Olabiliriz?
          </Text>
          <Text variant="bodyMedium" style={[styles.heroSubtitle, { color: theme.colors.secondary }]}>
            Sorularınız için aşağıdaki kaynakları inceleyebilir veya bizimle iletişime geçebilirsiniz.
          </Text>
        </View>

        {/* Sık Sorulan Sorular */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Sık Sorulan Sorular
          </Text>
          
          {faqData.map((faq, index) => (
            <Card key={index} style={[styles.faqCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <List.Item
                title={faq.question}
                titleStyle={[styles.faqQuestion, { color: theme.colors.onSurface }]}
                titleNumberOfLines={0}
                right={() => (
                  <Icon 
                    name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.colors.onSurface} 
                  />
                )}
                onPress={() => handleFaqToggle(index)}
              />
              {expandedFaq === index && (
                <Card.Content style={styles.faqAnswer}>
                  <Text variant="bodyMedium" style={[styles.faqAnswerText, { color: theme.colors.onSurface }]}>
                    {faq.answer}
                  </Text>
                </Card.Content>
              )}
            </Card>
          ))}
        </View>

        {/* İletişim Yolları */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            İletişim
          </Text>
          
          {contactMethods.map((contact, index) => (
            <Card key={index} style={[styles.contactCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <List.Item
                title={contact.title}
                description={contact.description}
                titleStyle={{ color: theme.colors.onSurface }}
                descriptionStyle={{ color: theme.colors.secondary }}
                left={() => <Icon name={contact.icon} size={24} color={theme.colors.primary} />}
                right={() => <Icon name="chevron-right" size={24} color={theme.colors.onSurface} />}
                onPress={contact.action}
              />
            </Card>
          ))}
        </View>

        {/* Geri Bildirim Formu */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Geri Bildirim
          </Text>
          
          <Card style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.feedbackContent}>
              <Text variant="bodyMedium" style={[styles.feedbackDescription, { color: theme.colors.onSurface }]}>
                Uygulamamızı nasıl geliştirebileceğimiz konusunda fikirlerinizi bizimle paylaşın.
              </Text>
              
              <TextInput
                mode="outlined"
                placeholder="Geri bildiriminizi buraya yazın..."
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={4}
                style={styles.feedbackInput}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              
              <Button
                mode="contained"
                onPress={handleFeedbackSubmit}
                loading={submittingFeedback}
                disabled={submittingFeedback}
                style={styles.feedbackButton}
                icon="send"
              >
                Gönder
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Hızlı Yardım */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Hızlı Yardım
          </Text>
          
          <View style={styles.quickHelpContainer}>
            <Card style={[styles.quickHelpCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
              <Card.Content style={styles.quickHelpContent}>
                <Icon name="book-open-variant" size={32} color={theme.colors.onPrimaryContainer} />
                <Text variant="titleMedium" style={[styles.quickHelpTitle, { color: theme.colors.onPrimaryContainer }]}>
                  Kullanım Kılavuzu
                </Text>
                <Text variant="bodySmall" style={[styles.quickHelpDescription, { color: theme.colors.onPrimaryContainer }]}>
                  Uygulama özelliklerini öğrenin
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.quickHelpCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
              <Card.Content style={styles.quickHelpContent}>
                <Icon name="shield-check" size={32} color={theme.colors.onSecondaryContainer} />
                <Text variant="titleMedium" style={[styles.quickHelpTitle, { color: theme.colors.onSecondaryContainer }]}>
                  Güvenlik İpuçları
                </Text>
                <Text variant="bodySmall" style={[styles.quickHelpDescription, { color: theme.colors.onSecondaryContainer }]}>
                  Hesabınızı güvende tutun
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Destek Saatleri */}
        <View style={styles.section}>
          <Card style={[styles.supportHoursCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.supportHoursContent}>
              <Icon name="clock-outline" size={24} color={theme.colors.primary} />
              <View style={styles.supportHoursText}>
                <Text variant="titleMedium" style={[styles.supportHoursTitle, { color: theme.colors.onSurface }]}>
                  Destek Saatleri
                </Text>
                <Text variant="bodyMedium" style={[styles.supportHoursDescription, { color: theme.colors.secondary }]}>
                  Pazartesi - Cuma: 09:00 - 18:00{'\n'}
                  Hafta sonu: 10:00 - 16:00
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
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
    paddingBottom: 32,
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqCard: {
    marginBottom: 8,
  },
  faqQuestion: {
    fontWeight: '600',
  },
  faqAnswer: {
    paddingTop: 0,
    paddingBottom: 16,
  },
  faqAnswerText: {
    lineHeight: 22,
  },
  contactCard: {
    marginBottom: 8,
  },
  feedbackCard: {
    marginTop: 8,
  },
  feedbackContent: {
    padding: 20,
  },
  feedbackDescription: {
    marginBottom: 16,
    lineHeight: 22,
  },
  feedbackInput: {
    marginBottom: 16,
  },
  feedbackButton: {
    alignSelf: 'flex-start',
  },
  quickHelpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickHelpCard: {
    flex: 1,
  },
  quickHelpContent: {
    alignItems: 'center',
    padding: 16,
  },
  quickHelpTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  quickHelpDescription: {
    textAlign: 'center',
  },
  supportHoursCard: {
    marginTop: 8,
  },
  supportHoursContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  supportHoursText: {
    marginLeft: 16,
    flex: 1,
  },
  supportHoursTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supportHoursDescription: {
    lineHeight: 20,
  },
}); 