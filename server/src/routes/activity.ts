import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Benzer kullanıcıların son aktivitelerini getir
router.get('/similar-users-activity', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const days = parseInt(req.query.days as string) || 7; // Son 7 gün

    // Kullanıcının zevk profilini al
    const userProfile = await prisma.tasteProfile.findUnique({
      where: { userId }
    });

    if (!userProfile || !userProfile.tasteVector) {
      return res.json({ activities: [], similarUsers: [] });
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
      similarity: calculateCosineSimilarity(
        userVector,
        JSON.parse(profile.tasteVector!)
      )
    }));

    // En benzer 10 kullanıcıyı al (benzerlik > 0.5)
    const topSimilarUsers = similarities
      .filter(s => s.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    if (topSimilarUsers.length === 0) {
      return res.json({ activities: [], similarUsers: [] });
    }

    const similarUserIds = topSimilarUsers.map(u => u.user.id);
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Son aktiviteleri getir
    const [recentMovies, recentTVShows, recentMusic, recentRestaurants] = await Promise.all([
      prisma.movie.findMany({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: dateThreshold }
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
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.tvShow.findMany({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: dateThreshold }
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
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.music.findMany({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: dateThreshold }
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
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.restaurant.findMany({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: dateThreshold }
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
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    // Aktiviteleri birleştir ve benzerlik skoruyla zenginleştir
    const activities = [
      ...recentMovies.map(m => ({
        ...m,
        type: 'MOVIE',
        contentType: 'film',
        similarity: topSimilarUsers.find(u => u.user.id === m.userId)?.similarity || 0
      })),
      ...recentTVShows.map(t => ({
        ...t,
        type: 'TV_SHOW',
        contentType: 'dizi',
        similarity: topSimilarUsers.find(u => u.user.id === t.userId)?.similarity || 0
      })),
      ...recentMusic.map(m => ({
        ...m,
        type: 'MUSIC',
        contentType: 'müzik',
        similarity: topSimilarUsers.find(u => u.user.id === m.userId)?.similarity || 0
      })),
      ...recentRestaurants.map(r => ({
        ...r,
        type: 'RESTAURANT',
        contentType: 'mekan',
        similarity: topSimilarUsers.find(u => u.user.id === r.userId)?.similarity || 0
      }))
    ];

    // Tarihe göre sırala
    activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      activities: activities.slice(0, 50),
      similarUsers: topSimilarUsers.map(u => ({
        ...u.user,
        similarity: Math.round(u.similarity * 100)
      }))
    });

  } catch (error) {
    console.error('Error fetching similar users activity:', error);
    res.status(500).json({ error: 'Aktiviteler alınırken hata oluştu' });
  }
});

// Haftalık özet - bildirim için
router.get('/weekly-summary', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    // Kullanıcının zevk profilini al
    const userProfile = await prisma.tasteProfile.findUnique({
      where: { userId }
    });

    if (!userProfile || !userProfile.tasteVector) {
      return res.json({ summary: null });
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
            name: true
          }
        }
      }
    });

    const userVector = JSON.parse(userProfile.tasteVector);
    const similarities = allProfiles.map(profile => ({
      user: profile.user,
      similarity: calculateCosineSimilarity(
        userVector,
        JSON.parse(profile.tasteVector!)
      )
    }));

    // En benzer 3 kullanıcıyı al
    const topSimilarUsers = similarities
      .filter(s => s.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    if (topSimilarUsers.length === 0) {
      return res.json({ summary: null });
    }

    const similarUserIds = topSimilarUsers.map(u => u.user.id);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Bu hafta eklenen içerikleri say
    const [movieCount, tvShowCount, musicCount, restaurantCount] = await Promise.all([
      prisma.movie.count({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        }
      }),
      prisma.tvShow.count({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        }
      }),
      prisma.music.count({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        }
      }),
      prisma.restaurant.count({
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        }
      })
    ]);

    // En popüler içeriği bul (en çok eklenen)
    const allContent = await Promise.all([
      prisma.movie.groupBy({
        by: ['title'],
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        },
        _count: { title: true },
        orderBy: { _count: { title: 'desc' } },
        take: 1
      }),
      prisma.tvShow.groupBy({
        by: ['title'],
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        },
        _count: { title: true },
        orderBy: { _count: { title: 'desc' } },
        take: 1
      }),
      prisma.music.groupBy({
        by: ['title', 'artist'],
        where: {
          userId: { in: similarUserIds },
          createdAt: { gte: weekAgo }
        },
        _count: { title: true },
        orderBy: { _count: { title: 'desc' } },
        take: 1
      })
    ]);

    let mostPopular = null;
    let maxCount = 0;

    if (allContent[0][0] && allContent[0][0]._count.title > maxCount) {
      mostPopular = { type: 'film', title: allContent[0][0].title, count: allContent[0][0]._count.title };
      maxCount = allContent[0][0]._count.title;
    }
    if (allContent[1][0] && allContent[1][0]._count.title > maxCount) {
      mostPopular = { type: 'dizi', title: allContent[1][0].title, count: allContent[1][0]._count.title };
      maxCount = allContent[1][0]._count.title;
    }
    if (allContent[2][0] && allContent[2][0]._count.title > maxCount) {
      mostPopular = { 
        type: 'müzik', 
        title: `${allContent[2][0].artist} - ${allContent[2][0].title}`, 
        count: allContent[2][0]._count.title 
      };
    }

    res.json({
      summary: {
        similarUserCount: topSimilarUsers.length,
        totalActivities: movieCount + tvShowCount + musicCount + restaurantCount,
        movieCount,
        tvShowCount,
        musicCount,
        restaurantCount,
        mostPopular,
        topUsers: topSimilarUsers.map(u => u.user.name || u.user.username)
      }
    });

  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ error: 'Özet alınırken hata oluştu' });
  }
});

// Cosine similarity hesaplama
function calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
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

export default router;
