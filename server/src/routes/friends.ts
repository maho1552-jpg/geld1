import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Kullanıcı arama
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user?.userId;

    console.log('Search request:', { query, currentUserId, user: req.user });

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Arama sorgusu gerekli' });
    }

    if (query.length < 2) {
      return res.json([]);
    }

    // Kullanıcıları username, name veya email ile ara
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId // Kendi kendini arama
            }
          },
          {
            OR: [
              {
                username: {
                  contains: query
                }
              },
              {
                name: {
                  contains: query
                }
              },
              {
                email: {
                  contains: query
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        city: true,
        isPrivate: true
      },
      take: 20
    });

    // Her kullanıcı için takip durumunu ve sayıları kontrol et
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const [isFollowing, isFollower, followersCount, followingCount, contentCounts] = await Promise.all([
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId!,
                followingId: user.id
              }
            }
          }),
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: currentUserId!
              }
            }
          }),
          prisma.follow.count({
            where: { followingId: user.id }
          }),
          prisma.follow.count({
            where: { followerId: user.id }
          }),
          Promise.all([
            prisma.movie.count({ where: { userId: user.id } }),
            prisma.tvShow.count({ where: { userId: user.id } }),
            prisma.music.count({ where: { userId: user.id } }),
            prisma.restaurant.count({ where: { userId: user.id } })
          ])
        ]);

        return {
          ...user,
          isFollowing: !!isFollowing,
          isFollower: !!isFollower,
          followersCount,
          followingCount,
          contentCount: contentCounts.reduce((sum, count) => sum + count, 0)
        };
      })
    );

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcıyı takip et
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    console.log('Follow request:', { userId, currentUserId, user: req.user });

    if (!currentUserId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
    }

    // Kullanıcının var olup olmadığını kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Zaten takip edip etmediğini kontrol et
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId!,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Bu kullanıcıyı zaten takip ediyorsunuz' });
    }

    // Takip et
    await prisma.follow.create({
      data: {
        followerId: currentUserId!,
        followingId: userId
      }
    });

    res.json({ message: 'Kullanıcı başarıyla takip edildi' });
  } catch (error) {
    console.error('Takip etme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcıyı takipten çıkar
router.delete('/unfollow/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    // Takip ilişkisini sil
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId!,
        followingId: userId
      }
    });

    if (deletedFollow.count === 0) {
      return res.status(400).json({ error: 'Bu kullanıcıyı takip etmiyorsunuz' });
    }

    res.json({ message: 'Kullanıcı takipten çıkarıldı' });
  } catch (error) {
    console.error('Takipten çıkarma hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Takip edilenler listesi
router.get('/following', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const following = await prisma.follow.findMany({
      where: {
        followerId: currentUserId
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            city: true,
            isPrivate: true
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Her kullanıcı için sayıları hesapla
    const result = await Promise.all(
      following.map(async (f) => {
        const [followersCount, followingCount] = await Promise.all([
          prisma.follow.count({ where: { followingId: f.following.id } }),
          prisma.follow.count({ where: { followerId: f.following.id } })
        ]);

        return {
          ...f.following,
          followersCount,
          followingCount,
          followedAt: f.createdAt,
          isFollowing: true, // Bu kişiyi zaten takip ediyoruz
          contentCount: 0 // Placeholder, gerekirse hesaplanabilir
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Takip edilenler listesi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Takipçiler listesi
router.get('/followers', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const followers = await prisma.follow.findMany({
      where: {
        followingId: currentUserId
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            city: true,
            isPrivate: true
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Her takipçi için karşılıklı takip durumunu kontrol et
    const result = await Promise.all(
      followers.map(async (f) => {
        const [isFollowingBack, followersCount, followingCount] = await Promise.all([
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId!,
                followingId: f.follower.id
              }
            }
          }),
          prisma.follow.count({ where: { followingId: f.follower.id } }),
          prisma.follow.count({ where: { followerId: f.follower.id } })
        ]);

        return {
          ...f.follower,
          followersCount,
          followingCount,
          followedAt: f.createdAt,
          isFollowing: !!isFollowingBack, // Karşılıklı takip durumu
          isFollowingBack: !!isFollowingBack,
          contentCount: 0 // Placeholder
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Takipçiler listesi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Arkadaş önerileri (ortak takipçiler, benzer zevkler)
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;

    // Şu anda takip ettiği kullanıcıları al
    const currentFollowing = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true }
    });

    const followingIds = currentFollowing.map(f => f.followingId);

    // Takip ettiği kullanıcıların takip ettiği kişileri bul (ortak arkadaşlar)
    const mutualConnections = await prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: { 
          not: currentUserId,
          notIn: followingIds // Zaten takip etmediği kişiler
        }
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            city: true,
            isPrivate: true
          }
        }
      },
      take: 20
    });

    // Önerileri grupla ve sırala
    const suggestionMap = new Map();
    
    for (const connection of mutualConnections) {
      const userId = connection.following.id;
      if (suggestionMap.has(userId)) {
        suggestionMap.get(userId).mutualCount++;
      } else {
        const [followersCount, followingCount] = await Promise.all([
          prisma.follow.count({ where: { followingId: userId } }),
          prisma.follow.count({ where: { followerId: userId } })
        ]);

        suggestionMap.set(userId, {
          ...connection.following,
          followersCount,
          followingCount,
          mutualCount: 1,
          isFollowing: false, // Öneriler takip etmediğimiz kişiler
          contentCount: 0 // Placeholder
        });
      }
    }

    // Mutual count'a göre sırala
    const suggestions = Array.from(suggestionMap.values())
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, 8);

    res.json(suggestions);
  } catch (error) {
    console.error('Arkadaş önerileri hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Takipçi/takip edilen sayıları
router.get('/counts', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: currentUserId } }),
      prisma.follow.count({ where: { followerId: currentUserId } })
    ]);

    res.json({
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Sayılar alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcı profili detayı
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        city: true,
        country: true,
        work: true,
        school: true,
        website: true,
        isPrivate: true,
        showAge: true,
        showLocation: true,
        showWork: true,
        age: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Takip durumunu ve sayıları kontrol et
    const [isFollowing, isFollower, followersCount, followingCount, contentCounts] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId!,
            followingId: userId
          }
        }
      }),
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: currentUserId!
          }
        }
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      Promise.all([
        prisma.movie.count({ where: { userId } }),
        prisma.tvShow.count({ where: { userId } }),
        prisma.music.count({ where: { userId } }),
        prisma.restaurant.count({ where: { userId } })
      ])
    ]);

    // Gizlilik ayarlarına göre bilgileri filtrele
    const profile = {
      ...user,
      age: user.showAge ? user.age : null,
      city: user.showLocation ? user.city : null,
      country: user.showLocation ? user.country : null,
      work: user.showWork ? user.work : null,
      school: user.showWork ? user.school : null,
      followersCount,
      followingCount,
      contentCount: contentCounts.reduce((sum, count) => sum + count, 0),
      isFollowing: !!isFollowing,
      isFollower: !!isFollower,
      isOwnProfile: userId === currentUserId
    };

    res.json(profile);
  } catch (error) {
    console.error('Profil detayı hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Kullanıcının içeriğini getir
router.get('/content/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    // Kullanıcının var olup olmadığını kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPrivate: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Eğer profil gizli ise ve takip etmiyorsa içeriği gösterme
    if (targetUser.isPrivate && userId !== currentUserId) {
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId!,
            followingId: userId
          }
        }
      });

      if (!isFollowing) {
        return res.status(403).json({ error: 'Bu kullanıcının içeriğini görmek için takip etmeniz gerekiyor' });
      }
    }

    // Kullanıcının içeriğini getir
    const [movies, tvShows, music, restaurants] = await Promise.all([
      prisma.movie.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.tvShow.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.music.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.restaurant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    res.json({
      movies,
      tvShows,
      music,
      restaurants
    });
  } catch (error) {
    console.error('Kullanıcı içeriği hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;