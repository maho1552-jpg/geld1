import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Clock, TrendingUp, Users, Film, Monitor, Headphones, MapPin, Star, X, Bell } from 'lucide-react';

interface SilentStalkProps {
  onClose: () => void;
}

export const SilentStalk: React.FC<SilentStalkProps> = ({ onClose }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchActivities();
    fetchWeeklySummary();
  }, [timeFilter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;
      
      const response = await fetch(`${API_URL}/api/activity/similar-users-activity?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setActivities(data.activities || []);
      setSimilarUsers(data.similarUsers || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklySummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/activity/weekly-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setWeeklySummary(data.summary);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Dün';
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    return `${Math.floor(diffInDays / 7)} hafta önce`;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'MOVIE': return <Film className="w-5 h-5 text-purple-400" />;
      case 'TV_SHOW': return <Monitor className="w-5 h-5 text-blue-400" />;
      case 'MUSIC': return <Headphones className="w-5 h-5 text-pink-400" />;
      case 'RESTAURANT': return <MapPin className="w-5 h-5 text-green-400" />;
      default: return <Star className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getContentTitle = (activity: any) => {
    if (activity.type === 'MUSIC') {
      return `${activity.artist} - ${activity.title}`;
    }
    return activity.title || activity.name;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black/50 backdrop-blur-sm border-b border-gray-800/50 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Sessiz Stalk</h2>
                <p className="text-sm text-gray-400">Sana benzeyen kullanıcılar ne yapıyor?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex items-center space-x-2 mt-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex space-x-2">
              {[
                { id: 'today', label: 'Bugün' },
                { id: 'week', label: 'Bu Hafta' },
                { id: 'month', label: 'Bu Ay' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTimeFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    timeFilter === filter.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-black/50 text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700/50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {/* Weekly Summary */}
          {weeklySummary && timeFilter === 'week' && (
            <div className="bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 rounded-xl p-6 mb-6 border border-purple-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Bell className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Haftalık Özet</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-300">
                  <span className="text-purple-400 font-semibold">{weeklySummary.similarUserCount}</span> sana benzeyen kullanıcı bu hafta{' '}
                  <span className="text-pink-400 font-semibold">{weeklySummary.totalActivities}</span> içerik ekledi
                </p>
                {weeklySummary.mostPopular && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">En Popüler İçerik:</p>
                    <p className="text-white font-medium">
                      {weeklySummary.mostPopular.title}
                    </p>
                    <p className="text-sm text-purple-300 mt-1">
                      {weeklySummary.mostPopular.count} kişi ekledi • {weeklySummary.mostPopular.type}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {weeklySummary.movieCount > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <Film className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{weeklySummary.movieCount}</p>
                      <p className="text-xs text-gray-400">Film</p>
                    </div>
                  )}
                  {weeklySummary.tvShowCount > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <Monitor className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{weeklySummary.tvShowCount}</p>
                      <p className="text-xs text-gray-400">Dizi</p>
                    </div>
                  )}
                  {weeklySummary.musicCount > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <Headphones className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{weeklySummary.musicCount}</p>
                      <p className="text-xs text-gray-400">Müzik</p>
                    </div>
                  )}
                  {weeklySummary.restaurantCount > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <MapPin className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{weeklySummary.restaurantCount}</p>
                      <p className="text-xs text-gray-400">Mekan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Similar Users */}
          {similarUsers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Sana Benzeyen Kullanıcılar</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {similarUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="bg-gradient-to-br from-gray-800 to-purple-900/30 rounded-lg p-3 flex items-center space-x-3 border border-gray-700/50"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || user.username}
                        className="w-10 h-10 rounded-full border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">{user.name || user.username}</p>
                      <p className="text-xs text-purple-300">%{user.similarity} benzerlik</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold text-white">Son Aktiviteler</h3>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Aktiviteler yükleniyor...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <EyeOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Henüz aktivite yok</p>
                <p className="text-sm text-gray-500 mt-2">
                  Sana benzeyen kullanıcılar içerik eklediğinde burada görünecek
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-800 to-purple-900/20 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {activity.user.avatar ? (
                          <img
                            src={activity.user.avatar}
                            alt={activity.user.name || activity.user.username}
                            className="w-12 h-12 rounded-full border-2 border-purple-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                            {(activity.user.name || activity.user.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-white font-medium">
                            {activity.user.name || activity.user.username}
                          </p>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-400">{getTimeAgo(activity.createdAt)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs text-purple-300">%{Math.round(activity.similarity * 100)} benzer</span>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getContentIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{getContentTitle(activity)}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-400">{activity.contentType}</span>
                              {activity.genre && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-sm text-gray-400">{activity.genre}</span>
                                </>
                              )}
                              {activity.rating && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-sm ${i < activity.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
