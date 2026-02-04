# iTunes Search API Entegrasyonu

## iTunes Search API Özellikleri

### ✅ Avantajları:
- **Ücretsiz**: Herhangi bir API key gerektirmez
- **Kimlik Doğrulama Yok**: Basit HTTP GET istekleri
- **Zengin Metadata**: Şarkı, sanatçı, albüm, yıl, kapak görseli
- **Yüksek Kalite**: Resmi Apple Music veritabanı
- **Türkiye Desteği**: TR market desteği
- **Albüm Kapakları**: Yüksek çözünürlüklü görseller (30x30, 60x60, 100x100, 300x300)
- **Preview URL**: 30 saniyelik önizleme
- **iTunes Linki**: Direkt iTunes/Apple Music linki
- **Süre Bilgisi**: Milisaniye cinsinden şarkı süresi

### 🎵 Sağladığı Veriler:
- Şarkı adı ve sanatçı
- Albüm adı ve kapak görseli
- Çıkış yılı
- Tür bilgisi (primaryGenreName)
- 30 saniyelik önizleme linki
- iTunes/Apple Music linki
- Süre (milisaniye)
- Fiyat bilgisi
- Ülke ve para birimi

### 🔄 Fallback Sistemi:
1. **Öncelik**: iTunes Search API
2. **Fallback**: Last.fm API (LASTFM_API_KEY gerekli)
3. **Son çare**: Genişletilmiş statik fallback listesi (500+ şarkı)

## API Kullanımı

iTunes Search API herhangi bir kurulum gerektirmez. Basit HTTP GET istekleri ile çalışır:

```
GET https://itunes.apple.com/search?term=tarkan&media=music&entity=song&limit=8&country=TR
```

### Parametreler:
- `term`: Arama terimi
- `media`: music (müzik için)
- `entity`: song (şarkı için)
- `limit`: Sonuç sayısı (maksimum 200)
- `country`: TR (Türkiye pazarı için)

## Test Etme

iTunes API entegrasyonu otomatik olarak çalışır:

1. Sunucuyu başlat: `npm run dev`
2. Müzik arama sayfasına git
3. Bir şarkı ara (örn: "Tarkan")
4. iTunes'dan gelen gerçek sonuçları gör

## API Limitleri

- **Rate Limit**: Dakikada 20 istek (Apple tarafından)
- **Kimlik Doğrulama**: Gerekli değil
- **Market**: TR (Türkiye) pazarı için optimize
- **Sonuç Limiti**: İstek başına maksimum 200 sonuç

## Örnek Yanıt

```json
{
  "id": 499334149,
  "title": "Kuzu Kuzu",
  "artist": "Tarkan",
  "album": "Karma",
  "year": 2001,
  "genre": "Turkish Pop",
  "duration": 233,
  "price": 0.99,
  "preview_url": "https://audio-ssl.itunes.apple.com/...",
  "itunes_url": "https://music.apple.com/tr/album/...",
  "image": "https://is1-ssl.mzstatic.com/.../300x300bb.jpg",
  "itunesId": 499334149
}
```