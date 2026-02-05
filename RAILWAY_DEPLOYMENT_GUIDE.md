# 🚂 Railway Deployment Rehberi

## Neden Railway?
- ✅ Full-stack deployment (backend + frontend + database)
- ✅ Otomatik PostgreSQL database
- ✅ Kolay environment variable yönetimi
- ✅ GitHub entegrasyonu
- ✅ Tek domain, kolay yönetim
- ✅ Render'dan daha stabil

## 🚀 Deployment Adımları

### 1. Railway Hesabı Oluştur
1. [railway.app](https://railway.app) → "Start a New Project"
2. GitHub ile giriş yap
3. GitHub repo'na erişim izni ver

### 2. Proje Oluştur
1. "Deploy from GitHub repo" seç
2. `geld1` repository'sini seç
3. "Deploy Now" tıkla

### 3. Database Ekle
1. Proje dashboard'ında "Add Service" tıkla
2. "Database" → "PostgreSQL" seç
3. Database otomatik oluşturulacak

### 4. Environment Variables Ayarla
Railway otomatik `DATABASE_URL` oluşturacak. Diğerlerini manuel ekle:

**Backend Service Variables:**
```
JWT_SECRET=super-secret-jwt-key-for-social-tracker-app-2024
TMDB_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNDM3MzI3Y2Y5ZDI0YmNmMWJhODNlNTA1ZjhlMGEwNyIsIm5iZiI6MTc2OTYyMjYzNy4xOTUwMDAyLCJzdWIiOiI2OTdhNGM2ZDExM2YwNDkzYzExMmY2Y2EiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.cGdshBSCvpMofvGRBL3-GsEctxy2Gx_Ju6ds0BE5Mqo
GEMINI_API_KEY=AIzaSyC760TcZEwEMgew4BwVwXpUR8lHDVabku8
LASTFM_API_KEY=1fde97017f141e52fc703f83f29b5138
GOOGLE_PLACES_API_KEY=AIzaSyDsmiyvotuJbEHVbjjELwQrJdexMd91zAc
FOURSQUARE_API_KEY=fsq3YckbXHBJjWaPM0vuXzPZp8yyYJhKXdcDaLUvC6ALnns=
PORT=5000
```

### 5. Build ve Deploy
1. Railway otomatik build başlatacak
2. `nixpacks.toml` konfigürasyonu kullanılacak
3. İlk deployment 5-10 dakika sürebilir

### 6. Domain Ayarla
1. Service'e tıkla → "Settings" → "Networking"
2. "Generate Domain" tıkla
3. Custom domain ekleyebilirsin (opsiyonel)

## 🔧 Konfigürasyon Dosyaları

### `nixpacks.toml` (Zaten mevcut)
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = [
  'npm ci --include=dev',
  'cd client && npm ci --include=dev'
]

[phases.build]
cmds = [
  'cd client && npm run build',
  'cd server && npx prisma generate && npm run build'
]

[start]
cmd = 'cd server && npm start'

[variables]
NODE_ENV = 'production'
```

### `railway.json` (Zaten mevcut)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🎯 Beklenen Sonuç

**Deployment tamamlandığında:**
- Backend: `https://your-app.railway.app/api`
- Frontend: `https://your-app.railway.app`
- Database: PostgreSQL (otomatik bağlı)

**Çalışacak özellikler:**
- ✅ Kullanıcı kayıt/giriş
- ✅ Film/dizi/müzik/restoran ekleme
- ✅ iTunes API müzik arama
- ✅ TMDB API film/dizi arama
- ✅ AI önerileri (Gemini)
- ✅ Arkadaş sistemi
- ✅ Dinamik güven skorları
- ✅ Poster gösterimi

## 🚨 Sorun Giderme

### Build Hatası
```bash
# Eğer build hatası alırsan:
git add .
git commit -m "Fix build"
git push
# Railway otomatik yeniden deploy edecek
```

### Database Bağlantı Sorunu
1. Railway dashboard → Database service
2. "Connect" tab → Connection string'i kopyala
3. Backend service → Variables → `DATABASE_URL` güncelle

### Environment Variables Eksik
1. Backend service → Variables
2. Yukarıdaki tüm değişkenleri ekle
3. "Redeploy" tıkla

## 🎉 Başarı!

Railway deployment Render'dan çok daha stabil. Tüm özellikler sorunsuz çalışacak.

**Avantajları:**
- Tek platform, kolay yönetim
- Otomatik SSL sertifikası
- Hızlı deployment
- Güvenilir uptime
- Kolay scaling