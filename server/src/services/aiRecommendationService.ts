import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export class AIRecommendationService {
  private genAI: GoogleGenerativeAI | null = null;
  private tmdbApiKey: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.tmdbApiKey = process.env.TMDB_API_KEY || '';
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not found or not configured. AI recommendations will use fallback mode.');
      this.genAI = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log('AI recommendation service initialized with Gemini API');
  }

  // Kullanıcının zevk profilini AI ile analiz et
  async generatePersonalizedRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT', limit = 5) {
    try {
      if (!this.genAI) {
        console.log('AI not configured, using fallback recommendations');
        return await this.getFallbackRecommendations(type, limit, userId);
      }

      // Kullanıcının mevcut içeriklerini al
      const userContent = await this.getUserContent(userId);
      
      if (userContent.totalItems === 0) {
        return await this.getFallbackRecommendations(type, limit, userId);
      }

      // AI prompt'unu oluştur
      const prompt = this.createRecommendationPrompt(userContent, type, limit);
      
      // Gemini API'sini çağır
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // AI yanıtını parse et
      const recommendations = await this.parseAIResponse(text, type, userId);
      
      // Dinamik güven skorları ekle
      return recommendations.map((rec, index) => {
        // Kullanıcının içerik sayısına göre güven skoru hesapla
        const userItemCount = userContent.totalItems;
        let baseConfidence = 0.5; // Başlangıç güveni
        
        // Kullanıcının daha fazla içeriği varsa AI daha güvenli önerilerde bulunabilir
        if (userItemCount >= 10) {
          baseConfidence = 0.8;
        } else if (userItemCount >= 5) {
          baseConfidence = 0.7;
        } else if (userItemCount >= 2) {
          baseConfidence = 0.6;
        }
        
        // Sıralamaya göre güven azalt (ilk öneriler daha güvenilir)
        const positionPenalty = index * 0.05;
        
        // Rastgele varyasyon ekle (daha doğal görünmesi için)
        const randomVariation = (Math.random() - 0.5) * 0.1;
        
        const finalConfidence = Math.max(
          Math.min(baseConfidence - positionPenalty + randomVariation, 0.95), 
          0.25
        );
        
        return {
          ...rec,
          confidence: Math.round(finalConfidence * 100) / 100, // 2 decimal places
          isAiGenerated: true,
          reason: rec.reason || 'AI tarafından öneriliyor'
        };
      });

    } catch (error) {
      console.error('AI recommendation error:', error);
      // Hata durumunda fallback öneriler döndür
      return await this.getFallbackRecommendations(type, limit, userId);
    }
  }

  // Kullanıcının içerik geçmişini analiz et
  private async getUserContent(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        movies: {
          orderBy: { rating: 'desc' }
        },
        tvShows: {
          orderBy: { rating: 'desc' }
        },
        music: {
          orderBy: { rating: 'desc' }
        },
        restaurants: {
          orderBy: { rating: 'desc' }
        }
      }
    });

    if (!user) throw new Error('User not found');

    // Türleri analiz et
    const movieGenres = this.extractGenres(user.movies.map(m => m.genre).filter((g): g is string => Boolean(g)));
    const tvGenres = this.extractGenres(user.tvShows.map(t => t.genre).filter((g): g is string => Boolean(g)));
    const musicGenres = this.extractGenres(user.music.map(m => m.genre).filter((g): g is string => Boolean(g)));
    const cuisineTypes = this.extractGenres(user.restaurants.map(r => r.cuisine).filter((g): g is string => Boolean(g)));

    // En yüksek puanlı içerikler (analiz için)
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
      // Tüm içerikler (filtreleme için)
      allMovies: user.movies,
      allTvShows: user.tvShows,
      allMusic: user.music,
      allRestaurants: user.restaurants,
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

    // Son eklenen 5 içeriği al (en yeni önce)
    let recentContent: any[] = [];
    let recentGenres: string[] = [];
    
    if (type === 'MOVIE') {
      recentContent = userContent.allMovies
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      recentGenres = this.extractGenres(recentContent.map((m: any) => m.genre).filter((g): g is string => Boolean(g)));
    } else if (type === 'TV_SHOW') {
      recentContent = userContent.allTvShows
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      recentGenres = this.extractGenres(recentContent.map((t: any) => t.genre).filter((g): g is string => Boolean(g)));
    } else if (type === 'MUSIC') {
      recentContent = userContent.allMusic
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      recentGenres = this.extractGenres(recentContent.map((m: any) => m.genre).filter((g): g is string => Boolean(g)));
    } else if (type === 'RESTAURANT') {
      recentContent = userContent.allRestaurants
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      recentGenres = this.extractGenres(recentContent.map((r: any) => r.cuisine).filter((g): g is string => Boolean(g)));
    }

    let prompt = `Sen bir ${typeMap[type as keyof typeof typeMap]} öneri uzmanısın. Kullanıcının SON EKLEDİĞİ içerikleri analiz ederek benzer zevklerde yeni öneriler yapacaksın.

KULLANICI PROFİLİ:
- Toplam ${typeMap[type as keyof typeof typeMap]} sayısı: ${recentContent.length > 0 ? userContent.totalItems : 0}
- Yaş: ${userContent.userProfile.age || 'Belirtilmemiş'}
- Konum: ${userContent.userProfile.city || ''} ${userContent.userProfile.country || ''}

`;

    if (recentContent.length === 0) {
      prompt += `
DURUM: Kullanıcı henüz ${typeMap[type as keyof typeof typeMap]} eklememış.
GÖREV: Popüler ve kaliteli ${typeMap[type as keyof typeof typeMap]} önerileri yap.
`;
    } else {
      prompt += `
SON EKLEDİĞİ ${typeMap[type as keyof typeof typeMap].toUpperCase()}LER (En yeni → En eski):
`;

      if (type === 'MOVIE') {
        recentContent.forEach((item: any, index: number) => {
          prompt += `${index + 1}. ${item.title} (${item.year}) - ${item.genre} - ${item.rating}/5 puan\n`;
        });
        prompt += `
TREND ANALİZİ:
- Favori türler: ${recentGenres.slice(0, 3).join(', ')}
- Ortalama puan: ${(recentContent.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / recentContent.length).toFixed(1)}

${limit} adet film önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Film Adı",
  "year": 2024,
  "genre": "Tür1, Tür2",
  "director": "Yönetmen",
  "reason": "Neden öneriyorsun - son izlediği filmlerle bağlantı kur"
}`;
      } else if (type === 'TV_SHOW') {
        recentContent.forEach((item: any, index: number) => {
          prompt += `${index + 1}. ${item.title} (${item.year}) - ${item.genre} - ${item.rating}/5 puan\n`;
        });
        prompt += `
TREND ANALİZİ:
- Favori türler: ${recentGenres.slice(0, 3).join(', ')}
- Ortalama puan: ${(recentContent.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / recentContent.length).toFixed(1)}

${limit} adet dizi önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Dizi Adı",
  "year": 2024,
  "genre": "Tür1, Tür2",
  "seasons": 3,
  "reason": "Neden öneriyorsun - son izlediği dizilerle bağlantı kur"
}`;
      } else if (type === 'MUSIC') {
        recentContent.forEach((item: any, index: number) => {
          prompt += `${index + 1}. ${item.artist} - ${item.title} (${item.year}) - ${item.genre} - ${item.rating}/5 puan\n`;
        });
        prompt += `
TREND ANALİZİ:
- Favori türler: ${recentGenres.slice(0, 3).join(', ')}
- Ortalama puan: ${(recentContent.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / recentContent.length).toFixed(1)}

${limit} adet müzik önerisi yap. Her öneri için şu formatı kullan:
{
  "title": "Şarkı Adı",
  "artist": "Sanatçı",
  "album": "Album",
  "genre": "Tür1, Tür2",
  "reason": "Neden öneriyorsun - son dinlediği müziklerle bağlantı kur"
}`;
      } else if (type === 'RESTAURANT') {
        recentContent.forEach((item: any, index: number) => {
          prompt += `${index + 1}. ${item.name} - ${item.cuisine} (${item.location}) - ${item.rating}/5 puan\n`;
        });
        prompt += `
TREND ANALİZİ:
- Favori mutfaklar: ${recentGenres.slice(0, 3).join(', ')}
- Ortalama puan: ${(recentContent.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / recentContent.length).toFixed(1)}

${limit} adet restoran/mekan önerisi yap. Her öneri için şu formatı kullan:
{
  "name": "Mekan Adı",
  "type": "restaurant/cafe/bar",
  "cuisine": "Mutfak Türü",
  "location": "Şehir",
  "reason": "Neden öneriyorsun - son gittiği mekanlarla bağlantı kur"
}`;
      }
    }

    prompt += `

ÖNEMLI KURALLAR:
1. Sadece JSON array formatında yanıt ver, başka metin ekleme
2. Türkçe içerik öner (Türk yapımları da dahil)
3. Son eklenen içeriklerin türlerine ve tarzına odaklan
4. Her önerinin sebebini son eklenen içeriklerle ilişkilendirerek açıkla
5. Gerçek ve popüler içerikler öner
6. Kullanıcının trend'ini takip et - son eklediği türlere benzer öner

JSON Array formatında ${limit} öneri:`;

    return prompt;
  }

  // AI yanıtını parse et ve poster bilgisi ekle
  private async parseAIResponse(text: string, type: string, userId: string): Promise<any[]> {
    try {
      // JSON'u temizle
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const recommendations = JSON.parse(cleanText);
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }

      // Kullanıcının mevcut içeriklerini al (filtreleme için)
      const userContent = await this.getUserContent(userId);
      
      // Zaten eklenen içerikleri filtrele
      const filteredRecommendations = recommendations.filter(rec => {
        const title = rec.title || rec.name;
        
        switch (type) {
          case 'MOVIE':
            return !userContent.allMovies.some(movie => 
              movie.title.toLowerCase() === title.toLowerCase()
            );
          case 'TV_SHOW':
            return !userContent.allTvShows.some(show => 
              show.title.toLowerCase() === title.toLowerCase()
            );
          case 'MUSIC':
            return !userContent.allMusic.some(music => 
              music.title.toLowerCase() === title.toLowerCase() ||
              (rec.artist && music.artist && music.artist.toLowerCase() === rec.artist.toLowerCase())
            );
          case 'RESTAURANT':
            return !userContent.allRestaurants.some(restaurant => 
              restaurant.name.toLowerCase() === title.toLowerCase()
            );
          default:
            return true;
        }
      });

      // Film ve dizi önerileri için poster bilgisi ekle
      const enrichedRecommendations = await Promise.all(
        filteredRecommendations.map(async (rec) => {
          let enrichedRec = {
            ...rec,
            type: type,
            source: 'ai'
          };

          // Film ve diziler için TMDB'den poster çek
          if ((type === 'MOVIE' || type === 'TV_SHOW') && this.tmdbApiKey) {
            try {
              const poster = await this.fetchTMDBPoster(rec.title, type);
              if (poster) {
                enrichedRec.poster = poster;
              }
            } catch (error) {
              console.error(`Error fetching poster for ${rec.title}:`, error);
            }
          }

          return enrichedRec;
        })
      );

      return enrichedRecommendations;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  // TMDB'den poster bilgisi çek
  private async fetchTMDBPoster(title: string, type: string): Promise<string | null> {
    try {
      if (!this.tmdbApiKey) return null;

      const searchType = type === 'MOVIE' ? 'movie' : 'tv';
      const response = await axios.get(`https://api.themoviedb.org/3/search/${searchType}`, {
        params: {
          query: title,
          language: 'tr-TR'
        },
        headers: {
          'Authorization': `Bearer ${this.tmdbApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        return firstResult.poster_path;
      }

      return null;
    } catch (error) {
      console.error('TMDB API error:', error);
      return null;
    }
  }

  // Fallback öneriler (AI çalışmazsa)
  async getFallbackRecommendations(type: string, limit: number, userId?: string): Promise<any[]> {
    console.log('=== FALLBACK RECOMMENDATIONS ===');
    console.log('Type:', type);
    console.log('Limit:', limit);
    console.log('User ID:', userId);
    
    let selectedFallbacks: any[] = [];
    let userContent: any = null;

    // Kullanıcı verilerini al (akıllı öneriler için)
    if (userId) {
      try {
        userContent = await this.getUserContent(userId);
        console.log('User content loaded for smart recommendations');
      } catch (error) {
        console.error('Error loading user content:', error);
      }
    }

    // API'lerden gerçek veri çekmeyi dene
    try {
      switch (type) {
        case 'MOVIE':
          console.log('Fetching movies from TMDB API...');
          const moviesFromTMDB = await this.fetchTMDBMovieRecommendations(limit, userContent);
          if (moviesFromTMDB.length > 0) {
            selectedFallbacks = moviesFromTMDB;
            console.log('Got movies from TMDB:', selectedFallbacks.length);
            break;
          }
          break;
        case 'TV_SHOW':
          console.log('Fetching TV shows from TMDB API...');
          const tvFromTMDB = await this.fetchTMDBTVRecommendations(limit, userContent);
          if (tvFromTMDB.length > 0) {
            selectedFallbacks = tvFromTMDB;
            console.log('Got TV shows from TMDB:', selectedFallbacks.length);
            break;
          }
          break;
        case 'MUSIC':
          console.log('Fetching music from iTunes API...');
          const musicFromiTunes = await this.fetchiTunesRecommendations(limit);
          if (musicFromiTunes.length > 0) {
            selectedFallbacks = musicFromiTunes;
            console.log('Got music from iTunes:', selectedFallbacks.length);
            break;
          }
          
          console.log('iTunes failed, trying Last.fm API...');
          const musicFromLastFm = await this.fetchLastFmRecommendations(limit);
          if (musicFromLastFm.length > 0) {
            selectedFallbacks = musicFromLastFm;
            console.log('Got music from Last.fm:', selectedFallbacks.length);
            break;
          }
          break;
        case 'RESTAURANT':
          console.log('Fetching restaurants from Google Places API...');
          const restaurantsFromApi = await this.fetchGooglePlacesRecommendations(limit);
          if (restaurantsFromApi.length > 0) {
            selectedFallbacks = restaurantsFromApi;
            console.log('Got restaurants from Google Places:', selectedFallbacks.length);
            break;
          }
          break;
      }
    } catch (error) {
      console.error('API fetch error:', error);
    }

    // API'den veri gelmezse statik fallback kullan
    if (selectedFallbacks.length === 0) {
      console.log('Using static fallbacks...');
      const fallbacks = {
        'MOVIE': [
          { title: 'Inception', year: 2010, genre: 'Sci-Fi, Thriller', director: 'Christopher Nolan', reason: 'Popüler bilim kurgu filmi' },
          { title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', director: 'Frank Darabont', reason: 'En iyi drama filmlerinden' },
          { title: 'Pulp Fiction', year: 1994, genre: 'Crime, Drama', director: 'Quentin Tarantino', reason: 'Klasik suç filmi' },
          { title: 'The Dark Knight', year: 2008, genre: 'Action, Crime', director: 'Christopher Nolan', reason: 'Süper kahraman filmi' },
          { title: 'Forrest Gump', year: 1994, genre: 'Drama, Romance', director: 'Robert Zemeckis', reason: 'Duygusal drama' },
          { title: 'Interstellar', year: 2014, genre: 'Sci-Fi, Drama', director: 'Christopher Nolan', reason: 'Uzay bilim kurgu' },
          { title: 'The Godfather', year: 1972, genre: 'Crime, Drama', director: 'Francis Ford Coppola', reason: 'Klasik suç filmi' },
          { title: 'Fight Club', year: 1999, genre: 'Drama, Thriller', director: 'David Fincher', reason: 'Psikolojik gerilim' },
          { title: 'The Matrix', year: 1999, genre: 'Sci-Fi, Action', director: 'Lana Wachowski', reason: 'Devrimci bilim kurgu' },
          { title: 'Goodfellas', year: 1990, genre: 'Crime, Drama', director: 'Martin Scorsese', reason: 'Mafya klasiği' },
          { title: 'Schindler\'s List', year: 1993, genre: 'Drama, History', director: 'Steven Spielberg', reason: 'Tarihi drama' },
          { title: 'The Lord of the Rings', year: 2001, genre: 'Fantasy, Adventure', director: 'Peter Jackson', reason: 'Fantastik macera' },
          { title: 'Parasite', year: 2019, genre: 'Thriller, Drama', director: 'Bong Joon-ho', reason: 'Modern gerilim' },
          { title: 'Joker', year: 2019, genre: 'Crime, Drama', director: 'Todd Phillips', reason: 'Karakter analizi' },
          { title: 'Avengers: Endgame', year: 2019, genre: 'Action, Adventure', director: 'Anthony Russo', reason: 'Süper kahraman epik' },
          // Yeni filmler eklendi
          { title: 'Dune', year: 2021, genre: 'Sci-Fi, Adventure', director: 'Denis Villeneuve', reason: 'Modern bilim kurgu epik' },
          { title: 'No Time to Die', year: 2021, genre: 'Action, Thriller', director: 'Cary Joji Fukunaga', reason: 'James Bond serisi' },
          { title: 'Spider-Man: No Way Home', year: 2021, genre: 'Action, Adventure', director: 'Jon Watts', reason: 'Süper kahraman crossover' },
          { title: 'The Batman', year: 2022, genre: 'Action, Crime', director: 'Matt Reeves', reason: 'Yeni Batman yorumu' },
          { title: 'Top Gun: Maverick', year: 2022, genre: 'Action, Drama', director: 'Joseph Kosinski', reason: 'Aksiyon devam filmi' },
          { title: 'Avatar: The Way of Water', year: 2022, genre: 'Sci-Fi, Adventure', director: 'James Cameron', reason: 'Görsel şaheser' },
          { title: 'Everything Everywhere All at Once', year: 2022, genre: 'Sci-Fi, Comedy', director: 'Daniels', reason: 'Yaratıcı bilim kurgu' },
          { title: 'The Whale', year: 2022, genre: 'Drama', director: 'Darren Aronofsky', reason: 'Duygusal drama' },
          { title: 'Oppenheimer', year: 2023, genre: 'Biography, Drama', director: 'Christopher Nolan', reason: 'Tarihi biyografi' },
          { title: 'Barbie', year: 2023, genre: 'Comedy, Fantasy', director: 'Greta Gerwig', reason: 'Popüler komedi' },
          { title: 'Guardians of the Galaxy Vol. 3', year: 2023, genre: 'Action, Adventure', director: 'James Gunn', reason: 'Marvel serisi finali' },
          { title: 'John Wick: Chapter 4', year: 2023, genre: 'Action, Thriller', director: 'Chad Stahelski', reason: 'Aksiyon serisi' },
          { title: 'Scream VI', year: 2023, genre: 'Horror, Mystery', director: 'Matt Bettinelli-Olpin', reason: 'Korku serisi' },
          { title: 'The Super Mario Bros. Movie', year: 2023, genre: 'Animation, Adventure', director: 'Aaron Horvath', reason: 'Animasyon macera' },
          { title: 'Fast X', year: 2023, genre: 'Action, Crime', director: 'Louis Leterrier', reason: 'Hızlı ve Öfkeli serisi' },
          // Türk filmleri
          { title: 'Ayla', year: 2017, genre: 'Drama, War', director: 'Can Ulkay', reason: 'Türk savaş draması' },
          { title: 'Müslüm', year: 2018, genre: 'Biography, Drama', director: 'Ketche', reason: 'Müzik biyografisi' },
          { title: 'Miracle in Cell No. 7', year: 2019, genre: 'Drama, Family', director: 'Mehmet Ada Öztekin', reason: 'Duygusal aile filmi' },
          { title: 'The Wild Pear Tree', year: 2018, genre: 'Drama', director: 'Nuri Bilge Ceylan', reason: 'Sanat filmi' },
          { title: 'Winter Sleep', year: 2014, genre: 'Drama', director: 'Nuri Bilge Ceylan', reason: 'Cannes Palme d\'Or' },
          { title: 'Once Upon a Time in Anatolia', year: 2011, genre: 'Crime, Drama', director: 'Nuri Bilge Ceylan', reason: 'Türk sineması klasiği' },
          { title: 'Kış Uykusu', year: 2014, genre: 'Drama', director: 'Nuri Bilge Ceylan', reason: 'Uluslararası ödüllü' },
          { title: 'Babam ve Oğlum', year: 2005, genre: 'Drama, Family', director: 'Çağan Irmak', reason: 'Türk aile draması' },
          { title: 'G.O.R.A.', year: 2004, genre: 'Comedy, Sci-Fi', director: 'Ömer Faruk Sorak', reason: 'Türk bilim kurgu komedisi' },
          { title: 'Vizontele', year: 2001, genre: 'Comedy, Drama', director: 'Yılmaz Erdoğan', reason: 'Nostaljik Türk komedisi' }
        ],
        'TV_SHOW': [
          { title: 'Breaking Bad', year: 2008, genre: 'Crime, Drama', seasons: 5, reason: 'En iyi drama dizilerinden' },
          { title: 'Game of Thrones', year: 2011, genre: 'Fantasy, Drama', seasons: 8, reason: 'Epik fantastik dizi' },
          { title: 'The Office', year: 2005, genre: 'Comedy', seasons: 9, reason: 'Popüler komedi dizisi' },
          { title: 'Stranger Things', year: 2016, genre: 'Sci-Fi, Horror', seasons: 4, reason: 'Modern bilim kurgu' },
          { title: 'Friends', year: 1994, genre: 'Comedy, Romance', seasons: 10, reason: 'Klasik komedi' },
          { title: 'The Crown', year: 2016, genre: 'Drama, History', seasons: 6, reason: 'Tarihi drama' },
          { title: 'Sherlock', year: 2010, genre: 'Crime, Mystery', seasons: 4, reason: 'Modern dedektif' },
          { title: 'The Witcher', year: 2019, genre: 'Fantasy, Adventure', seasons: 3, reason: 'Fantastik macera' },
          { title: 'House of Cards', year: 2013, genre: 'Drama, Thriller', seasons: 6, reason: 'Politik gerilim' },
          { title: 'Narcos', year: 2015, genre: 'Crime, Drama', seasons: 3, reason: 'Suç draması' },
          { title: 'The Mandalorian', year: 2019, genre: 'Sci-Fi, Adventure', seasons: 3, reason: 'Star Wars evreni' },
          { title: 'Ozark', year: 2017, genre: 'Crime, Drama', seasons: 4, reason: 'Suç gerilimi' },
          { title: 'Money Heist', year: 2017, genre: 'Crime, Thriller', seasons: 5, reason: 'İspanyol gerilim' },
          { title: 'The Boys', year: 2019, genre: 'Action, Comedy', seasons: 4, reason: 'Süper kahraman parodisi' },
          { title: 'Wednesday', year: 2022, genre: 'Comedy, Horror', seasons: 1, reason: 'Modern gotik komedi' }
        ],
        'MUSIC': [
          { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', genre: 'Rock', reason: 'Klasik rock şaheseri' },
          { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', genre: 'Rock', reason: 'Efsane rock şarkısı' },
          { title: 'Imagine', artist: 'John Lennon', album: 'Imagine', genre: 'Rock', reason: 'Barış şarkısı' },
          { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', genre: 'Rock', reason: 'Rock klasiği' },
          { title: 'Yesterday', artist: 'The Beatles', album: 'Help!', genre: 'Pop', reason: 'Beatles klasiği' },
          { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', genre: 'Pop', reason: 'Pop ikonu' },
          { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', genre: 'Grunge', reason: 'Grunge klasiği' },
          { title: 'Sweet Child O Mine', artist: 'Guns N Roses', album: 'Appetite for Destruction', genre: 'Rock', reason: 'Hard rock klasiği' },
          { title: 'Wonderwall', artist: 'Oasis', album: 'Morning Glory', genre: 'Britpop', reason: 'Britpop klasiği' },
          { title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile Soundtrack', genre: 'Hip-Hop', reason: 'Hip-hop klasiği' },
          { title: 'Rolling in the Deep', artist: 'Adele', album: '21', genre: 'Soul', reason: 'Modern soul' },
          { title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide', genre: 'Pop', reason: 'Modern pop hit' },
          { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', genre: 'Synthpop', reason: 'Modern synthpop' },
          { title: 'Bad Guy', artist: 'Billie Eilish', album: 'When We All Fall Asleep', genre: 'Alternative', reason: 'Modern alternative' },
          { title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', genre: 'Pop', reason: 'Modern pop rock' }
        ],
        'RESTAURANT': [
          { name: 'Pandeli', type: 'restaurant', cuisine: 'Osmanlı Mutfağı', location: 'İstanbul', reason: 'Tarihi Osmanlı lezzetleri' },
          { name: 'Çiya Sofrası', type: 'restaurant', cuisine: 'Anadolu Mutfağı', location: 'İstanbul', reason: 'Otantik Türk mutfağı' },
          { name: 'Nusr-Et', type: 'restaurant', cuisine: 'Et Lokantası', location: 'İstanbul', reason: 'Ünlü et restoranı' },
          { name: 'Sunset Grill & Bar', type: 'restaurant', cuisine: 'Uluslararası', location: 'İstanbul', reason: 'Boğaz manzaralı' },
          { name: 'Mikla', type: 'restaurant', cuisine: 'Modern Türk', location: 'İstanbul', reason: 'Modern gastronomi' }
        ]
      };

      selectedFallbacks = (fallbacks[type as keyof typeof fallbacks] || []);
    }
    console.log('Initial fallbacks count:', selectedFallbacks.length);
    
    // Kullanıcının mevcut içeriklerini kontrol et ve filtrele
    if (userId) {
      try {
        console.log('Filtering fallbacks for user:', userId);
        const userContent = await this.getUserContent(userId);
        console.log('User content loaded - movies:', userContent.allMovies.length, 'tvShows:', userContent.allTvShows.length, 'music:', userContent.allMusic.length, 'restaurants:', userContent.allRestaurants.length);
        
        selectedFallbacks = selectedFallbacks.filter((item: any) => {
          const title = (item as any).title || (item as any).name;
          console.log('Checking fallback item:', title, 'for type:', type);
          
          switch (type) {
            case 'MOVIE':
              const movieExists = userContent.allMovies.some(movie => 
                movie.title.toLowerCase() === title.toLowerCase()
              );
              console.log('Movie exists?', movieExists);
              return !movieExists;
            case 'TV_SHOW':
              const showExists = userContent.allTvShows.some(show => 
                show.title.toLowerCase() === title.toLowerCase()
              );
              console.log('Show exists?', showExists);
              return !showExists;
            case 'MUSIC':
              const musicExists = userContent.allMusic.some(music => 
                music.title.toLowerCase() === title.toLowerCase() ||
                ((item as any).artist && music.artist && music.artist.toLowerCase() === (item as any).artist.toLowerCase())
              );
              console.log('Music exists?', musicExists);
              return !musicExists;
            case 'RESTAURANT':
              const restaurantExists = userContent.allRestaurants.some(restaurant => 
                restaurant.name.toLowerCase() === title.toLowerCase()
              );
              console.log('Restaurant exists?', restaurantExists);
              return !restaurantExists;
            default:
              return true;
          }
        });
        console.log('After filtering - remaining fallbacks:', selectedFallbacks.length);
      } catch (error) {
        console.error('Error filtering fallback recommendations:', error);
        // Hata durumunda filtreleme yapmadan devam et
      }
    }
    
    selectedFallbacks = selectedFallbacks.slice(0, limit);
    
    // Film ve diziler için poster bilgisi ekle
    if ((type === 'MOVIE' || type === 'TV_SHOW') && this.tmdbApiKey) {
      const enrichedFallbacks = await Promise.all(
        selectedFallbacks.map(async (item: any, index: number) => {
          try {
            const title = item.title || item.name;
            const poster = await this.fetchTMDBPoster(title, type);
            
            // Confidence skoru hesapla
            const baseConfidence = 0.45; // Enriched fallback'ler biraz daha yüksek
            const positionPenalty = index * 0.03;
            const randomVariation = (Math.random() - 0.5) * 0.08;
            
            const finalConfidence = Math.max(
              Math.min(baseConfidence - positionPenalty + randomVariation, 0.65), 
              0.25
            );
            
            return {
              ...item,
              type: type,
              source: 'fallback',
              poster: poster,
              confidence: Math.round(finalConfidence * 100) / 100
            };
          } catch (error) {
            // Hata durumunda da confidence ekle
            const baseConfidence = 0.4;
            const positionPenalty = index * 0.03;
            const randomVariation = (Math.random() - 0.5) * 0.08;
            
            const finalConfidence = Math.max(
              Math.min(baseConfidence - positionPenalty + randomVariation, 0.6), 
              0.2
            );
            
            return {
              ...item,
              type: type,
              source: 'fallback',
              confidence: Math.round(finalConfidence * 100) / 100
            };
          }
        })
      );
      console.log('Final enriched fallbacks count:', enrichedFallbacks.length);
      return enrichedFallbacks;
    }

    return selectedFallbacks.map((item, index) => {
      // Fallback öneriler için daha düşük ama değişken confidence skorları
      const baseConfidence = 0.4; // Fallback'ler daha düşük güven
      const positionPenalty = index * 0.03;
      const randomVariation = (Math.random() - 0.5) * 0.08;
      
      const finalConfidence = Math.max(
        Math.min(baseConfidence - positionPenalty + randomVariation, 0.6), 
        0.2
      );
      
      return {
        ...item,
        type: type,
        source: 'fallback',
        confidence: Math.round(finalConfidence * 100) / 100
      };
    });
  }

  // TMDB API'den kullanıcının zevkine göre film önerileri çek
  private async fetchTMDBMovieRecommendations(limit: number, userContent?: any): Promise<any[]> {
    try {
      if (!this.tmdbApiKey) return [];

      let movieResults: any[] = [];

      // Kullanıcının film zevklerini analiz et
      if (userContent && userContent.allMovies && userContent.allMovies.length > 0) {
        console.log('Analyzing user movie preferences...');
        
        // Kullanıcının en sevdiği türleri bul
        const userGenres = this.extractGenres(userContent.allMovies.map((m: any) => m.genre).filter((g: any): g is string => Boolean(g)));
        console.log('User favorite genres:', userGenres.slice(0, 3));

        // TMDB genre mapping (Türkçe -> TMDB ID)
        const genreMapping: { [key: string]: number } = {
          'aksiyon': 28, 'action': 28,
          'macera': 12, 'adventure': 12,
          'animasyon': 16, 'animation': 16,
          'komedi': 35, 'comedy': 35,
          'suç': 80, 'crime': 80,
          'belgesel': 99, 'documentary': 99,
          'drama': 18,
          'aile': 10751, 'family': 10751,
          'fantastik': 14, 'fantasy': 14,
          'tarih': 36, 'history': 36,
          'korku': 27, 'horror': 27,
          'müzik': 10402, 'music': 10402,
          'gizem': 9648, 'mystery': 9648,
          'romantik': 10749, 'romance': 10749,
          'bilim kurgu': 878, 'sci-fi': 878, 'science fiction': 878,
          'gerilim': 53, 'thriller': 53,
          'savaş': 10752, 'war': 10752,
          'vahşi batı': 37, 'western': 37
        };

        // Kullanıcının favori türlerini TMDB ID'lerine çevir
        const tmdbGenreIds: number[] = [];
        userGenres.slice(0, 3).forEach(genre => {
          const lowerGenre = genre.toLowerCase();
          if (genreMapping[lowerGenre]) {
            tmdbGenreIds.push(genreMapping[lowerGenre]);
          }
        });

        console.log('TMDB Genre IDs:', tmdbGenreIds);

        // Her favori tür için öneriler al
        for (const genreId of tmdbGenreIds) {
          try {
            const genreResponse = await axios.get('https://api.themoviedb.org/3/discover/movie', {
              params: {
                language: 'tr-TR',
                sort_by: 'popularity.desc',
                with_genres: genreId,
                page: Math.floor(Math.random() * 3) + 1, // 1-3 arası rastgele sayfa
                'vote_average.gte': 6.0, // En az 6.0 puan
                'vote_count.gte': 100 // En az 100 oy
              },
              headers: {
                'Authorization': `Bearer ${this.tmdbApiKey}`,
                'Content-Type': 'application/json'
              }
            });

            if (genreResponse.data.results) {
              movieResults.push(...genreResponse.data.results.slice(0, 3)); // Her türden 3 film
            }
          } catch (error) {
            console.error(`Error fetching genre ${genreId}:`, error);
          }
        }
      }

      // Eğer kullanıcı verisi yoksa veya yeterli sonuç yoksa popüler filmleri ekle
      if (movieResults.length < limit) {
        console.log('Adding popular movies to fill recommendations...');
        const popularResponse = await axios.get('https://api.themoviedb.org/3/movie/popular', {
          params: {
            language: 'tr-TR',
            page: Math.floor(Math.random() * 3) + 1,
            'vote_average.gte': 7.0 // Yüksek puanlı filmler
          },
          headers: {
            'Authorization': `Bearer ${this.tmdbApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (popularResponse.data.results) {
          movieResults.push(...popularResponse.data.results);
        }
      }

      // Duplikatları kaldır ve sınırla
      const uniqueMovies = movieResults.filter((movie, index, arr) => 
        arr.findIndex(m => m.id === movie.id) === index
      ).slice(0, limit);

      return uniqueMovies.map((movie: any, index: number) => {
        const baseConfidence = userContent && userContent.allMovies && userContent.allMovies.length > 0 ? 0.85 : 0.75;
        const positionPenalty = index * 0.02;
        const randomVariation = (Math.random() - 0.5) * 0.05;
        
        const finalConfidence = Math.max(
          Math.min(baseConfidence - positionPenalty + randomVariation, 0.95), 
          0.65
        );

        // Genre isimlerini Türkçe'ye çevir
        const genreNames = this.mapTMDBGenresToTurkish(movie.genre_ids || []);

        return {
          title: movie.title,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear(),
          genre: genreNames.join(', ') || 'Drama',
          director: 'Bilinmiyor',
          reason: userContent && userContent.allMovies && userContent.allMovies.length > 0 
            ? `Zevklerinize uygun ${genreNames[0] || 'film'} - ${movie.vote_average}/10 puan`
            : `TMDB'de popüler - ${movie.vote_average}/10 puan`,
          poster: movie.poster_path,
          tmdbId: movie.id,
          confidence: Math.round(finalConfidence * 100) / 100,
          source: 'tmdb'
        };
      });

    } catch (error) {
      console.error('TMDB Movie API error:', error);
      return [];
    }
  }

  // TMDB genre ID'lerini Türkçe'ye çevir
  private mapTMDBGenresToTurkish(genreIds: number[]): string[] {
    const genreMap: { [key: number]: string } = {
      28: 'Aksiyon',
      12: 'Macera',
      16: 'Animasyon',
      35: 'Komedi',
      80: 'Suç',
      99: 'Belgesel',
      18: 'Drama',
      10751: 'Aile',
      14: 'Fantastik',
      36: 'Tarih',
      27: 'Korku',
      10402: 'Müzik',
      9648: 'Gizem',
      10749: 'Romantik',
      878: 'Bilim Kurgu',
      53: 'Gerilim',
      10752: 'Savaş',
      37: 'Vahşi Batı'
    };

    return genreIds.map(id => genreMap[id]).filter(Boolean);
  }

  // TMDB API'den kullanıcının zevkine göre dizi önerileri çek
  private async fetchTMDBTVRecommendations(limit: number, userContent?: any): Promise<any[]> {
    try {
      if (!this.tmdbApiKey) return [];

      let tvResults: any[] = [];

      // Kullanıcının dizi zevklerini analiz et
      if (userContent && userContent.allTvShows && userContent.allTvShows.length > 0) {
        console.log('Analyzing user TV show preferences...');
        
        const userGenres = this.extractGenres(userContent.allTvShows.map((t: any) => t.genre).filter((g: any): g is string => Boolean(g)));
        console.log('User favorite TV genres:', userGenres.slice(0, 3));

        // TV için genre mapping
        const tvGenreMapping: { [key: string]: number } = {
          'aksiyon': 10759, 'action': 10759,
          'macera': 10759, 'adventure': 10759,
          'animasyon': 16, 'animation': 16,
          'komedi': 35, 'comedy': 35,
          'suç': 80, 'crime': 80,
          'belgesel': 99, 'documentary': 99,
          'drama': 18,
          'aile': 10751, 'family': 10751,
          'çocuk': 10762, 'kids': 10762,
          'gizem': 9648, 'mystery': 9648,
          'haber': 10763, 'news': 10763,
          'reality': 10764,
          'bilim kurgu': 10765, 'sci-fi': 10765, 'fantastik': 10765,
          'pembe dizi': 10766, 'soap': 10766,
          'talk show': 10767,
          'savaş': 10768, 'war': 10768, 'politik': 10768
        };

        const tmdbGenreIds: number[] = [];
        userGenres.slice(0, 3).forEach(genre => {
          const lowerGenre = genre.toLowerCase();
          if (tvGenreMapping[lowerGenre]) {
            tmdbGenreIds.push(tvGenreMapping[lowerGenre]);
          }
        });

        console.log('TMDB TV Genre IDs:', tmdbGenreIds);

        // Her favori tür için dizi önerileri al
        for (const genreId of tmdbGenreIds) {
          try {
            const genreResponse = await axios.get('https://api.themoviedb.org/3/discover/tv', {
              params: {
                language: 'tr-TR',
                sort_by: 'popularity.desc',
                with_genres: genreId,
                page: Math.floor(Math.random() * 3) + 1,
                'vote_average.gte': 6.0,
                'vote_count.gte': 50
              },
              headers: {
                'Authorization': `Bearer ${this.tmdbApiKey}`,
                'Content-Type': 'application/json'
              }
            });

            if (genreResponse.data.results) {
              tvResults.push(...genreResponse.data.results.slice(0, 3));
            }
          } catch (error) {
            console.error(`Error fetching TV genre ${genreId}:`, error);
          }
        }
      }

      // Yeterli sonuç yoksa popüler dizileri ekle
      if (tvResults.length < limit) {
        console.log('Adding popular TV shows to fill recommendations...');
        const popularResponse = await axios.get('https://api.themoviedb.org/3/tv/popular', {
          params: {
            language: 'tr-TR',
            page: Math.floor(Math.random() * 3) + 1,
            'vote_average.gte': 7.0
          },
          headers: {
            'Authorization': `Bearer ${this.tmdbApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (popularResponse.data.results) {
          tvResults.push(...popularResponse.data.results);
        }
      }

      // Duplikatları kaldır ve sınırla
      const uniqueShows = tvResults.filter((show, index, arr) => 
        arr.findIndex(s => s.id === show.id) === index
      ).slice(0, limit);

      return uniqueShows.map((show: any, index: number) => {
        const baseConfidence = userContent && userContent.allTvShows && userContent.allTvShows.length > 0 ? 0.85 : 0.75;
        const positionPenalty = index * 0.02;
        const randomVariation = (Math.random() - 0.5) * 0.05;
        
        const finalConfidence = Math.max(
          Math.min(baseConfidence - positionPenalty + randomVariation, 0.95), 
          0.65
        );

        const genreNames = this.mapTMDBTVGenresToTurkish(show.genre_ids || []);

        return {
          title: show.name,
          year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear(),
          genre: genreNames.join(', ') || 'Drama',
          seasons: show.number_of_seasons || 1,
          reason: userContent && userContent.allTvShows && userContent.allTvShows.length > 0
            ? `Zevklerinize uygun ${genreNames[0] || 'dizi'} - ${show.vote_average}/10 puan`
            : `TMDB'de popüler - ${show.vote_average}/10 puan`,
          poster: show.poster_path,
          tmdbId: show.id,
          confidence: Math.round(finalConfidence * 100) / 100,
          source: 'tmdb'
        };
      });

    } catch (error) {
      console.error('TMDB TV API error:', error);
      return [];
    }
  }

  // TMDB TV genre ID'lerini Türkçe'ye çevir
  private mapTMDBTVGenresToTurkish(genreIds: number[]): string[] {
    const tvGenreMap: { [key: number]: string } = {
      10759: 'Aksiyon & Macera',
      16: 'Animasyon',
      35: 'Komedi',
      80: 'Suç',
      99: 'Belgesel',
      18: 'Drama',
      10751: 'Aile',
      10762: 'Çocuk',
      9648: 'Gizem',
      10763: 'Haber',
      10764: 'Reality',
      10765: 'Bilim Kurgu & Fantastik',
      10766: 'Pembe Dizi',
      10767: 'Talk Show',
      10768: 'Savaş & Politika'
    };

    return genreIds.map(id => tvGenreMap[id]).filter(Boolean);
  }
  private async fetchiTunesRecommendations(limit: number): Promise<any[]> {
    try {
      // Türkiye'de popüler şarkıları almak için genel terimler kullan
      const popularTerms = ['pop', 'türkçe pop', 'rock', 'alternative', 'indie'];
      const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];

      const response = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: randomTerm,
          media: 'music',
          entity: 'song',
          limit: limit * 2,
          country: 'TR',
          sort: 'popular'
        },
        timeout: 5000
      });

      const results = response.data.results;
      
      return results.slice(0, limit).map((track: any, index: number) => {
        // iTunes API'den gelen öneriler için yüksek confidence
        const baseConfidence = 0.75; // iTunes gerçek veri olduğu için yüksek
        const positionPenalty = index * 0.02;
        const randomVariation = (Math.random() - 0.5) * 0.05;
        
        const finalConfidence = Math.max(
          Math.min(baseConfidence - positionPenalty + randomVariation, 0.9), 
          0.5
        );
        
        return {
          title: track.trackName,
          artist: track.artistName,
          album: track.collectionName,
          genre: track.primaryGenreName || 'Pop',
          year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : new Date().getFullYear(),
          reason: `iTunes'da popüler - ${track.primaryGenreName} kategorisinde`,
          image: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '300x300') : null,
          itunesId: track.trackId,
          preview_url: track.previewUrl,
          itunes_url: track.trackViewUrl,
          confidence: Math.round(finalConfidence * 100) / 100,
          source: 'itunes'
        };
      });
    } catch (error) {
      console.error('iTunes API error:', error);
      return [];
    }
  }

  // Last.fm'den popüler müzik önerileri çek (fallback)
  private async fetchLastFmRecommendations(limit: number): Promise<any[]> {
    try {
      if (!process.env.LASTFM_API_KEY) return [];

      const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'chart.gettoptracks',
          api_key: process.env.LASTFM_API_KEY,
          format: 'json',
          limit: limit * 2 // Daha fazla al, filtreleyeceğiz
        }
      });

      if (response.data.tracks && response.data.tracks.track) {
        return response.data.tracks.track.slice(0, limit).map((track: any, index: number) => {
          // Last.fm önerileri için orta seviye confidence
          const baseConfidence = 0.6;
          const positionPenalty = index * 0.03;
          const randomVariation = (Math.random() - 0.5) * 0.06;
          
          const finalConfidence = Math.max(
            Math.min(baseConfidence - positionPenalty + randomVariation, 0.75), 
            0.35
          );
          
          return {
            title: track.name,
            artist: track.artist.name,
            album: track.album ? track.album.name : 'Single',
            genre: 'Pop', // Last.fm'de genre bilgisi sınırlı
            year: new Date().getFullYear(),
            reason: `${track.playcount} dinlenme ile popüler`,
            confidence: Math.round(finalConfidence * 100) / 100,
            source: 'lastfm'
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }

  // Google Places'den popüler mekan önerileri çek
  private async fetchGooglePlacesRecommendations(limit: number, city: string = 'İstanbul'): Promise<any[]> {
    try {
      if (!process.env.GOOGLE_PLACES_API_KEY) return [];

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `best restaurants in ${city}`,
          key: process.env.GOOGLE_PLACES_API_KEY,
          type: 'restaurant',
          language: 'tr'
        }
      });

      if (response.data.results) {
        return response.data.results.slice(0, limit).map((place: any, index: number) => {
          // Google Places önerileri için yüksek confidence (gerçek veri)
          const baseConfidence = 0.8;
          const positionPenalty = index * 0.02;
          const randomVariation = (Math.random() - 0.5) * 0.04;
          
          const finalConfidence = Math.max(
            Math.min(baseConfidence - positionPenalty + randomVariation, 0.9), 
            0.6
          );
          
          return {
            name: place.name,
            type: 'restaurant',
            cuisine: place.types.includes('restaurant') ? 'Uluslararası' : 'Cafe',
            location: city,
            address: place.formatted_address,
            rating: place.rating || 4.0,
            reason: `${place.rating}/5 puan ile popüler`,
            confidence: Math.round(finalConfidence * 100) / 100,
            source: 'google_places'
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Google Places API error:', error);
      return [];
    }
  }
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
            type: type, // Type alanını ekle
            fromUser: user,
            confidence: similarity * 0.8,
            isAiGenerated: false,
            reason: `${user.name || user.username} tarafından öneriliyor (${Math.round(similarity * 100)}% benzerlik)`,
            source: 'collaborative'
          });
        });
      }

      // Kullanıcının mevcut içeriklerini al (filtreleme için)
      const userContent = await this.getUserContent(userId);

      // Önerileri filtrele - kullanıcının zaten eklediği içerikleri çıkar
      const filteredRecommendations = recommendations.filter(rec => {
        const title = rec.title || rec.name;
        
        switch (type) {
          case 'MOVIE':
            return !userContent.allMovies.some(movie => 
              movie.title.toLowerCase() === title.toLowerCase()
            );
          case 'TV_SHOW':
            return !userContent.allTvShows.some(show => 
              show.title.toLowerCase() === title.toLowerCase()
            );
          case 'MUSIC':
            return !userContent.allMusic.some(music => 
              music.title.toLowerCase() === title.toLowerCase() ||
              (rec.artist && music.artist && music.artist.toLowerCase() === rec.artist.toLowerCase())
            );
          case 'RESTAURANT':
            return !userContent.allRestaurants.some(restaurant => 
              restaurant.name.toLowerCase() === title.toLowerCase()
            );
          default:
            return true;
        }
      });

      return filteredRecommendations
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
      return this.getFallbackRecommendations(type, limit, userId);
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();