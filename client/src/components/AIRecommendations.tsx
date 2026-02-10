import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Users, RefreshCw, Filter, Star, ChevronDown, Clapperboard, Monitor, Headphones, MapPin, Plus } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';
import { contentService } from '../services/contentService';

interface AIRecommendationsProps {
  user: any;
  onContentAdded?: () => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onContentAdded }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tvshows' | 'music' | 'restaurants' | 'popular'>('all');
  const [recommendationType, setRecommendationType] = useState<'hybrid' | 'smart-only' | 'collaborative'>('hybrid');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, [activeTab, recommendationType]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      let allRecs: any[] = [];

      // Popüler sekmesi için TMDB'den popüler içerikleri getir
      if (activeTab === 'popular') {
        const popularMovies = await fetchPopularFromTMDB('movie');
        const popularTV = await fetchPopularFromTMDB('tv');
        allRecs = [
          ...popularMovies.map((rec: any) => ({ ...rec, category: 'movie' })),
          ...popularTV.map((rec: any) => ({ ...rec, category: 'tvshow' }))
        ];
      } else if (activeTab === 'all') {
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
      console.log('=== FETCHING RECOMMENDATIONS ===');
      console.log('Recommendation type filter:', recommendationType);
      console.log('Content type:', type);
      
      let result;
      switch (recommendationType) {
        case 'smart-only':
          console.log('Calling getAIOnlySuggestions');
          result = await recommendationService.getAIOnlySuggestions(type);
          break;
        case 'collaborative':
          console.log('Calling getCollaborativeSuggestions');
          result = await recommendationService.getCollaborativeSuggestions(type);
          break;
        default:
          console.log('Calling getAISuggestions (hybrid)');
          result = await recommendationService.getAISuggestions(type);
          break;
      }
      
      console.log('API result:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching ${type} recommendations:`, error);
      console.error('Full error details:', (error as any).response?.data || (error as any).message);
      return [];
    }
  };

  const fetchPopularFromTMDB = async (mediaType: 'movie' | 'tv') => {
    try {
      const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNDM3MzI3Y2Y5ZDI0YmNmMWJhODNlNTA1ZjhlMGEwNyIsIm5iZiI6MTc2OTYyMjYzNy4xOTUwMDAyLCJzdWIiOiI2OTdhNGM2ZDExM2YwNDkzYzExMmY2Y2EiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.cGdshBSCvpMofvGRBL3-GsEctxy2Gx_Ju6ds0BE5Mqo';
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/popular?language=tr-TR&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      return data.results.slice(0, 20).map((item: any) => ({
        id: `tmdb-${item.id}`,
        title: item.title || item.name,
        type: mediaType === 'movie' ? 'MOVIE' : 'TV_SHOW',
        genre: item.genre_ids?.join(',') || '',
        year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0],
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
        tmdbId: item.id,
        confidence: Math.floor(item.vote_average * 10), // 0-100 arası skor
        source: 'TMDB Popüler'
      }));
    } catch (error) {
      console.error(`Error fetching popular ${mediaType}:`, error);
      return [];
    }
  };

  const getRecommendationsByType = async (type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') => {
    try {
      console.log('=== FETCHING RECOMMENDATIONS ===');
      console.log('Recommendation type filter:', recommendationType);
      console.log('Content type:', type);
      
      let result;
      switch (recommendationType) {
        case 'smart-only':
          console.log('Calling getAIOnlySuggestions');
          result = await recommendationService.getAIOnlySuggestions(type);
          break;
        case 'collaborative':
          console.log('Calling getCollaborativeSuggestions');
          result = await recommendationService.getCollaborativeSuggestions(type);
          break;
        default:
          console.log('Calling getAISuggestions (hybrid)');
          result = await recommendationService.getAISuggestions(type);
          break;
      }
      
      console.log('API result:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching ${type} recommendations:`, error);
      console.error('Full error details:', (error as any).response?.data || (error as any).message);
      return [];
    }
  };

  const addToList = async (recommendation: any) => {
    const itemId = recommendation.id || `${recommendation.title || recommendation.name}-${recommendation.type}`;
    
    console.log('=== ADDING RECOMMENDATION START ===');
    console.log('Item ID:', itemId);
    console.log('Already adding?', addingItems.has(itemId));
    
    if (addingItems.has(itemId)) return;
    
    setAddingItems(prev => new Set(prev).add(itemId));
    
    try {
      console.log('Adding recommendation:', recommendation);
      console.log('Recommendation source:', recommendation.source);
      console.log('Recommendation type:', recommendation.type);
      console.log('Type check - is MOVIE?', recommendation.type === 'MOVIE');
      console.log('Type check - is TV_SHOW?', recommendation.type === 'TV_SHOW');
      console.log('Type check - is MUSIC?', recommendation.type === 'MUSIC');
      console.log('Type check - is RESTAURANT?', recommendation.type === 'RESTAURANT');
      console.log('Type typeof:', typeof recommendation.type);
      console.log('Type length:', recommendation.type?.length);
      
      let result: any;
      
      // Tüm öneriler için aynı işlemi yap
      let type = (recommendation.type || '').toUpperCase().trim();
      
      // Eğer type yoksa, objenin alanlarına bakarak tahmin et
      if (!type) {
        console.log('Type is missing, trying to detect from object fields...');
        if (recommendation.tmdbId || recommendation.director || (recommendation.title && !recommendation.artist && !recommendation.cuisine)) {
          type = 'MOVIE';
          console.log('Detected as MOVIE');
        } else if (recommendation.artist || recommendation.album) {
          type = 'MUSIC';
          console.log('Detected as MUSIC');
        } else if (recommendation.cuisine || recommendation.location) {
          type = 'RESTAURANT';
          console.log('Detected as RESTAURANT');
        } else if (recommendation.seasons) {
          type = 'TV_SHOW';
          console.log('Detected as TV_SHOW');
        } else {
          // Varsayılan olarak MOVIE kabul et (çoğu öneri film)
          type = 'MOVIE';
          console.log('Defaulting to MOVIE');
        }
      }
      
      console.log('Final processed type:', type);
      
      switch (type) {
        case 'MOVIE':
          result = await contentService.addMovie({
            title: recommendation.title || recommendation.name,
            year: recommendation.year,
            genre: recommendation.genre,
            director: recommendation.director,
            rating: 5,
            review: 'Öneri listesinden eklendi',
            poster: recommendation.poster,
            tmdbId: recommendation.tmdbId
          });
          break;
        case 'TV_SHOW':
        case 'TVSHOW':
        case 'TV':
          result = await contentService.addTVShow({
            title: recommendation.title || recommendation.name,
            year: recommendation.year,
            genre: recommendation.genre,
            seasons: recommendation.seasons,
            rating: 5,
            review: 'Öneri listesinden eklendi',
            poster: recommendation.poster,
            tmdbId: recommendation.tmdbId
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
        default:
          console.error('Unknown recommendation type:', recommendation.type);
          console.error('Processed type:', type);
          console.error('Full recommendation object:', recommendation);
          throw new Error(`Geçersiz öneri türü: "${recommendation.type}" (processed: "${type}")`);
      }
      
      console.log('=== CONTENT ADDED SUCCESSFULLY ===');
      console.log('Result:', result);
      
      // Success message
      alert(`${recommendation.title || recommendation.name} başarıyla eklendi!`);
      
      // Notify parent component that content was added
      if (onContentAdded) {
        console.log('Calling onContentAdded callback');
        onContentAdded();
      }
      
      // Remove from recommendations after successful add
      console.log('Removing from recommendations list');
      console.log('Current recommendations count:', recommendations.length);
      console.log('Item ID to remove:', itemId);
      
      setRecommendations(prev => {
        console.log('Before filter - recommendations count:', prev.length);
        const filtered = prev.filter(rec => {
          const recId = rec.id || `${rec.title || rec.name}-${rec.type}`;
          const shouldKeep = recId !== itemId;
          if (!shouldKeep) {
            console.log('Removing recommendation:', rec.title || rec.name, 'with ID:', recId);
          }
          return shouldKeep;
        });
        console.log('After filter - recommendations count:', filtered.length);
        return filtered;
      });
      
      // Refresh recommendations to get new ones based on updated taste
      console.log('Scheduling recommendations refresh in 1 second');
      setTimeout(() => {
        console.log('=== REFRESHING RECOMMENDATIONS AFTER ADD ===');
        fetchRecommendations();
      }, 1000); // 1 saniye bekle ki backend'de yeni içerik işlensin
      
    } catch (error: any) {
      console.error('=== ERROR ADDING RECOMMENDATION ===');
      console.error('Error adding to list:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Ekleme sırasında hata oluştu: ${error.response?.data?.error || error.message}`);
    } finally {
      console.log('=== CLEANING UP ===');
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      console.log('=== ADDING RECOMMENDATION END ===');
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
    { id: 'popular', label: 'Popüler' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-purple-900 border border-gray-800/50 rounded-xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center icon-gradient-bg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Akıllı Öneriler
                  </h1>
                  <p className="text-gray-300">
                    Zevklerinize göre kişiselleştirilmiş öneriler
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-400">
                  Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
                </span>
              )}
              <button
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-gray-900 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 border border-purple-500/30 shadow-lg hover:shadow-purple-500/25"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/50 border border-gray-800/50 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Category Tabs */}
            <div className="flex space-x-1 bg-black/50 rounded-xl p-1 border border-gray-800/50">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-black text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recommendation Type Filter - Hide for Popular tab */}
            {activeTab !== 'popular' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Filter className="w-4 h-4 icon-gradient" />
                  <span className="text-sm">Öneri Türü:</span>
                </div>
                <div className="relative">
                  <select
                    value={recommendationType}
                    onChange={(e) => setRecommendationType(e.target.value as any)}
                    className="appearance-none bg-black/50 border border-gray-700/50 rounded-xl px-4 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
                  >
                    <option value="hybrid">Hibrit (Akıllı + Kullanıcılar)</option>
                    <option value="smart-only">Sadece Akıllı</option>
                  <option value="collaborative">Benzer Kullanıcılar</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Öneriler hazırlanıyor...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-purple-900/50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700/50">
                <Sparkles className="w-8 h-8 icon-gradient" />
              </div>
              <p className="text-gray-300 mb-2">Henüz öneri yok</p>
              <p className="text-sm text-gray-400">
                Daha fazla içerik ekleyerek kişiselleştirilmiş öneriler alabilirsin
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => {
                const itemId = rec.id || `${rec.title || rec.name}-${rec.type}`;
                return (
                  <RecommendationCard 
                    key={index} 
                    recommendation={rec} 
                    onAddToList={addToList}
                    isAdding={addingItems.has(itemId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-br from-gray-900 via-black to-purple-900/50 border border-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center icon-gradient-bg">
              {recommendationType === 'smart-only' && <Brain className="w-4 h-4 text-white" />}
              {recommendationType === 'collaborative' && <Users className="w-4 h-4 text-white" />}
              {recommendationType === 'hybrid' && <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                {getRecommendationTypeLabel()}
              </h3>
              <div className="text-sm text-gray-300 space-y-1">
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
const RecommendationCard: React.FC<{ 
  recommendation: any; 
  onAddToList: (recommendation: any) => void;
  isAdding: boolean;
}> = ({ recommendation, onAddToList, isAdding }) => {
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

  const isMovieOrTV = recommendation.type === 'MOVIE' || recommendation.type === 'TV_SHOW';
  const posterUrl = recommendation.poster || recommendation.item?.poster;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900/30 border border-gray-800/50 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
      <div className="flex items-start space-x-4">
        {/* Poster for movies/TV shows */}
        {isMovieOrTV && posterUrl ? (
          <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-gray-700/50">
            <img
              src={`https://image.tmdb.org/t/p/w200${posterUrl}`}
              alt={getTitle()}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient background
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-20 h-28 rounded-xl flex items-center justify-center icon-gradient-bg" style={{display: 'none'}}>
              {recommendation.type === 'MOVIE' ? (
                <Clapperboard className="w-8 h-8 text-white" />
              ) : (
                <Monitor className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 icon-gradient-bg">
            {recommendation.type === 'MUSIC' && <Headphones className="w-8 h-8 text-white" />}
            {recommendation.type === 'RESTAURANT' && <MapPin className="w-8 h-8 text-white" />}
            {!recommendation.type && <Sparkles className="w-8 h-8 text-white" />}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white line-clamp-2 text-lg">
              {getTitle()}
            </h3>
            <div className="flex items-center space-x-2 ml-2">
              {recommendation.source === 'collaborative' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  Kullanıcı
                </span>
              )}
              {isMovieOrTV && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {recommendation.type === 'MOVIE' ? 'Film' : 'Dizi'}
                </span>
              )}
            </div>
          </div>
          
          {getSubtitle() && (
            <p className="text-sm text-gray-300 mb-3">{getSubtitle()}</p>
          )}
          
          <p className="text-sm text-gray-400 mb-4 line-clamp-3">
            {recommendation.reason}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                %{Math.round((recommendation.confidence || 0.5) * 100)} eşleşme
              </span>
              {recommendation.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-300">{recommendation.rating}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => onAddToList(recommendation)}
              disabled={isAdding}
              className="bg-gradient-to-r from-purple-600 to-black hover:from-purple-700 hover:to-gray-900 disabled:from-purple-600/50 disabled:to-black/50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 disabled:cursor-not-allowed border border-purple-500/30 shadow-lg hover:shadow-purple-500/25"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ekleniyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Listeme Ekle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};