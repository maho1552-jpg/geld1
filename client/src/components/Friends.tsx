import React, { useState, useEffect } from 'react';
import { UserPlus, Activity, Clock, Film, Tv, Music, MapPin } from 'lucide-react';
import { friendsService } from '../services/friendsService';
import { contentService } from '../services/contentService';

interface FriendsProps {
  user: any;
  onAddFriend: () => void;
  onUserProfile: (userId: string) => void;
}

export const Friends: React.FC<FriendsProps> = ({ user, onAddFriend, onUserProfile }) => {
  const [following, setFollowing] = useState<any[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);
  const [friendsStats, setFriendsStats] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      
      // Takip edilenleri al
      const followingData = await friendsService.getFollowing();
      setFollowing(followingData);
      
      // Arkadaşların aktivitelerini al
      await fetchFriendsActivity(followingData);
      
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendsActivity = async (friends: any[]) => {
    try {
      const activities: any[] = [];
      const stats: {[key: string]: any} = {};
      
      // Her arkadaş için son aktiviteleri ve istatistikleri al
      for (const friend of friends.slice(0, 10)) { // İlk 10 arkadaş
        try {
          const friendContent = await contentService.getUserContent(friend.id);
          
          // İstatistikleri hesapla
          stats[friend.id] = {
            movies: friendContent.movies?.length || 0,
            tvShows: friendContent.tvShows?.length || 0,
            music: friendContent.music?.length || 0,
            restaurants: friendContent.restaurants?.length || 0,
            total: (friendContent.movies?.length || 0) + 
                   (friendContent.tvShows?.length || 0) + 
                   (friendContent.music?.length || 0) + 
                   (friendContent.restaurants?.length || 0)
          };
          
          // Son eklenen içerikleri aktivite olarak ekle
          friendContent.movies?.slice(0, 2).forEach((movie: any) => {
            activities.push({
              id: `movie-${movie.id}`,
              user: friend,
              type: 'movie',
              title: movie.title,
              subtitle: 'film ekledi',
              time: new Date(movie.createdAt),
              icon: Film,
              data: movie
            });
          });
          
          friendContent.tvShows?.slice(0, 2).forEach((show: any) => {
            activities.push({
              id: `tv-${show.id}`,
              user: friend,
              type: 'tvshow',
              title: show.title,
              subtitle: 'dizi ekledi',
              time: new Date(show.createdAt),
              icon: Tv,
              data: show
            });
          });
          
          friendContent.music?.slice(0, 2).forEach((music: any) => {
            activities.push({
              id: `music-${music.id}`,
              user: friend,
              type: 'music',
              title: `${music.artist} - ${music.title}`,
              subtitle: 'müzik ekledi',
              time: new Date(music.createdAt),
              icon: Music,
              data: music
            });
          });
          
          friendContent.restaurants?.slice(0, 2).forEach((restaurant: any) => {
            activities.push({
              id: `restaurant-${restaurant.id}`,
              user: friend,
              type: 'restaurant',
              title: restaurant.name,
              subtitle: 'mekan ekledi',
              time: new Date(restaurant.createdAt),
              icon: MapPin,
              data: restaurant
            });
          });
          
        } catch (error) {
          console.error(`Error fetching content for friend ${friend.id}:`, error);
        }
      }
      
      // İstatistikleri kaydet
      setFriendsStats(stats);
      
      // Aktiviteleri zamana göre sırala
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setFriendsActivity(activities.slice(0, 20)); // Son 20 aktivite
      
    } catch (error) {
      console.error('Error fetching friends activity:', error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}dk önce`;
    if (hours < 24) return `${hours}sa önce`;
    return `${days}g önce`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-purple-900 border border-gray-800/50 rounded-xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-gradient-bg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Arkadaşlar</h1>
                  <p className="text-gray-300">
                    Arkadaşlarının son aktivitelerini takip et
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onAddFriend}
              className="bg-gradient-to-r from-purple-600 to-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-gray-900 transition-all duration-300 flex items-center space-x-2 border border-purple-500/30 shadow-lg hover:shadow-purple-500/25"
            >
              <UserPlus size={16} />
              <span>Arkadaş Ekle</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friends List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/50 border border-gray-800/50 rounded-xl backdrop-blur-sm">
              <div className="p-6 border-b border-gray-800/50">
                <h2 className="text-lg font-medium text-white">
                  Takip Edilenler ({following.length})
                </h2>
              </div>
              <div className="p-6">
                {following.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 icon-gradient-bg">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-300 mb-2">Henüz arkadaş yok</p>
                    <p className="text-sm text-gray-400">
                      Arkadaş ekleyerek başla
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {following.map((friend) => (
                      <FriendItem 
                        key={friend.id} 
                        friend={friend} 
                        stats={friendsStats[friend.id]}
                        onUserProfile={onUserProfile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/50 border border-gray-800/50 rounded-xl backdrop-blur-sm">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center icon-gradient-bg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-medium text-white">Son Aktiviteler</h2>
                </div>
              </div>
              <div className="p-6">
                {friendsActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 icon-gradient-bg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-300 mb-2">Henüz aktivite yok</p>
                    <p className="text-sm text-gray-400">
                      Arkadaşların içerik ekledikçe burada görünecek
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {friendsActivity.map((activity) => (
                      <ActivityItem 
                        key={activity.id} 
                        activity={activity} 
                        onUserProfile={onUserProfile}
                        formatTime={formatTime}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Components
const FriendItem: React.FC<{ 
  friend: any; 
  stats?: any;
  onUserProfile: (userId: string) => void;
}> = ({ friend, stats, onUserProfile }) => (
  <button
    onClick={() => onUserProfile(friend.id)}
    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800/50 rounded-xl transition-all duration-300 text-left border border-gray-800/30 hover:border-purple-500/30"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-purple-900/50 rounded-full flex items-center justify-center border border-gray-700/50">
      <span className="text-sm font-medium text-white">
        {(friend.name || friend.username).charAt(0).toUpperCase()}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {friend.name || friend.username}
      </p>
      <p className="text-xs text-gray-400">@{friend.username}</p>
      {stats && (
        <div className="flex items-center space-x-3 mt-1">
          {stats.movies > 0 && (
            <div className="flex items-center space-x-1">
              <Film size={10} className="icon-gradient" />
              <span className="text-xs text-gray-400">{stats.movies}</span>
            </div>
          )}
          {stats.tvShows > 0 && (
            <div className="flex items-center space-x-1">
              <Tv size={10} className="icon-gradient" />
              <span className="text-xs text-gray-400">{stats.tvShows}</span>
            </div>
          )}
          {stats.music > 0 && (
            <div className="flex items-center space-x-1">
              <Music size={10} className="icon-gradient" />
              <span className="text-xs text-gray-400">{stats.music}</span>
            </div>
          )}
          {stats.restaurants > 0 && (
            <div className="flex items-center space-x-1">
              <MapPin size={10} className="icon-gradient" />
              <span className="text-xs text-gray-400">{stats.restaurants}</span>
            </div>
          )}
          {stats.total === 0 && (
            <span className="text-xs text-gray-500">Henüz içerik yok</span>
          )}
        </div>
      )}
    </div>
  </button>
);

const ActivityItem: React.FC<{ 
  activity: any; 
  onUserProfile: (userId: string) => void;
  formatTime: (date: Date) => string;
}> = ({ activity, onUserProfile, formatTime }) => {
  const IconComponent = activity.icon;
  
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-800/30 rounded-xl transition-all duration-300 border border-gray-800/20 hover:border-purple-500/20">
      <button
        onClick={() => onUserProfile(activity.user.id)}
        className="w-10 h-10 bg-gradient-to-br from-gray-800 to-purple-900/50 rounded-full flex items-center justify-center hover:from-gray-700 hover:to-purple-800/50 transition-all duration-300 border border-gray-700/50"
      >
        <span className="text-sm font-medium text-white">
          {(activity.user.name || activity.user.username).charAt(0).toUpperCase()}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <button
            onClick={() => onUserProfile(activity.user.id)}
            className="text-sm font-medium text-white hover:text-purple-300 transition-colors"
          >
            {activity.user.name || activity.user.username}
          </button>
          <span className="text-xs text-gray-400">{activity.subtitle}</span>
        </div>
        <div className="flex items-center space-x-2">
          <IconComponent size={14} className="icon-gradient" />
          <p className="text-sm text-gray-300 truncate">{activity.title}</p>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <Clock size={12} className="text-gray-600" />
          <span className="text-xs text-gray-500">{formatTime(activity.time)}</span>
        </div>
      </div>
    </div>
  );
};