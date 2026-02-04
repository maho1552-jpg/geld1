import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, Film, Monitor, Headphones, MapPin, Plus, RefreshCw } from 'lucide-react';
import { contentService } from '../services/contentService';
import { recommendationService } from '../services/recommendationService';

interface DashboardProps {
  user: any;
  onAddContent: (type?: 'movie' | 'tvshow' | 'music' | 'restaurant') => void;
  onNavigate: (page: 'dashboard' | 'profile' | 'recommendations') => void;
  refreshTrigger?: number; // Bu prop değiştiğinde veriler yenilenecek
  onContentAdded?: () => void; // Öneri ekleme callback'i
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onAddContent, onNavigate, refreshTrigger, onContentAdded }) => {
  const [stats, setStats] = useState({
    movies: 0,
    tvShows: 0,
    music: 0,
    restaurants: 0,
    recommendations: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserStats();
    fetchRecentActivity();
    fetchAIRecommendations();
  }, [refreshTrigger]); // refreshTrigger değiştiğinde verileri yenile

  const fetchUserStats = async () => {
    try {
      const statsData = await contentService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const contentData = await contentService.getMyContent();
      const activities: any[] = [];
      
      contentData.movies?.slice(0, 3).forEach((movie: any) => {
        activities.push({
          title: `${movie.title}`,
          subtitle: 'Film eklendi',
          time: new Date(movie.createdAt).toLocaleDateString('tr-TR'),
          type: 'movie',
          data: { poster: movie.poster }
        });
      });
      
      contentData.tvShows?.slice(0, 3).forEach((tvShow: any) => {
        activities.push({
          title: `${tvShow.title}`,
          subtitle: 'Dizi eklendi',
          time: new Date(tvShow.createdAt).toLocaleDateString('tr-TR'),
          type: 'tvshow',
          data: { poster: tvShow.poster }
        });
      });
      
      contentData.music?.slice(0, 3).forEach((music: any) => {
        activities.push({
          title: `${music.artist} - ${music.title}`,
          subtitle: 'Müzik eklendi',
          time: new Date(music.createdAt).toLocaleDateString('tr-TR'),
          type: 'music'
        });
      });
      
      contentData.restaurants?.slice(0, 3).forEach((restaurant: any) => {
        activities.push({
          title: `${restaurant.name}`,
          subtitle: 'Mekan eklendi',
          time: new Date(restaurant.createdAt).toLocaleDateString('tr-TR'),
          type: 'restaurant'
        });
      });
      
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchAIRecommendations = async () => {
    try {
      const [movieRecs, musicRecs, tvRecs, restaurantRecs] = await Promise.all([
        recommendationService.getAISuggestions('MOVIE').catch(() => []),
        recommendationService.getAISuggestions('MUSIC').catch(() => []),
        recommendationService.getAISuggestions('TV_SHOW').catch(() => []),
        recommendationService.getAISuggestions('RESTAURANT').catch(() => [])
      ]);
      
      const allRecs = [
        ...movieRecs.map((rec: any) => ({
          ...rec,
          title: rec.title || rec.item?.title,
          reason: rec.reason || `${rec.fromUser?.name || rec.fromUser?.username || 'Sistem'} tarafından öneriliyor`,
          confidence: rec.confidence || 0.8,
          type: 'MOVIE'
        })),
        ...musicRecs.map((rec: any) => ({
          ...rec,
          title: rec.artist && rec.title ? `${rec.artist} - ${rec.title}` : rec.title || rec.item?.title,
          reason: rec.reason || `${rec.fromUser?.name || rec.fromUser?.username || 'Sistem'} tarafından öneriliyor`,
          confidence: rec.confidence || 0.8,
          type: 'MUSIC'
        })),
        ...tvRecs.map((rec: any) => ({
          ...rec,
          title: rec.title || rec.item?.title,
          reason: rec.reason || `${rec.fromUser?.name || rec.fromUser?.username || 'Sistem'} tarafından öneriliyor`,
          confidence: rec.confidence || 0.8,
          type: 'TV_SHOW'
        })),
        ...restaurantRecs.map((rec: any) => ({
          ...rec,
          title: rec.name || rec.item?.name,
          reason: rec.reason || `${rec.fromUser?.name || rec.fromUser?.username || 'Sistem'} tarafından öneriliyor`,
          confidence: rec.confidence || 0.8,
          type: 'RESTAURANT'
        })),
      ];
      
      const sortedRecs = allRecs
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, 8);
      
      setAiRecommendations(sortedRecs);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setAiRecommendations([]);
    }
  };

  const addToList = async (recommendation: any) => {
    const itemId = recommendation.id || `${recommendation.title || recommendation.name}-${recommendation.type}`;
    
    if (addingItems.has(itemId)) return;
    
    setAddingItems(prev => new Set(prev).add(itemId));
    
    try {
      console.log('Dashboard - Adding recommendation:', recommendation);
      console.log('Dashboard - Recommendation source:', recommendation.source);
      console.log('Dashboard - Recommendation type:', recommendation.type);
      
      // Collaborative filtering önerilerini farklı şekilde işle
      if (recommendation.source === 'collaborative' && recommendation.id) {
        // Bu başka bir kullanıcının içeriği, kendi listemize eklemek için yeni bir entry oluştur
        const data = {
          title: recommendation.title || recommendation.name,
          year: recommendation.year,
          genre: recommendation.genre,
          rating: 5,
          review: 'Öneri listesinden eklendi',
          poster: recommendation.poster,
          tmdbId: recommendation.tmdbId // Orijinal tmdbId'yi kullan
        };

        console.log('Dashboard - Collaborative recommendation data:', data);

        let result;
        switch (recommendation.type) {
          case 'MOVIE':
            result = await contentService.addMovie({
              ...data,
              director: recommendation.director
            });
            break;
          case 'TV_SHOW':
            result = await contentService.addTVShow({
              ...data,
              seasons: recommendation.seasons
            });
            break;
          case 'MUSIC':
            result = await contentService.addMusic({
              title: recommendation.title,
              artist: recommendation.artist,
              album: recommendation.album,
              genre: recommendation.genre,
              year: recommendation.year,
              rating: 5,
              review: 'Öneri listesinden eklendi'
            });
            break;
          case 'RESTAURANT':
            result = await contentService.addRestaurant({
              name: recommendation.name || recommendation.title,
              cuisine: recommendation.cuisine,
              location: recommendation.location,
              rating: 5,
              review: 'Öneri listesinden eklendi'
            });
            break;
        }
        
        console.log('Dashboard - Collaborative add result:', result);
      } else {
        // AI/Fallback önerileri için normal işlem
        const data = {
          title: recommendation.title || recommendation.name,
          year: recommendation.year,
          genre: recommendation.genre,
          rating: 5, // Default rating
          review: 'Öneri listesinden eklendi',
          poster: recommendation.poster,
          tmdbId: recommendation.tmdbId
        };

        console.log('Dashboard - AI/Fallback recommendation data:', data);

        let result;
        switch (recommendation.type) {
          case 'MOVIE':
            result = await contentService.addMovie({
              ...data,
              director: recommendation.director
            });
            break;
          case 'TV_SHOW':
            result = await contentService.addTVShow({
              ...data,
              seasons: recommendation.seasons
            });
            break;
          case 'MUSIC':
            result = await contentService.addMusic({
              title: recommendation.title,
              artist: recommendation.artist,
              album: recommendation.album,
              genre: recommendation.genre,
              year: recommendation.year,
              rating: 5,
              review: 'Öneri listesinden eklendi'
            });
            break;
          case 'RESTAURANT':
            result = await contentService.addRestaurant({
              name: recommendation.name || recommendation.title,
              cuisine: recommendation.cuisine,
              location: recommendation.location,
              rating: 5,
              review: 'Öneri listesinden eklendi'
            });
            break;
        }
        
        console.log('Dashboard - AI/Fallback add result:', result);
      }
      
      // Success message
      alert(`${recommendation.title || recommendation.name} başarıyla eklendi!`);
      
      // Notify parent component that content was added
      if (onContentAdded) {
        onContentAdded();
      }
      
      // Remove from recommendations and refresh data
      setAiRecommendations(prev => prev.filter(rec => {
        const recId = rec.id || `${rec.title || rec.name}-${rec.type}`;
        return recId !== itemId;
      }));
      
      // Refresh stats and recent activity
      fetchUserStats();
      fetchRecentActivity();
      
      // Refresh AI recommendations to get new ones based on updated taste
      setTimeout(() => {
        fetchAIRecommendations();
      }, 1000); // 1 saniye bekle ki backend'de yeni içerik işlensin
      
    } catch (error: any) {
      console.error('Dashboard - Error adding to list:', error);
      console.error('Dashboard - Error details:', error.response?.data || error.message);
      alert(`Ekleme sırasında hata oluştu: ${error.response?.data?.error || error.message}`);
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Geld'e hoş geldin, {user?.name || user?.username}
          </h1>
          <p className="text-gray-400 text-lg">
            Zevklerini keşfet ve yeni öneriler al
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <StatCard 
            title="Filmler" 
            value={stats.movies} 
            onAdd={() => onAddContent('movie')}
            gradient="from-red-500 to-pink-500"
            icon={<Film className="w-6 h-6" />}
          />
          <StatCard 
            title="Diziler" 
            value={stats.tvShows} 
            onAdd={() => onAddContent('tvshow')}
            gradient="from-blue-500 to-purple-500"
            icon={<Monitor className="w-6 h-6" />}
          />
          <StatCard 
            title="Müzikler" 
            value={stats.music} 
            onAdd={() => onAddContent('music')}
            gradient="from-green-500 to-teal-500"
            icon={<Headphones className="w-6 h-6" />}
          />
          <StatCard 
            title="Mekanlar" 
            value={stats.restaurants} 
            onAdd={() => onAddContent('restaurant')}
            gradient="from-orange-500 to-red-500"
            icon={<MapPin className="w-6 h-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommendations */}
          <div className="card hover-lift animate-slide-in-right">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow icon-gradient-bg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Öneriler</h2>
                </div>
                <button 
                  onClick={() => onNavigate('recommendations')}
                  className="btn-secondary text-sm"
                >
                  Tümünü gör
                </button>
              </div>
            </div>
            <div className="p-6">
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow icon-gradient-bg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 mb-2 text-lg font-medium">Henüz öneri yok</p>
                  <p className="text-gray-500">
                    İçerik ekleyerek kişiselleştirilmiş öneriler al
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiRecommendations.slice(0, 4).map((rec: any, index) => {
                    const itemId = rec.id || `${rec.title || rec.name}-${rec.type}`;
                    return (
                      <RecommendationItem 
                        key={index} 
                        recommendation={rec} 
                        index={index}
                        onAddToList={addToList}
                        isAdding={addingItems.has(itemId)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card hover-lift animate-slide-in-right" style={{animationDelay: '0.2s'}}>
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow icon-gradient-bg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Son Aktiviteler</h2>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow icon-gradient-bg">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 mb-2 text-lg font-medium">Henüz aktivite yok</p>
                  <p className="text-gray-500">
                    İlk içeriğini ekleyerek başla
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index) => (
                    <ActivityItem key={index} activity={activity} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Components
const StatCard: React.FC<{
  title: string;
  value: number;
  onAdd: () => void;
  gradient: string;
  icon: React.ReactNode;
}> = ({ title, value, onAdd, gradient, icon }) => (
  <div className="card hover-lift group">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-glow icon-gradient-bg`}>
              <div className="text-white">
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-3xl font-bold text-white mt-1">{value}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover-glow"
          title={`${title} Ekle`}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

const RecommendationItem: React.FC<{ 
  recommendation: any; 
  index: number;
  onAddToList: (recommendation: any) => void;
  isAdding: boolean;
}> = ({ recommendation, index, onAddToList, isAdding }) => {
  const isMovieOrTV = recommendation.type === 'MOVIE' || recommendation.type === 'TV_SHOW';
  const posterUrl = recommendation.poster || recommendation.item?.poster;
  
  return (
    <div 
      className="flex items-start space-x-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-300 hover-lift animate-fade-in-up"
      style={{animationDelay: `${index * 0.1}s`}}
    >
      {/* Poster or Icon */}
      {isMovieOrTV ? (
        posterUrl ? (
          <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
            <img 
              src={`https://image.tmdb.org/t/p/w200${posterUrl}`}
              alt={recommendation.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient icon if image fails
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-16 h-24 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg" style={{display: 'none'}}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-16 h-24 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        )
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate mb-1">
          {recommendation.title}
        </p>
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
          {recommendation.reason}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
            %{Math.round((recommendation.confidence || 0.5) * 100)} eşleşme
          </span>
          <div className="flex items-center space-x-2">
            {isMovieOrTV && (
              <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full">
                {recommendation.type === 'MOVIE' ? 'Film' : 'Dizi'}
              </span>
            )}
            <button 
              onClick={() => onAddToList(recommendation)}
              disabled={isAdding}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Ekleniyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Ekle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{ activity: any; index: number }> = ({ activity, index }) => {
  const isMovieOrTV = activity.type === 'movie' || activity.type === 'tvshow';
  const posterUrl = activity.data?.poster;
  
  return (
    <div 
      className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-300 hover-lift animate-fade-in-up"
      style={{animationDelay: `${index * 0.1}s`}}
    >
      {/* Poster or Icon */}
      {isMovieOrTV ? (
        posterUrl ? (
          <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
            <img 
              src={`https://image.tmdb.org/t/p/w200${posterUrl}`}
              alt={activity.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient icon if image fails
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg" style={{display: 'none'}}>
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg">
            <Activity className="w-6 h-6 text-white" />
          </div>
        )
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow icon-gradient-bg">
          <Activity className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate mb-1">
          {activity.title}
        </p>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-gray-400">{activity.subtitle}</p>
          {isMovieOrTV && (
            <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full">
              {activity.type === 'movie' ? 'Film' : 'Dizi'}
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 font-medium">
        {activity.time}
      </div>
    </div>
  );
};