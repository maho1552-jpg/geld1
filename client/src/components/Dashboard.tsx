import React, { useState, useEffect } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { contentService } from '../services/contentService';
import { recommendationService } from '../services/recommendationService';

interface DashboardProps {
  user: any;
  onAddContent: (type?: 'movie' | 'tvshow' | 'music' | 'restaurant') => void;
  onNavigate: (page: 'dashboard' | 'profile' | 'recommendations') => void;
  refreshTrigger?: number; // Bu prop değiştiğinde veriler yenilenecek
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onAddContent, onNavigate, refreshTrigger }) => {
  const [stats, setStats] = useState({
    movies: 0,
    tvShows: 0,
    music: 0,
    restaurants: 0,
    recommendations: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

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
          type: 'movie'
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

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-white mb-2">
            Geld'e hoş geldin, {user?.name || user?.username}
          </h1>
          <p className="text-gray-400">
            Zevklerini keşfet ve yeni öneriler al
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Filmler" 
            value={stats.movies} 
            onAdd={() => onAddContent('movie')}
          />
          <StatCard 
            title="Diziler" 
            value={stats.tvShows} 
            onAdd={() => onAddContent('tvshow')}
          />
          <StatCard 
            title="Müzikler" 
            value={stats.music} 
            onAdd={() => onAddContent('music')}
          />
          <StatCard 
            title="Mekanlar" 
            value={stats.restaurants} 
            onAdd={() => onAddContent('restaurant')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommendations */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-medium text-white">Öneriler</h2>
                </div>
                <button 
                  onClick={() => onNavigate('recommendations')}
                  className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Tümünü gör
                </button>
              </div>
            </div>
            <div className="p-6">
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-2">Henüz öneri yok</p>
                  <p className="text-sm text-gray-500">
                    İçerik ekleyerek kişiselleştirilmiş öneriler al
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiRecommendations.slice(0, 4).map((rec: any, index) => (
                    <RecommendationItem key={index} recommendation={rec} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
                <h2 className="text-lg font-medium text-white">Son Aktiviteler</h2>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-2">Henüz aktivite yok</p>
                  <p className="text-sm text-gray-500">
                    İlk içeriğini ekleyerek başla
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index) => (
                    <ActivityItem key={index} activity={activity} />
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
}> = ({ title, value, onAdd }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 group hover:border-gray-700 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-white mt-1">{value}</p>
      </div>
      <button
        onClick={onAdd}
        className="w-8 h-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title={`${title} Ekle`}
      >
        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  </div>
);

const RecommendationItem: React.FC<{ recommendation: any }> = ({ recommendation }) => (
  <div className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {recommendation.title}
      </p>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
        {recommendation.reason}
      </p>
      <div className="flex items-center mt-2">
        <span className="text-xs text-gray-400">
          %{Math.round((recommendation.confidence || 0.5) * 100)} eşleşme
        </span>
      </div>
    </div>
  </div>
);

const ActivityItem: React.FC<{ activity: any }> = ({ activity }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {activity.title}
      </p>
      <p className="text-xs text-gray-500">{activity.subtitle}</p>
    </div>
    <div className="text-xs text-gray-500">
      {activity.time}
    </div>
  </div>
);