import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Film ekle
router.post('/movies', authMiddleware, async (req, res) => {
  try {
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

    res.status(201).json(movie);
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(500).json({ error: 'Film eklenirken hata oluştu' });
  }
});

// Dizi ekle
router.post('/tv-shows', authMiddleware, async (req, res) => {
  try {
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

    res.status(201).json(tvShow);
  } catch (error) {
    console.error('Add TV show error:', error);
    res.status(500).json({ error: 'Dizi eklenirken hata oluştu' });
  }
});

// Müzik ekle
router.post('/music', authMiddleware, async (req, res) => {
  try {
    const { title, artist, album, genre, year, rating, review, spotifyId } = req.body;
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
        spotifyId,
      },
    });

    res.status(201).json(music);
  } catch (error) {
    console.error('Add music error:', error);
    res.status(500).json({ error: 'Müzik eklenirken hata oluştu' });
  }
});

// Restoran ekle
router.post('/restaurants', authMiddleware, async (req, res) => {
  try {
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