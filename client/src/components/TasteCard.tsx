import React, { useState, useEffect, useRef } from 'react';
import { Share2, Download, X, Film, Music, MapPin, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

interface TasteCardProps {
  user: any;
  onClose: () => void;
}

export const TasteCard: React.FC<TasteCardProps> = ({ user, onClose }) => {
  const [topContent, setTopContent] = useState<any>({
    movies: [],
    music: [],
    restaurants: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopContent();
  }, []);

  const fetchTopContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // En yüksek puanlı içerikleri al
      const [moviesRes, musicRes, restaurantsRes] = await Promise.all([
        fetch(`${API_URL}/api/content/movies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/content/music`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/content/restaurants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const movies = await moviesRes.json();
      const music = await musicRes.json();
      const restaurants = await restaurantsRes.json();

      // En yüksek puanlı 5'er tanesini al
      setTopContent({
        movies: movies.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 5),
        music: music.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 5),
        restaurants: restaurants.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching top content:', error);
    }
  };

  const generateImage = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const imageData = await generateImage();
    if (!imageData) return;

    const link = document.createElement('a');
    link.download = `${user.username}-zevk-karti.png`;
    link.href = imageData;
    link.click();
  };

  const handleShare = async () => {
    const imageData = await generateImage();
    if (!imageData) return;

    // Blob'a çevir
    const blob = await (await fetch(imageData)).blob();
    const file = new File([blob], 'zevk-karti.png', { type: 'image/png' });

    // Web Share API ile paylaş
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Benim Zevk Profilim',
          text: `${user.name || user.username}'in zevk profili - Benimle zevkin uyuyor mu bak! 🎬🎵🍽️`
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback: Download
        handleDownload();
      }
    } else {
      // Fallback: Download
      handleDownload();
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(link);
    alert('Profil linki kopyalandı! 🔗');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black/50 backdrop-blur-sm border-b border-gray-800/50 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Benim Zevk Profilim</h2>
              <p className="text-sm text-gray-400">Favori içeriklerini paylaş</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Taste Card - This will be captured as image */}
        <div className="p-6">
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-purple-900 via-black to-pink-900 rounded-2xl p-8 border border-purple-500/30"
          >
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-8">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.username}
                  className="w-16 h-16 rounded-full border-2 border-purple-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-white">{user.name || user.username}</h3>
                <p className="text-purple-300">@{user.username}</p>
              </div>
            </div>

            {/* Top Movies */}
            {topContent.movies.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Film className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">En Sevdiğim Filmler</h4>
                </div>
                <div className="space-y-2">
                  {topContent.movies.map((movie: any, index: number) => (
                    <div key={movie.id} className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                      <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{movie.title}</p>
                        <p className="text-sm text-gray-400">{movie.year} • {movie.genre}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < (movie.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Music */}
            {topContent.music.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Music className="w-5 h-5 text-pink-400" />
                  <h4 className="text-lg font-semibold text-white">En Sevdiğim Şarkılar</h4>
                </div>
                <div className="space-y-2">
                  {topContent.music.map((track: any, index: number) => (
                    <div key={track.id} className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                      <span className="text-2xl font-bold text-pink-400">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{track.title}</p>
                        <p className="text-sm text-gray-400">{track.artist} • {track.genre}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < (track.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Restaurants */}
            {topContent.restaurants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">En Sevdiğim Mekanlar</h4>
                </div>
                <div className="space-y-2">
                  {topContent.restaurants.map((restaurant: any, index: number) => (
                    <div key={restaurant.id} className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                      <span className="text-2xl font-bold text-green-400">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-400">{restaurant.cuisine} • {restaurant.location}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < (restaurant.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-purple-500/30 text-center">
              <p className="text-purple-300 font-medium">Benimle zevkin uyuyor mu bak! 🎬🎵🍽️</p>
              <p className="text-sm text-gray-400 mt-2">geld.app</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-black/50 backdrop-blur-sm border-t border-gray-800/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-600/50 disabled:to-pink-600/50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/25"
            >
              <Share2 className="w-5 h-5" />
              <span>{isGenerating ? 'Hazırlanıyor...' : 'Story Paylaş'}</span>
            </button>
            
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-600/50 disabled:to-cyan-600/50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/25"
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? 'Hazırlanıyor...' : 'İndir'}</span>
            </button>
            
            <button
              onClick={copyLink}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/25"
            >
              <Share2 className="w-5 h-5" />
              <span>Link Kopyala</span>
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-4">
            Zevk kartını Instagram story'de paylaş veya arkadaşlarına gönder!
          </p>
        </div>
      </div>
    </div>
  );
};
