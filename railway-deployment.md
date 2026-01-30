# Railway Deployment Guide - $5/Month

## 🚂 Railway ile Geld Deployment

### Adım 1: Railway Hesabı
1. [railway.app](https://railway.app) adresine gidin
2. GitHub ile giriş yapın
3. "New Project" tıklayın

### Adım 2: GitHub Repository Hazırlama
```bash
# Eğer henüz GitHub'da değilse
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/geld.git
git push -u origin main
```

### Adım 3: Railway'de Proje Oluşturma
1. "Deploy from GitHub repo" seçin
2. Geld repository'nizi seçin
3. "Deploy Now" tıklayın

### Adım 4: Services Konfigürasyonu

Railway otomatik olarak 2 service oluşturacak:
- **Frontend Service** (client klasörü)
- **Backend Service** (server klasörü)

### Adım 5: Database Ekleme
1. "New" → "Database" → "PostgreSQL"
2. Database otomatik olarak oluşturulacak
3. DATABASE_URL otomatik olarak backend'e bağlanacak

### Adım 6: Environment Variables

**Backend Service Variables:**
```env
DATABASE_URL=(Railway otomatik ekleyecek)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
FRONTEND_URL=https://your-frontend-domain.railway.app
TMDB_API_KEY=your-tmdb-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
GEMINI_API_KEY=your-gemini-api-key
LASTFM_API_KEY=your-lastfm-api-key
PORT=5000
```

**Frontend Service Variables:**
```env
VITE_API_URL=https://your-backend-domain.railway.app/api
```

### Adım 7: Build Konfigürasyonu

Railway otomatik olarak detect edecek, ama emin olmak için:

**Root dizinde railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false
  }
}
```

### Adım 8: Database Migration
Backend deploy edildikten sonra:
1. Railway dashboard'da backend service'e gidin
2. "Settings" → "Variables" → DATABASE_URL'yi kopyalayın
3. Local'de:
```bash
cd server
DATABASE_URL="your-railway-database-url" npx prisma migrate deploy
```

Veya Railway'de command çalıştırın:
```bash
npx prisma migrate deploy && npx prisma generate
```

## 🔧 Railway Konfigürasyon Dosyaları

### Root railway.json:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false
  }
}
```

### Server nixpacks.toml:
```toml
[phases.build]
cmds = ["npm install", "npm run build", "npx prisma generate"]

[phases.deploy]
cmd = "npm start"

[variables]
NODE_ENV = "production"
```

### Client nixpacks.toml:
```toml
[phases.build]
cmds = ["npm install", "npm run build"]

[phases.deploy]
cmd = "npx serve -s dist -l 3000"

[variables]
NODE_ENV = "production"
```

## 💰 Maliyet Breakdown
- **Starter Plan**: $5/month
- **Includes**: 
  - Frontend hosting
  - Backend hosting  
  - PostgreSQL database
  - Custom domain
  - SSL certificate
  - 500GB bandwidth

## 🚀 Deployment Süreci

1. **Code Push**: GitHub'a push yaptığınızda otomatik deploy
2. **Build Time**: ~2-3 dakika
3. **Live URL**: Her service için unique URL alırsınız
4. **Custom Domain**: Kendi domain'inizi bağlayabilirsiniz

## 🔍 Monitoring
- Railway dashboard'da logs görüntüleyebilirsiniz
- Metrics ve usage statistics
- Automatic SSL certificates
- Environment variables management

## 🛠️ Troubleshooting

**Common Issues:**
1. **Build fails**: package.json scripts'leri kontrol edin
2. **Database connection**: DATABASE_URL doğru mu?
3. **CORS errors**: FRONTEND_URL backend'de doğru mu?
4. **API calls fail**: VITE_API_URL frontend'de doğru mu?

**Debug Commands:**
```bash
# Railway CLI ile logs
railway logs

# Database connection test
railway run npx prisma db push
```

## 📝 Checklist

- [ ] GitHub repository hazır
- [ ] Railway hesabı oluşturuldu
- [ ] Project deploy edildi
- [ ] Database eklendi
- [ ] Environment variables ayarlandı
- [ ] Database migration yapıldı
- [ ] Frontend backend'e bağlanıyor
- [ ] Authentication çalışıyor
- [ ] Custom domain bağlandı (opsiyonel)

## 🎯 Next Steps

1. Custom domain satın alın (Namecheap, Cloudflare)
2. Railway'de domain'i bağlayın
3. Google Analytics ekleyin
4. Error monitoring (Sentry) ekleyin
5. Backup stratejisi oluşturun