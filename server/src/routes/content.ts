import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { recommendationService } from '../services/recommendationService';

const router = express.Router();
const prisma = new PrismaClient();

// Film ekle
router.post('/movies', authMiddleware, async (req, res) => {
  try {
    console.log('POST /movies - Request body:', req.body);
    console.log('POST /movies - User ID:', req.user.userId);
    
    const { title, year, genre, director, rating, review, tmdbId, poster } = req.body;
    const userId = req.user.userId;

    const movie = await prisma.movie.create({
      data: {
        userId,
        title,
        year: year ? parseInt(year) : null,
        genre: Array.isArray(genre) ? genre.join(',') : genre,
        director,
        rating: rating ? parseFloat(rating) : null,
        review,
        tmdbId: tmdbId ? parseInt(tmdbId) : null,
        poster,
        watchedAt: new Date(),
      },
    });

    // Zevk profilini güncelle
    try {
      await recommendationService.analyzeUserTaste(userId);
    } catch (error) {
      console.error('Taste profile update error:', error);
      // Hata olsa bile film ekleme başarılı sayılsın
    }

    console.log('POST /movies - Created movie:', movie);
    res.status(201).json(movie);
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(500).json({ error: 'Film eklenirken hata oluştu' });
  }
});

// Dizi ekle
router.post('/tv-shows', authMiddleware, async (req, res) => {
  try {
    console.log('POST /tv-shows - Request body:', req.body);
    console.log('POST /tv-shows - User ID:', req.user.userId);
    
    const { title, year, genre, seasons, rating, review, status, tmdbId, poster } = req.body;
    const userId = req.user.userId;

    const tvShow = await prisma.tvShow.create({
      data: {
        userId,
        title,
        year: year ? parseInt(year) : null,
        genre: Array.isArray(genre) ? genre.join(',') : genre,
        seasons: seasons ? parseInt(seasons) : null,
        rating: rating ? parseFloat(rating) : null,
        review,
        status: status || 'completed',
        tmdbId: tmdbId ? parseInt(tmdbId) : null,
        poster,
      },
    });

    // Zevk profilini güncelle
    try {
      await recommendationService.analyzeUserTaste(userId);
    } catch (error) {
      console.error('Taste profile update error:', error);
      // Hata olsa bile dizi ekleme başarılı sayılsın
    }

    console.log('POST /tv-shows - Created TV show:', tvShow);
    res.status(201).json(tvShow);
  } catch (error) {
    console.error('Add TV show error:', error);
    res.status(500).json({ error: 'Dizi eklenirken hata oluştu' });
  }
});

// Müzik ekle
router.post('/music', authMiddleware, async (req, res) => {
  try {
    console.log('POST /music - Request body:', req.body);
    console.log('POST /music - User ID:', req.user.userId);
    
    const { title, artist, album, genre, year, rating, review, itunesId } = req.body;
    const userId = req.user.userId;

    const music = await prisma.music.create({
      data: {
        userId,
        title,
        artist,
        album,
        genre: Array.isArray(genre) ? genre.join(',') : genre,
        year: year ? parseInt(year) : null,
        rating: rating ? parseFloat(rating) : null,
        review,
        itunesId: itunesId ? String(itunesId) : null,
      },
    });

    // Zevk profilini güncelle
    try {
      await recommendationService.analyzeUserTaste(userId);
    } catch (error) {
      console.error('Taste profile update error:', error);
      // Hata olsa bile müzik ekleme başarılı sayılsın
    }

    console.log('POST /music - Created music:', music);
    res.status(201).json(music);
  } catch (error) {
    console.error('Add music error:', error);
    res.status(500).json({ error: 'Müzik eklenirken hata oluştu' });
  }
});

// Restoran ekle
router.post('/restaurants', authMiddleware, async (req, res) => {
  try {
    console.log('POST /restaurants - Request body:', req.body);
    console.log('POST /restaurants - User ID:', req.user.userId);
    
    const { name, type, cuisine, location, address, rating, review, priceRange, visitedAt } = req.body;
    const userId = req.user.userId;

    const restaurant = await prisma.restaurant.create({
      data: {
        userId,
        name,
        type: type || 'restaurant',
        cuisine,
        location,
        address,
        rating: rating ? parseFloat(rating) : null,
        review,
        priceRange,
        visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
      },
    });

    // Zevk profilini güncelle
    try {
      await recommendationService.analyzeUserTaste(userId);
    } catch (error) {
      console.error('Taste profile update error:', error);
      // Hata olsa bile restoran ekleme başarılı sayılsın
    }

    console.log('POST /restaurants - Created restaurant:', restaurant);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Add restaurant error:', error);
    res.status(500).json({ error: 'Restoran eklenirken hata oluştu' });
  }
});

// Kullanıcının içeriklerini getir
router.get('/my-content', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [movies, tvShows, music, restaurants] = await Promise.all([
      prisma.movie.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.tvShow.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.music.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.restaurant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ movies, tvShows, music, restaurants });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'İçerik getirilirken hata oluştu' });
  }
});

// İstatistikleri getir
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [movieCount, tvShowCount, musicCount, restaurantCount] = await Promise.all([
      prisma.movie.count({ where: { userId } }),
      prisma.tvShow.count({ where: { userId } }),
      prisma.music.count({ where: { userId } }),
      prisma.restaurant.count({ where: { userId } }),
    ]);

    res.json({
      movies: movieCount,
      tvShows: tvShowCount,
      music: musicCount,
      restaurants: restaurantCount,
      total: movieCount + tvShowCount + musicCount + restaurantCount,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu' });
  }
});

// Kullanıcının içeriklerini getir (arkadaşlar için)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.userId;

    // Kullanıcının gizlilik ayarlarını kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPrivate: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Eğer profil gizliyse ve takip etmiyorsa erişim engelle
    if (targetUser.isPrivate && requesterId !== userId) {
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: userId
          }
        }
      });

      if (!isFollowing) {
        return res.status(403).json({ error: 'Bu profil gizli' });
      }
    }

    const [movies, tvShows, music, restaurants] = await Promise.all([
      prisma.movie.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.tvShow.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.music.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.restaurant.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({ movies, tvShows, music, restaurants });
  } catch (error) {
    console.error('Get user content error:', error);
    res.status(500).json({ error: 'İçerik getirilirken hata oluştu' });
  }
});

// İçerik beğen
router.post('/:type/:id/like', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.userId;

    const likeData: any = { userId };
    
    switch (type) {
      case 'movies':
        likeData.movieId = id;
        break;
      case 'tv-shows':
        likeData.tvShowId = id;
        break;
      case 'music':
        likeData.musicId = id;
        break;
      case 'restaurants':
        likeData.restaurantId = id;
        break;
      default:
        return res.status(400).json({ error: 'Geçersiz içerik türü' });
    }

    const like = await prisma.like.create({
      data: likeData,
    });

    res.status(201).json(like);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu içeriği zaten beğendiniz' });
    }
    console.error('Like error:', error);
    res.status(500).json({ error: 'Beğeni eklenirken hata oluştu' });
  }
});

export default router;