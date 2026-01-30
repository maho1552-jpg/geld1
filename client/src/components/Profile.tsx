import React, { useState, useEffect } from 'react';
import { User, Clapperboard, Monitor, Headphones, MapPin, Star, Calendar, TrendingUp, BarChart3, PieChart, Activity, Edit3, Mail, Globe, GraduationCap, Briefcase, EyeOff, Users, UserPlus } from 'lucide-react';
import { contentService } from '../services/contentService';
import { friendsService } from '../services/friendsService';
import { EditProfileModal } from './EditProfileModal';

interface ProfileProps {
  user: any;
  onUserUpdate?: (updatedUser: any) => void;
  refreshTrigger?: number;
  onOpenFriends?: () => void;
}

interface ContentStats {
  movies: any[];
  tvShows: any[];
  music: any[];
  restaurants: any[];
  totalCount: number;
  averageRating: number;
  favoriteGenres: string[];
  monthlyActivity: any[];
}

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate, refreshTrigger, onOpenFriends }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'tvshows' | 'music' | 'restaurants'>('overview');
  const [contentStats, setContentStats] = useState<ContentStats>({
    movies: [],
    tvShows: [],
    music: [],
    restaurants: [],
    totalCount: 0,
    averageRating: 0,
    favoriteGenres: [],
    monthlyActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  
  // Social stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  useEffect(() => {
    fetchUserContent();
    fetchSocialStats();
  }, [refreshTrigger]); // refreshTrigger değiştiğinde verileri yenile

  const fetchSocialStats = async () => {
    try {
      const counts = await friendsService.getCounts();
      setFollowingCount(counts.followingCount);
      setFollowersCount(counts.followersCount);
    } catch (error) {
      console.error('Sosyal istatistikler yüklenirken hata:', error);
    }
  };

  const fetchUserContent = async () => {
    try {
      setIsLoading(true);
      const data = await contentService.getMyContent();
      
      // Calculate stats
      const allContent = [
        ...(data.movies || []),
        ...(data.tvShows || []),
        ...(data.music || []),
        ...(data.restaurants || [])
      ];

      const totalRatings = allContent.filter(item => item.rating).reduce((sum, item) => sum + item.rating, 0);
      const ratedItemsCount = allContent.filter(item => item.rating).length;
      const averageRating = ratedItemsCount > 0 ? totalRatings / ratedItemsCount : 0;

      // Extract genres
      const genres = allContent
        .filter(item => item.genre)
        .flatMap(item => typeof item.genre === 'string' ? item.genre.split(',').map((g: string) => g.trim()) : [])
        .filter(genre => genre.length > 0);
      
      const genreCount = genres.reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteGenres = Object.entries(genreCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([genre]) => genre);

      setContentStats({
        movies: data.movies || [],
        tvShows: data.tvShows || [],
        music: data.music || [],
        restaurants: data.restaurants || [],
        totalCount: allContent.length,
        averageRating,
        favoriteGenres,
        monthlyActivity: [] // Bu kısım backend'de hesaplanabilir
      });
    } catch (error) {
      console.error('Error fetching user content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Toplam İçerik"
          value={contentStats.totalCount}
          icon={<Activity className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
        <StatCard
          title="Ortalama Puan"
          value={contentStats.averageRating.toFixed(1)}
          icon={<Star className="w-6 h-6" />}
          color="from-yellow-600 to-yellow-500"
        />
        <StatCard
          title="Filmler"
          value={contentStats.movies.length}
          icon={<Clapperboard className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
        <StatCard
          title="Diziler"
          value={contentStats.tvShows.length}
          icon={<Monitor className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Müzikler"
          value={contentStats.music.length}
          icon={<Headphones className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
        <StatCard
          title="Mekanlar"
          value={contentStats.restaurants.length}
          icon={<MapPin className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
        <StatCard
          title="Bu Ay"
          value="12" // Bu backend'den gelecek
          icon={<Calendar className="w-6 h-6" />}
          color="from-gray-800 to-gray-700"
        />
        <StatCard
          title="Trend"
          value="+15%" // Bu backend'den gelecek
          icon={<TrendingUp className="w-6 h-6" />}
          color="from-green-600 to-green-500"
        />
      </div>

      {/* Favorite Genres */}
      <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <PieChart className="mr-2 text-gray-400" size={20} />
          Favori Türler
        </h3>
        <div className="flex flex-wrap gap-2">
          {contentStats.favoriteGenres.map((genre) => (
            <span
              key={genre}
              className="px-3 py-1 bg-gray-800/40 text-gray-300 rounded-full text-sm border border-gray-700/50"
            >
              {genre}
            </span>
          ))}
          {contentStats.favoriteGenres.length === 0 && (
            <p className="text-gray-400">Henüz tür bilgisi yok</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="mr-2 text-gray-400" size={20} />
          Son Aktiviteler
        </h3>
        <div className="space-y-3">
          {[...contentStats.movies, ...contentStats.tvShows, ...contentStats.music, ...contentStats.restaurants]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="text-lg text-gray-400">
                  {item.type === 'MOVIE' && <Clapperboard className="w-5 h-5" />}
                  {item.type === 'TV_SHOW' && <Monitor className="w-5 h-5" />}
                  {item.type === 'MUSIC' && <Headphones className="w-5 h-5" />}
                  {item.type === 'RESTAURANT' && <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {item.title || item.name} eklendi
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                {item.rating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-300 ml-1">{item.rating}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderContentList = (items: any[], type: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, itemIndex) => (
        <div key={itemIndex} className="bg-gray-900/30 backdrop-blur-xl rounded-2xl p-4 border border-gray-800/50 hover:bg-gray-800/30 transition-all duration-300">
          <div className="flex items-start space-x-3">
            {item.poster && (
              <img
                src={item.poster}
                alt={item.title || item.name}
                className="w-16 h-20 rounded-lg object-cover bg-gray-800/30"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">
                {item.title || item.name}
              </h4>
              {item.artist && (
                <p className="text-xs text-gray-400">{item.artist}</p>
              )}
              {item.director && (
                <p className="text-xs text-gray-400">Yön: {item.director}</p>
              )}
              {item.cuisine && (
                <p className="text-xs text-gray-400">{item.cuisine}</p>
              )}
              {item.location && (
                <p className="text-xs text-gray-400">{item.location}</p>
              )}
              {item.year && (
                <p className="text-xs text-gray-400">{item.year}</p>
              )}
              {item.rating && (
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-300 ml-1">{item.rating}/5</span>
                </div>
              )}
              {item.review && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.review}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400">Henüz {type} eklenmemiş</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-800/30 rounded-full flex items-center justify-center overflow-hidden border border-gray-700/50">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.name || currentUser?.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white">
                  {currentUser?.name || currentUser?.username}
                </h1>
                <p className="text-gray-400">@{currentUser?.username}</p>
                
                {currentUser?.bio && (
                  <p className="text-gray-300 mt-2 max-w-md">{currentUser.bio}</p>
                )}

                {/* Profile Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{currentUser?.email}</span>
                  </div>
                  
                  {currentUser?.age && currentUser?.showAge && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{currentUser.age} yaşında</span>
                    </div>
                  )}
                  
                  {(currentUser?.city || currentUser?.country) && currentUser?.showLocation && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {[currentUser?.city, currentUser?.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {(currentUser?.work || currentUser?.jobTitle) && currentUser?.showWork && (
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span>
                        {[currentUser?.jobTitle, currentUser?.work].filter(Boolean).join(' @ ')}
                      </span>
                    </div>
                  )}
                  
                  {currentUser?.school && (
                    <div className="flex items-center space-x-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{currentUser.school}</span>
                    </div>
                  )}
                  
                  {currentUser?.website && (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={currentUser.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Stats */}
                <div className="flex items-center space-x-6 mt-4">
                  <button
                    onClick={onOpenFriends}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      <span className="font-medium">{followersCount}</span> takipçi
                    </span>
                  </button>
                  
                  <button
                    onClick={onOpenFriends}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">
                      <span className="font-medium">{followingCount}</span> takip
                    </span>
                  </button>
                </div>

                {/* Privacy Indicator */}
                {currentUser?.isPrivate && (
                  <div className="flex items-center space-x-1 mt-2">
                    <EyeOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Özel Profil</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setEditModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Edit3 size={16} />
              <span>Düzenle</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-2 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'movies', label: 'Filmler', icon: Clapperboard },
              { id: 'tvshows', label: 'Diziler', icon: Monitor },
              { id: 'music', label: 'Müzikler', icon: Headphones },
              { id: 'restaurants', label: 'Mekanlar', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800/50 text-white border border-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/20'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'movies' && renderContentList(contentStats.movies, 'film')}
          {activeTab === 'tvshows' && renderContentList(contentStats.tvShows, 'dizi')}
          {activeTab === 'music' && renderContentList(contentStats.music, 'müzik')}
          {activeTab === 'restaurants' && renderContentList(contentStats.restaurants, 'mekan')}
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={currentUser}
          onUpdate={handleUserUpdate}
        />
      </div>
    </div>
  );
};

// Helper component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon }) => (
  <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 hover:bg-gray-800/30 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-semibold text-white mt-1">{value}</p>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  </div>
);