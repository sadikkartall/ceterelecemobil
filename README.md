# Ceterelece Mobil

Ceterelece web projesinin React Native ile yazılmış mobil versiyonudur. Android ve iOS platformlarında çalışmak üzere tasarlanmıştır.

## Özellikler

- Kullanıcı kimlik doğrulama (Giriş, Kayıt, Şifre sıfırlama)
- Gönderi oluşturma, görüntüleme
- Gönderi beğenme, yorum yapma
- Profil yönetimi
- Koyu/Açık tema desteği

## Teknolojiler

- React Native
- Expo
- Firebase (Firestore, Authentication)
- React Navigation
- Expo Router

## Kurulum

1. Bu projeyi bilgisayarınıza klonlayın:
```bash
git clone https://github.com/sadikkartall/ceterelecemobil.git
cd ceterelecemobil
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. Çevre değişkenlerini ayarlayın:
- `.env-example` dosyasını `.env` olarak kopyalayın
- `.env` dosyasındaki değişkenleri kendi Firebase projenize uygun olarak doldurun

4. Uygulamayı çalıştırın:
```bash
npm start
```

## Kullanım

- Uygulamayı ilk çalıştırdığınızda, kayıt ekranı açılacaktır.
- Kayıt olduktan veya giriş yaptıktan sonra, ana sayfada gönderileri görebilirsiniz.
- Keşfet sayfasında kategorilere göre içerik keşfedebilirsiniz.
- Oluştur sayfasında yeni gönderiler oluşturabilirsiniz.
- Profil sayfasında hesap ayarlarınızı düzenleyebilirsiniz.

## Güvenlik

Bu proje, Firebase kimlik bilgilerini ve diğer hassas bilgileri `.env` dosyasında saklar. Lütfen:
- `.env` dosyasını asla GitHub'a pushlamayın
- Örnek olarak `.env-example` dosyasını kullanın
- Uygulama dağıtımından önce yapılandırma bilgilerinizi gözden geçirin

## Web Versiyonu

Bu uygulama, aynı zamanda web tarayıcılarında çalışan bir React web uygulamasına sahiptir. Web uygulaması, cetereleceweb klasöründe bulunmaktadır.

## İletişim

Sorularınız veya geri bildirimleriniz için:
- Email: ornek@email.com
