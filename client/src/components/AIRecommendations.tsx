import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Users, RefreshCw, Filter, Star, ChevronDown } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';

interface AIRecommendationsProps {
  user: any;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tvshows' | 'music' | 'restaurants'>('all');
  const [recommendationType, setRecommendationType] = useState<'hybrid' | 'smart-only' | 'collaborative'>('hybrid');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [activeTab, recommendationType]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      let allRecs: any[] = [];

      if (activeTab === 'all') {
        const [movieRecs, tvRecs, musicRecs, restaurantRecs] = await Promise.all([
          getRecommendationsByType('MOVIE'),
          getRecommendationsByType('TV_SHOW'),
          getRecommendationsByType('MUSIC'),
          getRecommendationsByType('RESTAURANT')
        ]);

        allRecs = [
          ...movieRecs.map((rec: any) => ({ ...rec, category: 'movie' })),
          ...tvRecs.map((rec: any) => ({ ...rec, category: 'tvshow' })),
          ...musicRecs.map((rec: any) => ({ ...rec, category: 'music' })),
          ...restaurantRecs.map((rec: any) => ({ ...rec, category: 'restaurant' }))
        ];
      } else {
        const typeMap = {
          'movies': 'MOVIE',
          'tvshows': 'TV_SHOW',
          'music': 'MUSIC',
          'restaurants': 'RESTAURANT'
        };

        const recs = await getRecommendationsByType(typeMap[activeTab as keyof typeof typeMap] as any);
        allRecs = recs.map((rec: any) => ({ 
          ...rec, 
          category: activeTab
        }));
      }

      allRecs.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      
      setRecommendations(allRecs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationsByType = async (type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') => {
    try {
      switch (recommendationType) {
        case 'smart-only':
          return await recommendationService.getAIOnlySuggestions(type);
        case 'collaborative':
          return await recommendationService.getCollaborativeSuggestions(type);
        default:
          return await recommendationService.getAISuggestions(type);
      }
    } catch (error) {
      console.error(`Error fetching ${type} recommendations:`, error);
      return [];
    }
  };

  const getRecommendationTypeLabel = () => {
    switch (recommendationType) {
      case 'smart-only':
        return 'Akıllı Öneriler';
      case 'collaborative':
        return 'Benzer Kullanıcılar';
      default:
        return 'Hibrit Öneriler';
    }
  };

  const tabItems = [
    { id: 'all', label: 'Tümü' },
    { id: 'movies', label: 'Filmler' },
    { id: 'tvshows', label: 'Diziler' },
    { id: 'music', label: 'Müzikler' },
    { id: 'restaurants', label: 'Mekanlar' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Öneriler
              </h1>
              <p className="text-gray-400">
                Zevklerinize göre kişiselleştirilmiş öneriler
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
                </span>
              )}
              <button
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="bg-gray-800/50 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center space-x-2 disabled:opacity-50 border border-gray-700/50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Category Tabs */}
            <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recommendation Type Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Öneri Türü:</span>
              </div>
              <div className="relative">
                <select
                  value={recommendationType}
                  onChange={(e) => setRecommendationType(e.target.value as any)}
                  className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                >
                  <option value="hybrid">Hibrit (Akıllı + Kullanıcılar)</option>
                  <option value="smart-only">Sadece Akıllı</option>
                  <option value="collaborative">Benzer Kullanıcılar</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Öneriler hazırlanıyor...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">Henüz öneri yok</p>
              <p className="text-sm text-gray-500">
                Daha fazla içerik ekleyerek kişiselleştirilmiş öneriler alabilirsin
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              {recommendationType === 'smart-only' && <Brain className="w-4 h-4 text-gray-400" />}
              {recommendationType === 'collaborative' && <Users className="w-4 h-4 text-gray-400" />}
              {recommendationType === 'hybrid' && <Sparkles className="w-4 h-4 text-gray-400" />}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                {getRecommendationTypeLabel()}
              </h3>
              <div className="text-sm text-gray-400 space-y-1">
                {recommendationType === 'hybrid' && (
                  <p>Akıllı analiz ve benzer kullanıcıların tercihlerini birleştirerek en iyi önerileri sunuyoruz.</p>
                )}
                {recommendationType === 'smart-only' && (
                  <p>Sadece akıllı analiz kullanarak zevklerinize uygun yeni keşifler öneriyoruz.</p>
                )}
                {recommendationType === 'collaborative' && (
                  <p>Sizinle benzer zevklere sahip kullanıcıların beğendikleri içerikleri öneriyoruz.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard: React.FC<{ recommendation: any }> = ({ recommendation }) => {
  const getTitle = () => {
    if (recommendation.title) return recommendation.title;
    if (recommendation.name) return recommendation.name;
    if (recommendation.artist && recommendation.title) {
      return `${recommendation.artist} - ${recommendation.title}`;
    }
    return 'Bilinmeyen';
  };

  const getSubtitle = () => {
    const parts = [];
    if (recommendation.year) parts.push(recommendation.year);
    if (recommendation.genre) parts.push(recommendation.genre);
    if (recommendation.director) parts.push(`Yön: ${recommendation.director}`);
    if (recommendation.cuisine) parts.push(recommendation.cuisine);
    if (recommendation.location) parts.push(recommendation.location);
    return parts.join(' • ');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-white line-clamp-2">
              {getTitle()}
            </h3>
            <div className="flex items-center space-x-2 ml-2">
              {recommendation.source === 'collaborative' && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300">
                  <Users className="w-3 h-3 mr-1" />
                  Kullanıcı
                </span>
              )}
            </div>
          </div>
          
          {getSubtitle() && (
            <p className="text-sm text-gray-500 mb-3">{getSubtitle()}</p>
          )}
          
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {recommendation.reason}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300">
                %{Math.round((recommendation.confidence || 0.5) * 100)} eşleşme
              </span>
              {recommendation.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-400">{recommendation.rating}</span>
                </div>
              )}
            </div>
            <button className="text-sm text-gray-400 hover:text-white font-medium transition-colors">
              Detay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};