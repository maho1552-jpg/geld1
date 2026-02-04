import { PrismaClient } from '@prisma/client';
import { aiRecommendationService } from './aiRecommendationService';

const prisma = new PrismaClient();

export class RecommendationService {
  // Kullanıcının zevk profilini analiz et
  async analyzeUserTaste(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        movies: true,
        tvShows: true,
        music: true,
        restaurants: true,
      },
    });

    if (!user) throw new Error('User not found');

    // Film türlerini analiz et (comma separated string'den array'e çevir)
    const movieGenres = this.analyzeGenres(
      user.movies.flatMap(m => m.genre ? m.genre.split(',').map(g => g.trim()) : [])
    );
    const musicGenres = this.analyzeGenres(
      user.music.flatMap(m => m.genre ? m.genre.split(',').map(g => g.trim()) : [])
    );
    const cuisineTypes = this.analyzeCuisines(
      user.restaurants.map(r => r.cuisine).filter(Boolean) as string[]
    );

    // Kişilik etiketleri belirle
    const personalityTags = this.generatePersonalityTags({
      movieGenres,
      musicGenres,
      cuisineTypes,
      totalItems: user.movies.length + user.tvShows.length + user.music.length + user.restaurants.length
    });

    // Zevk vektörü oluştur
    const tasteVector = this.createTasteVector(movieGenres, musicGenres, cuisineTypes);

    // Profili kaydet veya güncelle (JSON string olarak)
    await prisma.tasteProfile.upsert({
      where: { userId },
      update: {
        movieGenres: JSON.stringify(movieGenres),
        musicGenres: JSON.stringify(musicGenres),
        cuisineTypes: JSON.stringify(cuisineTypes),
        personalityTags: personalityTags.join(','),
        tasteVector: JSON.stringify(tasteVector),
        lastAnalyzed: new Date(),
      },
      create: {
        userId,
        movieGenres: JSON.stringify(movieGenres),
        musicGenres: JSON.stringify(musicGenres),
        cuisineTypes: JSON.stringify(cuisineTypes),
        personalityTags: personalityTags.join(','),
        tasteVector: JSON.stringify(tasteVector),
      },
    });

    return { movieGenres, musicGenres, cuisineTypes, personalityTags };
  }

  // Benzer kullanıcıları bul
  async findSimilarUsers(userId: string, limit = 10) {
    const userProfile = await prisma.tasteProfile.findUnique({
      where: { userId },
    });

    if (!userProfile || !userProfile.tasteVector) {
      throw new Error('User taste profile not found');
    }

    // Basit benzerlik hesaplama
    const allProfiles = await prisma.tasteProfile.findMany({
      where: {
        userId: { not: userId },
        tasteVector: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const userVector = JSON.parse(userProfile.tasteVector);
    const similarities = allProfiles.map(profile => ({
      user: profile.user,
      similarity: this.calculateSimilarity(
        userVector,
        JSON.parse(profile.tasteVector!)
      ),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // AI tabanlı tavsiyeler oluştur (Yeni gelişmiş versiyon)
  async generateAIRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    try {
      // Önce kullanıcının zevk profilini analiz et
      await this.analyzeUserTaste(userId);
      
      // Hibrit öneriler al (AI + Collaborative)
      const recommendations = await aiRecommendationService.getHybridRecommendations(userId, type, 10);
      
      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Fallback olarak eski sistemi kullan
      return this.generateLegacyRecommendations(userId, type);
    }
  }

  // Eski sistem (fallback)
  private async generateLegacyRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    try {
      const similarUsers = await this.findSimilarUsers(userId, 5);
      const recommendations = [];

      for (const { user, similarity } of similarUsers) {
        let items: any[] = [];
        
        switch (type) {
          case 'MOVIE':
            items = await prisma.movie.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 3,
            });
            break;
          case 'TV_SHOW':
            items = await prisma.tvShow.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 3,
            });
            break;
          case 'MUSIC':
            items = await prisma.music.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 3,
            });
            break;
          case 'RESTAURANT':
            items = await prisma.restaurant.findMany({
              where: { userId: user.id },
              orderBy: { rating: 'desc' },
              take: 3,
            });
            break;
        }

        for (const item of items) {
          recommendations.push({
            item,
            fromUser: user,
            confidence: similarity * 0.8, // Benzerlik skoruna dayalı güven
            type,
          });
        }
      }

      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
    } catch (error) {
      console.error('Error generating legacy recommendations:', error);
      return [];
    }
  }

  // Sadece AI önerileri al
  async getAIOnlyRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    try {
      await this.analyzeUserTaste(userId);
      return await aiRecommendationService.generatePersonalizedRecommendations(userId, type, 8);
    } catch (error) {
      console.error('Error generating AI-only recommendations:', error);
      // Fallback öneriler döndür
      return await aiRecommendationService.getFallbackRecommendations(type, 8, userId);
    }
  }

  // Sadece collaborative filtering önerileri
  async getCollaborativeOnlyRecommendations(userId: string, type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    try {
      await this.analyzeUserTaste(userId);
      return await aiRecommendationService.getCollaborativeRecommendations(userId, type, 8);
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error);
      return [];
    }
  }

  private analyzeGenres(genres: string[]): Record<string, number> {
    const genreCount: Record<string, number> = {};
    const total = genres.length;

    if (total === 0) return {};

    genres.forEach(genre => {
      if (genre && genre.trim()) {
        genreCount[genre.trim()] = (genreCount[genre.trim()] || 0) + 1;
      }
    });

    // Yüzdelik oranları hesapla
    Object.keys(genreCount).forEach(genre => {
      genreCount[genre] = genreCount[genre] / total;
    });

    return genreCount;
  }

  private analyzeCuisines(cuisines: string[]): Record<string, number> {
    return this.analyzeGenres(cuisines);
  }

  private generatePersonalityTags(data: any): string[] {
    const tags: string[] = [];

    // Film türlerine göre
    if (data.movieGenres.Action > 0.3) tags.push('action-lover');
    if (data.movieGenres.Drama > 0.4) tags.push('drama-enthusiast');
    if (data.movieGenres.Comedy > 0.3) tags.push('comedy-fan');
    if (data.movieGenres.Horror > 0.2) tags.push('thrill-seeker');

    // Müzik türlerine göre
    if (data.musicGenres.Rock > 0.3) tags.push('rock-head');
    if (data.musicGenres.Classical > 0.2) tags.push('sophisticated');
    if (data.musicGenres.Electronic > 0.3) tags.push('tech-savvy');

    // Mutfak türlerine göre
    if (data.cuisineTypes.Italian > 0.3) tags.push('italian-food-lover');
    if (data.cuisineTypes.Asian > 0.3) tags.push('asian-cuisine-fan');
    if (data.cuisineTypes.Mexican > 0.2) tags.push('spice-lover');

    // Aktivite seviyesine göre
    if (data.totalItems > 100) tags.push('very-active');
    else if (data.totalItems > 50) tags.push('active');
    else tags.push('casual');

    return tags;
  }

  private createTasteVector(movieGenres: any, musicGenres: any, cuisineTypes: any): number[] {
    // Basit vektör temsili (gerçek uygulamada daha sofistike olabilir)
    const vector: number[] = [];
    
    // Film türleri için 10 boyut
    const movieGenreKeys = ['Action', 'Drama', 'Comedy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Documentary'];
    movieGenreKeys.forEach(genre => {
      vector.push(movieGenres[genre] || 0);
    });

    // Müzik türleri için 10 boyut
    const musicGenreKeys = ['Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Classical', 'Jazz', 'Country', 'R&B', 'Folk', 'Alternative'];
    musicGenreKeys.forEach(genre => {
      vector.push(musicGenres[genre] || 0);
    });

    // Mutfak türleri için 10 boyut
    const cuisineKeys = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Japanese', 'Thai', 'Chinese'];
    cuisineKeys.forEach(cuisine => {
      vector.push(cuisineTypes[cuisine] || 0);
    });

    return vector;
  }

  private calculateSimilarity(vector1: number[], vector2: number[]): number {
    // Cosine similarity hesaplama
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

export const recommendationService = new RecommendationService();