import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
  withDelay
} from 'react-native-reanimated';

export function SplashAnimation() {
  // Ekran genişliğini alalım
  const { width } = Dimensions.get('window');
  
  // Animasyon için kullanılacak değeri tanımla
  const textPosition = useSharedValue(-width); // Ekranın tamamen solundan başla

  // Bileşen yüklendiğinde animasyonu başlat
  useEffect(() => {
    // Animasyonu başlat - soldan ekranın ortasına doğru
    textPosition.value = withSequence(
      // Kısa bir bekleme
      withDelay(
        100,
        // Soldan sağa doğru kayma animasyonu
        withTiming(0, {
          duration: 1200,
          easing: Easing.out(Easing.cubic),
        })
      )
    );
  }, []);

  // Animasyonlu stil tanımı
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: textPosition.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, animatedStyle]}>
        CETERELECE.NET
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
    letterSpacing: 1.5,
  },
}); 