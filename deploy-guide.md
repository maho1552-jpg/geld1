# Geld Deployment Guide

## 🚀 Production'a Hazırlık

### 1. Environment Variables Ayarlama

**Server (.env):**
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# API Keys
TMDB_API_KEY="your-tmdb-api-key"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
GEMINI_API_KEY="your-gemini-api-key"
LASTFM_API_KEY="your-lastfm-api-key"

# CORS
FRONTEND_URL="https://your-frontend-domain.com"

# Port
PORT=5000
```

**Client (environment variables):**
```env
VITE_API_URL="https://your-backend-domain.com/api"
```

### 2. Database Migration

Production veritabanında tabloları oluşturmak için:
```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 3. Build Scripts

**Client build:**
```bash
cd client
npm run build
```

**Server build:**
```bash
cd server
npm run build
```

## 🌐 Deployment Seçenekleri

### Option 1: Vercel (Önerilen)

**Avantajları:**
- Çok kolay setup
- Otomatik HTTPS
- Global CDN
- Serverless functions
- Ücretsiz plan

**Adımlar:**
1. GitHub'a push edin
2. vercel.com'da hesap açın
3. Import project
4. Environment variables'ları ekleyin
5. Deploy!

**Frontend Config (vercel.json):**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Backend Config (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.ts"
    }
  ]
}
```

### Option 2: Netlify + Railway

**Frontend (Netlify):**
1. netlify.com'da hesap açın
2. "New site from Git"
3. Build command: `npm run build`
4. Publish directory: `dist`

**Backend (Railway):**
1. railway.app'de hesap açın
2. "Deploy from GitHub"
3. PostgreSQL service ekleyin
4. Environment variables ayarlayın

### Option 3: DigitalOcean App Platform

**Avantajları:**
- Full-stack deployment
- Managed database
- Auto-scaling
- $5/month'dan başlayan fiyatlar

### Option 4: AWS (Advanced)

**Services:**
- Frontend: S3 + CloudFront
- Backend: EC2 veya Lambda
- Database: RDS PostgreSQL
- Domain: Route 53

## 🔒 Güvenlik Checklist

- [ ] JWT secret güçlü ve unique
- [ ] Database credentials güvenli
- [ ] API keys environment variables'da
- [ ] CORS ayarları doğru
- [ ] HTTPS enabled
- [ ] Rate limiting aktif
- [ ] Input validation yapılıyor

## 📊 Monitoring

**Önerilen tools:**
- Vercel Analytics
- Sentry (error tracking)
- LogRocket (user sessions)
- Uptime monitoring

## 🚀 CI/CD Pipeline

**GitHub Actions örneği:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 💰 Maliyet Tahmini

**Ücretsiz Tier:**
- Vercel: Frontend ücretsiz
- Railway: $5/month (backend + database)
- **Toplam: ~$5/month**

**Profesyonel:**
- Vercel Pro: $20/month
- Railway Pro: $20/month
- **Toplam: ~$40/month**

## 🎯 Önerilen Başlangıç

1. **Vercel** ile başlayın (en kolay)
2. Database için **Railway** veya **PlanetScale**
3. Domain için **Namecheap** veya **Cloudflare**
4. Monitoring için **Vercel Analytics**

## 📝 Deployment Checklist

- [ ] Environment variables ayarlandı
- [ ] Database migration yapıldı
- [ ] Build scripts çalışıyor
- [ ] CORS ayarları doğru
- [ ] API endpoints test edildi
- [ ] Frontend backend'e bağlanıyor
- [ ] Authentication çalışıyor
- [ ] File uploads çalışıyor (varsa)
- [ ] Email notifications çalışıyor (varsa)