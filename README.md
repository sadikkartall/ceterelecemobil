## Ceterelece Mobil

React Native (Expo) ile geliştirilmiş mobil uygulama. Firebase Authentication, Firestore ve Storage kullanır; temel akış olarak kimlik doğrulama, gönderi oluşturma/görüntüleme ve profil yönetimi içerir.

### İçindekiler
- Proje Özeti
- Özellikler
- Gereksinimler
- Kurulum
- Çalıştırma
- Yapılandırma (Firebase)
- Proje Yapısı
- Kullanım
- Build/Yayınlama (öneriler)
- Sorun Giderme
- GitHub’a Push

### Proje Özeti
- Framework: Expo ~53 (React Native 0.79, React 19)
- Navigasyon: `@react-navigation/*` (Stack + Bottom Tabs)
- UI: `react-native-paper`
- Durum: Firebase Auth ile oturum yönetimi, Firestore ile veri, Storage ile medya yükleme

### Özellikler
- Kimlik doğrulama (Firebase Auth)
- Gönderi oluşturma ve detay sayfası
- Profil görüntüleme ve düzenleme
- Bildirimler ve ayarlar ekranları
- Gizlilik Politikası, Şartlar, Hakkında ve Destek sayfaları

### Gereksinimler
- Node.js 18+ (LTS önerilir)
- npm 9+ veya pnpm/yarn (bu projede `npm` örneklenmiştir)
- Expo CLI (opsiyonel ama önerilir): `npm i -g expo`
- Android geliştirme için: Android Studio + Emulator veya gerçek cihaz (USB debugging)
- iOS geliştirme için (sadece macOS): Xcode + iOS Simulator veya gerçek cihaz

### Kurulum
```bash
npm install
```

### Çalıştırma
- Metro başlat: `npm run start`
- Android: `npm run android`
- iOS (macOS): `npm run ios`
- Web (deneme amaçlı): `npm run web`

Expo başlatıldığında QR kodu ile Expo Go üzerinden (aynı ağda) uygulamayı test edebilirsiniz.

### Yapılandırma (Firebase)
Proje Firebase ile çalışır. Firebase anahtarları `src/firebase/config.ts` dosyasındadır.

- Kendi Firebase projenizi oluşturun ve aşağıdaki alanları güncelleyin:
  - `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`
- Storage bucket özel kullanım için `getStorage(app, "gs://<bucket>")` şeklinde yapılandırılmıştır.

Notlar:
- Üretimde gizli bilgileri doğrudan koda koymayın. `react-native-dotenv` zaten devDependencies’te var; isterseniz `.env` ve `babel.config.js` üzerinden ortam değişkenlerine taşıyın.
- iOS için kamera/galeri izin açıklamaları `app.json` içinde hazırdır. Android izinleri yine `app.json` içindedir.

### Proje Yapısı
```
src/
  navigation/     # Root, Auth ve Main navigatorlar
  pages/           # Ekranlar (Home, CreatePost, PostDetail, Profile, Settings, vb.)
  services/        # api.ts, auth.ts, uploadService.ts
  firebase/        # Firebase config
  theme/           # react-native-paper tema
```

Ana giriş noktaları:
- `index.ts` ve `App.tsx`: uygulama başlangıcı
- `src/navigation/RootNavigator.tsx`: oturum durumuna göre Auth/Main yönlendirmesi

### Kullanım
- Uygulamayı başlattıktan sonra kayıt/oturum açma adımlarını tamamlayın.
- Ana sayfadan gönderi oluşturabilir, gönderi detaylarını görüntüleyebilirsiniz.
- Profil ekranından profil bilgilerinizi güncelleyebilirsiniz.
- Ayarlar/Şifre Değiştir ekranlarından hesap işlemlerini yönetebilirsiniz.

### Build/Yayınlama (öneriler)
Expo projeleri için EAS Build önerilir:
1) `npm i -g eas-cli`
2) `eas login`
3) `eas build -p android` veya `eas build -p ios`

Not: Bu repoda `eas.json` yok. İhtiyaç halinde oluşturup dağıtım stratejisini belirleyin.

### Sorun Giderme
- Metro cache temizleme: `npx expo start -c`
- Android cihaz görünmüyor: USB debugging açık mı, `adb devices` listeleniyor mu?
- iOS derleme sorunları: Xcode Command Line Tools kurulu mu, `xcode-select --install`?
- Port çakışmaları: Expo başlatma sırasında farklı port seçin veya çakışan süreçleri kapatın.

### GitHub’a Push
Projeyi GitHub’a göndermek için aşağıdaki komutları izleyin (yerine kendi repo adresinizi yazın):
```bash
git init
git add .
git commit -m "Proje başlangıcı ve README"
git branch -M main
git remote add origin https://github.com/<kullanici-adi>/<repo-adi>.git
git push -u origin main
```

Mevcut bir repo ise sadece:
```bash
git add .
git commit -m "README eklendi/güncellendi"
git push
```

### Ek Notlar
- `app.json` içindeki `bundleIdentifier` (iOS) ve `package` (Android) alanlarını kendi paket adınızla güncelleyin.
- `react-native-reanimated` ve `react-native-gesture-handler` gibi kütüphaneler için Expo 53 ile uyumlu sürümler kullanılır; uyumsuzluk yaşarsanız peer dependency uyarılarını kontrol edin.


