import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, Appbar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AboutProps {
  navigation: any;
}

const features = [
  {
    icon: 'code-tags',
    title: 'Teknoloji Odaklı',
    description: 'Yazılım, donanım, yapay zeka ve daha fazlası hakkında güncel içerikler sunuyoruz.'
  },
  {
    icon: 'school',
    title: 'Öğrenme Platformu',
    description: 'Kullanıcılarımızın bilgi paylaşımı ve öğrenme süreçlerini destekliyoruz.'
  },
  {
    icon: 'account-group',
    title: 'Topluluk',
    description: 'Teknoloji meraklılarından oluşan güçlü bir topluluk oluşturuyoruz.'
  },
  {
    icon: 'lightbulb-on',
    title: 'Yenilikçi',
    description: 'Sürekli gelişen teknoloji dünyasını yakından takip ediyor ve paylaşıyoruz.'
  },
  {
    icon: 'shield-check',
    title: 'Güvenli',
    description: 'Kullanıcı verilerinin güvenliği ve gizliliği bizim için öncelikli.'
  },
  {
    icon: 'speedometer',
    title: 'Hızlı',
    description: 'Modern altyapımız ile hızlı ve kesintisiz bir deneyim sunuyoruz.'
  }
];

const CATEGORIES = [
  'Yazılım',
  'Donanım',
  'Siber Güvenlik',
  'Python',
  'Yapay Zeka',
  'Mobil',
  'Web',
  'Oyun',
  'Veri Bilimi',
  'Diğer'
];

export default function About({ navigation }: AboutProps) {
  const theme = useTheme();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const [usersSnapshot, postsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'posts'))
      ]);
      
      setUserCount(usersSnapshot.size);
      setPostCount(postsSnapshot.size);
    } catch (error) {
      console.error('Error fetching counts:', error);
      setUserCount(0);
      setPostCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Hakkımızda" />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text variant="headlineLarge" style={[styles.heroTitle, { color: theme.colors.onBackground }]}>
            Hakkımızda
          </Text>
          <Text variant="bodyLarge" style={[styles.heroSubtitle, { color: theme.colors.secondary }]}>
            Teknoloji dünyasında bilgi paylaşımını ve öğrenmeyi kolaylaştıran modern bir platform
          </Text>
        </View>

        {/* Misyon ve Vizyon */}
        <View style={styles.section}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconHeader}>
                <Icon name="target" size={32} color={theme.colors.primary} />
                <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                  Misyonumuz
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.cardDescription, { color: theme.colors.onSurface }]}>
                Teknoloji meraklılarının bilgi ve deneyimlerini paylaşabilecekleri, öğrenme süreçlerini 
                destekleyecekleri güvenli ve modern bir platform sunmak. Kullanıcılarımızın teknoloji 
                dünyasındaki gelişmeleri yakından takip etmelerini ve bu gelişmelere katkıda bulunmalarını sağlamak.
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconHeader}>
                <Icon name="eye" size={32} color={theme.colors.primary} />
                <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                  Vizyonumuz
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.cardDescription, { color: theme.colors.onSurface }]}>
                Türkiye'nin ve dünyanın en büyük teknoloji topluluklarından biri olmak. Kullanıcılarımızın 
                ihtiyaçlarına yönelik sürekli gelişen ve yenilenen bir platform sunarak, teknoloji dünyasındaki 
                bilgi paylaşımını daha erişilebilir hale getirmek.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Özellikler */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Platformumuzun Özellikleri
          </Text>
          
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Card key={index} style={[styles.featureCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Card.Content style={styles.featureContent}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Icon name={feature.icon} size={28} color={theme.colors.primary} />
                  </View>
                  <Text variant="titleMedium" style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                    {feature.title}
                  </Text>
                  <Text variant="bodySmall" style={[styles.featureDescription, { color: theme.colors.onSurface }]}>
                    {feature.description}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.section}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Platform İstatistikleri
          </Text>
          
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
            <Card.Content>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.onPrimaryContainer }]}>
                    İstatistikler yükleniyor...
                  </Text>
                </View>
              ) : (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onPrimaryContainer }]}>
                      {userCount || 0}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}>
                      Aktif Kullanıcı
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onPrimaryContainer }]}>
                      {postCount || 0}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}>
                      Paylaşılan İçerik
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onPrimaryContainer }]}>
                      {CATEGORIES.length - 1}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}>
                      Kategori
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onPrimaryContainer }]}>
                      24/7
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}>
                      Destek
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* İletişim */}
        <View style={styles.section}>
          <Card style={[styles.contactCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.contactContent}>
              <Icon name="email" size={48} color={theme.colors.primary} />
              <Text variant="headlineSmall" style={[styles.contactTitle, { color: theme.colors.onSurface }]}>
                Bizimle İletişime Geçin
              </Text>
              <Text variant="bodyMedium" style={[styles.contactDescription, { color: theme.colors.onSurface }]}>
                Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz.
              </Text>
              <Text variant="titleMedium" style={[styles.contactEmail, { color: theme.colors.primary }]}>
                info@ceterelece.net
              </Text>
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
    marginBottom: 12,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cardDescription: {
    lineHeight: 22,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    marginBottom: 16,
  },
  featureContent: {
    alignItems: 'center',
    padding: 16,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    textAlign: 'center',
    lineHeight: 18,
  },
  statsCard: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  contactCard: {
    marginTop: 8,
  },
  contactContent: {
    alignItems: 'center',
    padding: 24,
  },
  contactTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  contactDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactEmail: {
    fontWeight: 'bold',
  },
}); 