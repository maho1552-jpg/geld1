import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AIRecommendationService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not found or not configured. AI recommendations will use fallback mode.');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Kullanıcının zevk profilini AI ile analiz et
  async generatePersonalizedRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT', limit = 5) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not configured');
      }

      // Kullanıcının mevcut içeriklerini al
      const userContent = await this.getUserContent(userId);
      
      if (userContent.totalItems === 0) {
        return this.getFallbackRecommendations(type, limit);
      }

      // AI prompt'unu oluştur
      const prompt = this.createRecommendationPrompt(userContent, type, limit);
      
      // Gemini API'sini çağır
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // AI yanıtını parse et
      const recommendations = this.parseAIResponse(text, type);
      
      // Güven skorları ekle
      return recommendations.map((rec, index) => ({
        ...rec,
        confidence: Math.max(0.7 - (index * 0.1), 0.3), // İlk öneriler daha yüksek güven
        isAiGenerated: true,
        reason: rec.reason || 'AI tarafından öneriliyor'
      }));

    } catch (error) {
      console.error('AI recommendation error:', error);
      // Hata durumunda fallback öneriler döndür
      return this.getFallbackRecommendations(type, limit);
    }
  }

  // Kullanıcının içerik geçmişini analiz et
  private async getUserContent(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        movies: {
          orderBy: { rating: 'desc' },
          take: 10
        },
        tvShows: {
          orderBy: { rating: 'desc' },
          take: 10
        },
        music: {
          orderBy: { rating: 'desc' },
          take: 10
        },
        restaurants: {
          orderBy: { rating: 'desc' },
          take: 10
        }
      }
    });

    if (!user) throw new Error('User not found');

    // Türleri analiz et
    const movieGenres = this.extractGenres(user.movies.map(m => m.genre).filter((g): g is string => Boolean(g)));
    const tvGenres = this.extractGenres(user.tvShows.map(t => t.genre).filter((g): g is string => Boolean(g)));
    const musicGenres = this.extractGenres(user.music.map(m => m.genre).filter((g): g is string => Boolean(g)));
    const cuisineTypes = this.extractGenres(user.restaurants.map(r => r.cuisine).filter((g): g is string => Boolean(g)));

    // En yüksek puanlı içerikler
    const topMovies = user.movies.filter(m => m.rating && m.rating >= 4).slice(0, 5);
    const topTvShows = user.tvShows.filter(t => t.rating && t.rating >= 4).slice(0, 5);
    const topMusic = user.music.filter(m => m.rating && m.rating >= 4).slice(0, 5);
    const topRestaurants = user.restaurants.filter(r => r.rating && r.rating >= 4).slice(0, 5);

    return {
      totalItems: user.movies.length + user.tvShows.length + user.music.length + user.restaurants.length,
      movieGenres,
      tvGenres,
      musicGenres,
      cuisineTypes,
      topMovies,
      topTvShows,
      topMusic,
      topRestaurants,
      userProfile: {
        age: user.age,
        city: user.city,
        country: user.country
      }
    };
  }

  // AI için prompt oluştur
  private createRecommendationPrompt(userContent: any, type: string, limit: number): string {
    const typeMap = {
      'MOVIE': 'film',
      'TV_SHOW': 'dizi',
      'MUSIC': 'müzik',
      'RESTAURANT': 'restoran/mekan'
    };

    let prompt = `Sen bir ${typeMap[type as keyof typeof typeMap]} öneri uzmanısın. Kullanıcının zevklerini analiz ederek kişiselleştirilmiş öneriler yapacaksın.

KULLANICI PROFİLİ:
- Toplam içerik: ${userContent.totalItems}
- Yaş: ${userContent.userProfile.age || 'Belirtilmemiş'}
- Konum: ${userContent.userProfile.city || ''} ${userContent.userProfile.country || ''}

`;

    if (type === 'MOVIE') {
      prompt += `
KULLANICININ FİLM ZEVKLERİ:
- Favori türler: ${userContent.movieGenres.slice(0, 5).join(', ')}
- En sevdiği filmler: ${userContent.topMovies.map((m: any) => `${m.title} (${m.rating}/5)`).join(', ')}

${limit} adet film önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Film Adı",
  "year": 2024,
  "genre": "Tür1, Tür2",
  "director": "Yönetmen",
  "reason": "Neden öneriyorsun (kısa açıklama)"
}`;
    } else if (type === 'TV_SHOW') {
      prompt += `
KULLANICININ DİZİ ZEVKLERİ:
- Favori türler: ${userContent.tvGenres.slice(0, 5).join(', ')}
- En sevdiği diziler: ${userContent.topTvShows.map((t: any) => `${t.title} (${t.rating}/5)`).join(', ')}

${limit} adet dizi önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Dizi Adı",
  "year": 2024,
  "genre": "Tür1, Tür2",
  "seasons": 3,
  "reason": "Neden öneriyorsun (kısa açıklama)"
}`;
    } else if (type === 'MUSIC') {
      prompt += `
KULLANICININ MÜZİK ZEVKLERİ:
- Favori türler: ${userContent.musicGenres.slice(0, 5).join(', ')}
- En sevdiği müzikler: ${userContent.topMusic.map((m: any) => `${m.artist} - ${m.title} (${m.rating}/5)`).join(', ')}

${limit} adet müzik önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Şarkı Adı",
  "artist": "Sanatçı",
  "album": "Album",
  "genre": "Tür1, Tür2",
  "reason": "Neden öneriyorsun (kısa açıklama)"
}`;
    } else if (type === 'RESTAURANT') {
      prompt += `
KULLANICININ MEKAN ZEVKLERİ:
- Favori mutfaklar: ${userContent.cuisineTypes.slice(0, 5).join(', ')}
- En sevdiği mekanlar: ${userContent.topRestaurants.map((r: any) => `${r.name} - ${r.cuisine} (${r.rating}/5)`).join(', ')}

${limit} adet restoran/mekan önerisi yap. Her öneri için şu formatı kullan:
{
  "name": "Mekan Adı",
  "type": "restaurant/cafe/bar",
  "cuisine": "Mutfak Türü",
  "location": "Şehir",
  "reason": "Neden öneriyorsun (kısa açıklama)"
}`;
    }

    prompt += `

ÖNEMLI KURALLAR:
1. Sadece JSON array formatında yanıt ver, başka metin ekleme
2. Türkçe içerik öner (Türk yapımları da dahil)
3. Kullanıcının mevcut zevklerine uygun ama yeni keşifler de öner
4. Her önerinin sebebini kısa ve net açıkla
5. Gerçek ve popüler içerikler öner

JSON Array formatında ${limit} öneri:`;

    return prompt;
  }

  // AI yanıtını parse et
  private parseAIResponse(text: string, type: string): any[] {
    try {
      // JSON'u temizle
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const recommendations = JSON.parse(cleanText);
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }

      return recommendations.map(rec => ({
        ...rec,
        type: type,
        source: 'ai'
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  // Fallback öneriler (AI çalışmazsa)
  private getFallbackRecommendations(type: string, limit: number): any[] {
    const fallbacks = {
      'MOVIE': [
        { title: 'Inception', year: 2010, genre: 'Sci-Fi, Thriller', director: 'Christopher Nolan', reason: 'Popüler bilim kurgu filmi' },
        { title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', director: 'Frank Darabont', reason: 'En iyi drama filmlerinden' },
        { title: 'Pulp Fiction', year: 1994, genre: 'Crime, Drama', director: 'Quentin Tarantino', reason: 'Klasik suç filmi' },
        { title: 'The Dark Knight', year: 2008, genre: 'Action, Crime', director: 'Christopher Nolan', reason: 'Süper kahraman filmi' },
        { title: 'Forrest Gump', year: 1994, genre: 'Drama, Romance', director: 'Robert Zemeckis', reason: 'Duygusal drama' }
      ],
      'TV_SHOW': [
        { title: 'Breaking Bad', year: 2008, genre: 'Crime, Drama', seasons: 5, reason: 'En iyi drama dizilerinden' },
        { title: 'Game of Thrones', year: 2011, genre: 'Fantasy, Drama', seasons: 8, reason: 'Epik fantastik dizi' },
        { title: 'The Office', year: 2005, genre: 'Comedy', seasons: 9, reason: 'Popüler komedi dizisi' },
        { title: 'Stranger Things', year: 2016, genre: 'Sci-Fi, Horror', seasons: 4, reason: 'Modern bilim kurgu' },
        { title: 'Friends', year: 1994, genre: 'Comedy, Romance', seasons: 10, reason: 'Klasik komedi' }
      ],
      'MUSIC': [
        { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', genre: 'Rock', reason: 'Klasik rock şaheseri' },
        { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', genre: 'Rock', reason: 'Efsane rock şarkısı' },
        { title: 'Imagine', artist: 'John Lennon', album: 'Imagine', genre: 'Pop, Rock', reason: 'Barış şarkısı' },
        { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', genre: 'Pop', reason: 'Pop müzik klasiği' },
        { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', genre: 'Rock', reason: 'Rock müzik efsanesi' }
      ],
      'RESTAURANT': [
        { name: 'Pandeli', type: 'restaurant', cuisine: 'Türk', location: 'İstanbul', reason: 'Tarihi Türk mutfağı' },
        { name: 'Çiya Sofrası', type: 'restaurant', cuisine: 'Türk', location: 'İstanbul', reason: 'Otantik Anadolu mutfağı' },
        { name: 'Hamdi Restaurant', type: 'restaurant', cuisine: 'Türk', location: 'İstanbul', reason: 'Ünlü kebap restoranı' },
        { name: 'Karaköy Lokantası', type: 'restaurant', cuisine: 'Türk', location: 'İstanbul', reason: 'Modern Türk mutfağı' },
        { name: 'Sunset Grill & Bar', type: 'restaurant', cuisine: 'Uluslararası', location: 'İstanbul', reason: 'Manzaralı fine dining' }
      ]
    };

    return (fallbacks[type as keyof typeof fallbacks] || [])
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        confidence: 0.5,
        isAiGenerated: false,
        source: 'fallback'
      }));
  }

  // Türleri çıkar ve sırala
  private extractGenres(genreStrings: string[]): string[] {
    const genreCount: Record<string, number> = {};
    
    genreStrings.forEach(genreString => {
      if (genreString) {
        const genres = genreString.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (genre) {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .map(([genre]) => genre);
  }

  // Benzer kullanıcılardan öneriler al
  async getCollaborativeRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT', limit = 5) {
    try {
      // Kullanıcının zevk profilini al
      const userProfile = await prisma.tasteProfile.findUnique({
        where: { userId }
      });

      if (!userProfile || !userProfile.tasteVector) {
        return [];
      }

      // Benzer kullanıcıları bul
      const allProfiles = await prisma.tasteProfile.findMany({
        where: {
          userId: { not: userId },
          tasteVector: { not: null }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      const userVector = JSON.parse(userProfile.tasteVector);
      const similarities = allProfiles.map(profile => ({
        user: profile.user,
        similarity: this.calculateCosineSimilarity(
          userVector,
          JSON.parse(profile.tasteVector!)
        )
      }));

      // En benzer 3 kullanıcıyı al
      const topSimilarUsers = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      const recommendations: any[] = [];

      // Her benzer kullanıcıdan öneriler al
      for (const { user, similarity } of topSimilarUsers) {
        let items: any[] = [];
        
        switch (type) {
          case 'MOVIE':
            items = await prisma.movie.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 2
            });
            break;
          case 'TV_SHOW':
            items = await prisma.tvShow.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 2
            });
            break;
          case 'MUSIC':
            items = await prisma.music.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 2
            });
            break;
          case 'RESTAURANT':
            items = await prisma.restaurant.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 2
            });
            break;
        }

        items.forEach(item => {
          recommendations.push({
            ...item,
            fromUser: user,
            confidence: similarity * 0.8,
            isAiGenerated: false,
            reason: `${user.name || user.username} tarafından öneriliyor (${Math.round(similarity * 100)}% benzerlik)`,
            source: 'collaborative'
          });
        });
      }

      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // Cosine similarity hesapla
  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < Math.min(vector1.length, vector2.length); i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Hibrit öneriler (AI + Collaborative)
  async getHybridRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT', limit = 10) {
    try {
      // Paralel olarak her iki yöntemi de çalıştır
      const [aiRecommendations, collaborativeRecommendations] = await Promise.all([
        this.generatePersonalizedRecommendations(userId, type, Math.ceil(limit * 0.7)),
        this.getCollaborativeRecommendations(userId, type, Math.ceil(limit * 0.3))
      ]);

      // Önerileri birleştir ve sırala
      const allRecommendations = [
        ...aiRecommendations,
        ...collaborativeRecommendations
      ];

      // Duplikatları kaldır (title/name bazında)
      const uniqueRecommendations = allRecommendations.filter((rec, index, arr) => {
        const identifier = rec.title || rec.name;
        return arr.findIndex(r => (r.title || r.name) === identifier) === index;
      });

      return uniqueRecommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      return this.getFallbackRecommendations(type, limit);
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();