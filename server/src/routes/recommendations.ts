import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { recommendationService } from '../services/recommendationService';

const router = express.Router();
const prisma = new PrismaClient();

// Zevk profilini analiz et
router.post('/analyze-taste', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const analysis = await recommendationService.analyzeUserTaste(userId);
    res.json(analysis);
  } catch (error) {
    console.error('Analyze taste error:', error);
    res.status(500).json({ error: 'Zevk profili analiz edilirken hata oluştu' });
  }
});

// Benzer kullanıcıları bul
router.get('/similar-users', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const similarUsers = await recommendationService.findSimilarUsers(userId, limit);
    res.json(similarUsers);
  } catch (error) {
    console.error('Similar users error:', error);
    res.status(500).json({ error: 'Benzer kullanıcılar bulunurken hata oluştu' });
  }
});

// AI tavsiyeleri al (Hibrit: AI + Collaborative)
router.get('/ai-suggestions/:type', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;
    
    if (!['MOVIE', 'TV_SHOW', 'MUSIC', 'RESTAURANT'].includes(type)) {
      return res.status(400).json({ error: 'Geçersiz tavsiye türü' });
    }

    const recommendations = await recommendationService.generateAIRecommendations(
      userId, 
      type as 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT'
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'AI tavsiyeleri alınırken hata oluştu' });
  }
});

// Sadece AI önerileri
router.get('/ai-only/:type', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;
    
    if (!['MOVIE', 'TV_SHOW', 'MUSIC', 'RESTAURANT'].includes(type)) {
      return res.status(400).json({ error: 'Geçersiz tavsiye türü' });
    }

    const recommendations = await recommendationService.getAIOnlyRecommendations(
      userId, 
      type as 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT'
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('AI-only suggestions error:', error);
    res.status(500).json({ error: 'AI tavsiyeleri alınırken hata oluştu' });
  }
});

// Sadece collaborative filtering önerileri
router.get('/collaborative/:type', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;
    
    if (!['MOVIE', 'TV_SHOW', 'MUSIC', 'RESTAURANT'].includes(type)) {
      return res.status(400).json({ error: 'Geçersiz tavsiye türü' });
    }

    const recommendations = await recommendationService.getCollaborativeOnlyRecommendations(
      userId, 
      type as 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT'
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Collaborative suggestions error:', error);
    res.status(500).json({ error: 'Collaborative tavsiyeleri alınırken hata oluştu' });
  }
});

// Kullanıcıdan kullanıcıya tavsiye gönder
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.userId;
    const { toUserId, type, message, contentId } = req.body;

    const recommendationData: any = {
      fromUserId,
      toUserId,
      type,
      message,
      isAiGenerated: false,
    };

    // İçerik türüne göre ID'yi ayarla
    switch (type) {
      case 'MOVIE':
        recommendationData.movieId = contentId;
        break;
      case 'TV_SHOW':
        recommendationData.tvShowId = contentId;
        break;
      case 'MUSIC':
        recommendationData.musicId = contentId;
        break;
      case 'RESTAURANT':
        recommendationData.restaurantId = contentId;
        break;
      default:
        return res.status(400).json({ error: 'Geçersiz tavsiye türü' });
    }

    const recommendation = await prisma.recommendation.create({
      data: recommendationData,
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        movie: true,
        tvShow: true,
        music: true,
        restaurant: true,
      }
    });

    res.status(201).json(recommendation);
  } catch (error) {
    console.error('Send recommendation error:', error);
    res.status(500).json({ error: 'Tavsiye gönderilirken hata oluştu' });
  }
});

// Gelen tavsiyeleri getir
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const recommendations = await prisma.recommendation.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        movie: true,
        tvShow: true,
        music: true,
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Get received recommendations error:', error);
    res.status(500).json({ error: 'Tavsiyeler getirilirken hata oluştu' });
  }
});

// Gönderilen tavsiyeleri getir
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const recommendations = await prisma.recommendation.findMany({
      where: { fromUserId: userId },
      include: {
        toUser: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          }
        },
        movie: true,
        tvShow: true,
        music: true,
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Get sent recommendations error:', error);
    res.status(500).json({ error: 'Gönderilen tavsiyeler getirilirken hata oluştu' });
  }
});

export default router;