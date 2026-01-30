const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  work: string | null;
  school: string | null;
  website: string | null;
  age: number | null;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  contentCount: number;
  isFollowing: boolean;
  isFollower: boolean;
  isOwnProfile?: boolean;
  mutualCount?: number;
  followedAt?: string;
  isFollowingBack?: boolean;
}

class FriendsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Kullanıcı arama
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/search?query=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Kullanıcı arama başarısız');
      }

      return await response.json();
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      throw error;
    }
  }

  // Kullanıcıyı takip et
  async followUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/follow/${userId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Takip etme başarısız');
      }
    } catch (error) {
      console.error('Takip etme hatası:', error);
      throw error;
    }
  }

  // Kullanıcıyı takipten çıkar
  async unfollowUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/unfollow/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Takipten çıkarma başarısız');
      }
    } catch (error) {
      console.error('Takipten çıkarma hatası:', error);
      throw error;
    }
  }

  // Takip edilenler listesi
  async getFollowing(page: number = 1, limit: number = 20): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/following?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Takip edilenler listesi alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Takip edilenler listesi hatası:', error);
      throw error;
    }
  }

  // Takipçiler listesi
  async getFollowers(page: number = 1, limit: number = 20): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/followers?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Takipçiler listesi alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Takipçiler listesi hatası:', error);
      throw error;
    }
  }

  // Arkadaş önerileri
  async getSuggestions(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/suggestions`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Arkadaş önerileri alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Arkadaş önerileri hatası:', error);
      throw error;
    }
  }

  // Takipçi/takip edilen sayıları
  async getCounts(): Promise<{ followersCount: number; followingCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/counts`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Sayılar alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Sayılar hatası:', error);
      throw error;
    }
  }

  // Kullanıcı profili detayı
  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/profile/${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Kullanıcı profili alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Kullanıcı profili hatası:', error);
      throw error;
    }
  }
  // Kullanıcının içeriğini getir
  async getUserContent(userId: string): Promise<{
    movies: any[];
    tvShows: any[];
    music: any[];
    restaurants: any[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/content/${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bu kullanıcının içeriğini görmek için takip etmeniz gerekiyor');
        }
        throw new Error('Kullanıcı içeriği alınamadı');
      }

      return await response.json();
    } catch (error) {
      console.error('Kullanıcı içeriği hatası:', error);
      throw error;
    }
  }
}

export const friendsService = new FriendsService();