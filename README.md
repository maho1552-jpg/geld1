# Geld

Geld, kullanıcıların izledikleri filmleri, dizileri, dinledikleri müzikleri ve gittikleri mekanları kaydetmelerini sağlayan sosyal medya uygulamasıdır. AI tabanlı tavsiye sistemi ile benzer zevklere sahip kullanıcılardan öneriler alabilirsiniz.

## Özellikler

### 🎬 İçerik Takibi
- Film, dizi, müzik ve restoran kaydetme
- Kişisel puanlama ve yorum sistemi
- Detaylı kategorizasyon

### 🤖 AI Tavsiye Sistemi
- Zevk profili analizi
- Benzer kullanıcıları bulma
- Kişiselleştirilmiş öneriler
- Güven skorları

### 👥 Sosyal Özellikler
- Kullanıcı takip sistemi
- İçerik beğenme ve yorum yapma
- Kullanıcıdan kullanıcıya tavsiyeler

### 📊 İstatistikler
- Kişisel aktivite takibi
- Zevk analizi raporları
- Trend analizi

## Teknoloji Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** veritabanı
- **Prisma** ORM
- **JWT** authentication
- **bcryptjs** şifreleme

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** styling
- **Vite** build tool
- **React Router** navigation
- **Axios** HTTP client
- **Lucide React** icons

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd geld
```

### 2. Backend kurulumu
```bash
cd server
npm install

# .env dosyasını oluşturun
cp .env.example .env
# .env dosyasını düzenleyerek veritabanı bilgilerini girin

# Veritabanını oluşturun
npm run db:push

# Sunucuyu başlatın
npm run dev
```

### 3. Frontend kurulumu
```bash
cd client
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

### 4. Uygulamayı açın
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Profil bilgileri

### Content Management
- `POST /api/content/movies` - Film ekleme
- `POST /api/content/tv-shows` - Dizi ekleme
- `POST /api/content/music` - Müzik ekleme
- `POST /api/content/restaurants` - Restoran ekleme
- `GET /api/content/my-content` - Kullanıcının içerikleri
- `GET /api/content/stats` - İstatistikler

### Recommendations
- `POST /api/recommendations/analyze-taste` - Zevk profili analizi
- `GET /api/recommendations/similar-users` - Benzer kullanıcılar
- `GET /api/recommendations/ai-suggestions/:type` - AI tavsiyeleri
- `POST /api/recommendations/send` - Tavsiye gönderme

## Veritabanı Şeması

### Ana Tablolar
- **users** - Kullanıcı bilgileri
- **movies** - Film kayıtları
- **tv_shows** - Dizi kayıtları
- **music** - Müzik kayıtları
- **restaurants** - Restoran kayıtları

### Sosyal Özellikler
- **follows** - Takip ilişkileri
- **likes** - Beğeniler
- **comments** - Yorumlar
- **recommendations** - Tavsiyeler

### AI Sistemi
- **taste_profiles** - Zevk profilleri
- Vektör tabanlı benzerlik hesaplama

## Geliştirme

### Backend geliştirme
```bash
cd server
npm run dev  # Nodemon ile otomatik yeniden başlatma
npm run db:studio  # Prisma Studio ile veritabanı yönetimi
```

### Frontend geliştirme
```bash
cd client
npm run dev  # Vite dev server
npm run build  # Production build
```

### Veritabanı işlemleri
```bash
cd server
npm run db:generate  # Prisma client oluşturma
npm run db:push      # Schema değişikliklerini veritabanına uygulama
npm run db:migrate   # Migration oluşturma
```

## Özellik Roadmap

### Yakın Gelecek
- [ ] Mobil responsive tasarım iyileştirmeleri
- [ ] Gelişmiş arama ve filtreleme
- [ ] Sosyal feed sayfası
- [ ] Bildirim sistemi

### Orta Vadeli
- [x] External API entegrasyonları (TMDB, iTunes, Google Places)
- [ ] Gelişmiş AI algoritmaları
- [ ] Grup oluşturma ve etkinlik planlama
- [ ] İstatistik dashboard'u

### Uzun Vadeli
- [ ] Mobil uygulama (React Native)
- [ ] Real-time chat sistemi
- [ ] Gamification özellikleri
- [ ] Machine learning tabanlı trend analizi

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.# geld
