import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Star, Loader } from 'lucide-react';
import { searchService } from '../services/searchService';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'movie' | 'tvshow' | 'music' | 'restaurant';
  onAdd: (data: any) => Promise<void>;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  type,
  onAdd
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Manual form data
  const [manualData, setManualData] = useState({
    title: '',
    year: '',
    director: '',
    artist: '',
    album: '',
    name: '',
    cuisine: '',
    location: '',
    address: '',
    priceRange: '',
    seasons: '',
    status: 'completed',
    type: 'restaurant',
    genre: '',
  });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      let results = [];
      
      switch (type) {
        case 'movie':
          results = await searchService.searchMovies(query);
          break;
        case 'tvshow':
          results = await searchService.searchTVShows(query);
          break;
        case 'music':
          results = await searchService.searchMusic(query);
          break;
        case 'restaurant':
          results = await searchService.searchRestaurants(query);
          break;
      }
      
      setSearchResults(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update manual data title as well
    setManualData(prev => ({
      ...prev,
      [type === 'restaurant' ? 'name' : 'title']: value
    }));
  };

  const handleSelectSuggestion = (item: any) => {
    setSelectedItem(item);
    setSearchQuery(item.title || item.name);
    setShowSuggestions(false);
    
    // Fill manual data with selected item
    if (type === 'movie') {
      setManualData(prev => ({
        ...prev,
        title: item.title,
        year: item.year?.toString() || '',
        director: item.director || '',
        genre: Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || ''),
      }));
    } else if (type === 'tvshow') {
      setManualData(prev => ({
        ...prev,
        title: item.title,
        year: item.year?.toString() || '',
        seasons: item.seasons?.toString() || '',
        genre: Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || ''),
      }));
    } else if (type === 'music') {
      setManualData(prev => ({
        ...prev,
        title: item.title,
        artist: item.artist || '',
        album: item.album || '',
        year: item.year?.toString() || '',
        genre: Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || ''),
      }));
    } else if (type === 'restaurant') {
      setManualData(prev => ({
        ...prev,
        name: item.name,
        cuisine: item.cuisine || '',
        location: item.location || '',
        address: item.address || '',
        priceRange: item.priceRange || '',
        type: item.type || 'restaurant',
      }));
    }
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setManualData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...manualData,
        rating: rating || null,
        review: review || null,
        // Add selected item data if available
        ...(selectedItem && {
          tmdbId: selectedItem.tmdbId,
          spotifyId: selectedItem.spotifyId,
          googlePlaceId: selectedItem.googlePlaceId,
          poster: selectedItem.poster,
          cover: selectedItem.cover,
          photo: selectedItem.photo,
          duration: selectedItem.duration,
          phone: selectedItem.phone,
          website: selectedItem.website,
          popularity: selectedItem.popularity
        })
      };
      
      await onAdd(submitData);
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding content:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setShowSuggestions(false);
    setRating(0);
    setReview('');
    setManualData({
      title: '',
      year: '',
      director: '',
      artist: '',
      album: '',
      name: '',
      cuisine: '',
      location: '',
      address: '',
      priceRange: '',
      seasons: '',
      status: 'completed',
      type: 'restaurant',
      genre: '',
    });
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'movie': return 'Film Ekle';
      case 'tvshow': return 'Dizi Ekle';
      case 'music': return 'Müzik Ekle';
      case 'restaurant': return 'Mekan Ekle';
      default: return 'İçerik Ekle';
    }
  };

  const getSearchPlaceholder = () => {
    switch (type) {
      case 'movie': return 'Film adı yazın...';
      case 'tvshow': return 'Dizi adı yazın...';
      case 'music': return 'Şarkı veya sanatçı adı yazın...';
      case 'restaurant': return 'Restoran, cafe, bar adı yazın...';
      default: return 'Ara...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl w-full max-w-md my-8 mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-800/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6">
          <form id="content-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Search Input with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {type === 'restaurant' ? 'Mekan Adı' : type === 'music' ? 'Şarkı/Sanatçı Adı' : 'Başlık'}
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-3 pr-12 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                placeholder={getSearchPlaceholder()}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                {isSearching ? (
                  <Loader className="animate-spin h-5 w-5 text-gray-400" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((item: any, index) => (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      handleSelectSuggestion(item);
                    }}
                    className="p-4 hover:bg-gray-800/60 cursor-pointer border-b border-gray-700/50 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {(item.poster || item.cover || item.photo) && (
                        <img
                          src={item.poster || item.cover || item.photo}
                          alt={item.title || item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-800/30"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {item.title || item.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {type === 'movie' && `${item.year || ''} ${item.genre && Array.isArray(item.genre) ? '• ' + item.genre.slice(0, 2).join(', ') : ''}`}
                          {type === 'tvshow' && `${item.year || ''} ${item.seasons ? '• ' + item.seasons + ' sezon' : ''}`}
                          {type === 'music' && `${item.artist || ''} ${item.album ? '• ' + item.album : ''} ${item.year ? '• ' + item.year : ''}`}
                          {type === 'restaurant' && `${item.cuisine || ''} ${item.location ? '• ' + item.location : ''} ${item.rating ? '• ⭐ ' + item.rating : ''}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Fields Based on Type */}
          {type === 'movie' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yönetmen</label>
                <input
                  type="text"
                  name="director"
                  value={manualData.director}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yıl</label>
                <input
                  type="number"
                  name="year"
                  value={manualData.year}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
            </>
          )}

          {type === 'tvshow' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sezon Sayısı</label>
                <input
                  type="number"
                  name="seasons"
                  value={manualData.seasons}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Durum</label>
                <select
                  name="status"
                  value={manualData.status}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="completed" className="bg-gray-800">Tamamlandı</option>
                  <option value="watching" className="bg-gray-800">İzleniyor</option>
                  <option value="dropped" className="bg-gray-800">Bırakıldı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yıl</label>
                <input
                  type="number"
                  name="year"
                  value={manualData.year}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
            </>
          )}

          {type === 'music' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sanatçı</label>
                <input
                  type="text"
                  name="artist"
                  value={manualData.artist}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Album</label>
                <input
                  type="text"
                  name="album"
                  value={manualData.album}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
            </>
          )}

          {type === 'restaurant' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tür</label>
                <select
                  name="type"
                  value={manualData.type}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="restaurant" className="bg-gray-800">Restoran</option>
                  <option value="cafe" className="bg-gray-800">Kafe</option>
                  <option value="bar" className="bg-gray-800">Bar</option>
                  <option value="pub" className="bg-gray-800">Pub</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mutfak Türü</label>
                <input
                  type="text"
                  name="cuisine"
                  value={manualData.cuisine}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="İtalyan, Türk, Çin..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Konum</label>
                <input
                  type="text"
                  name="location"
                  value={manualData.location}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="Şehir, İlçe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adres</label>
                <input
                  type="text"
                  name="address"
                  value={manualData.address}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="Detaylı adres (opsiyonel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fiyat Aralığı</label>
                <select
                  name="priceRange"
                  value={manualData.priceRange}
                  onChange={handleManualInputChange}
                  className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white backdrop-blur-sm"
                >
                  <option value="" className="bg-gray-800">Seçiniz</option>
                  <option value="$" className="bg-gray-800">$ - Ekonomik</option>
                  <option value="$$" className="bg-gray-800">$$ - Orta</option>
                  <option value="$$$" className="bg-gray-800">$$$ - Pahalı</option>
                  <option value="$$$$" className="bg-gray-800">$$$$ - Lüks</option>
                </select>
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tür/Kategori</label>
            <input
              type="text"
              name="genre"
              value={manualData.genre}
              onChange={handleManualInputChange}
              className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
              placeholder="Aksiyon, Komedi, Rock... (virgülle ayırın)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Puanın</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${
                    rating >= star ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <Star size={20} fill="currentColor" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-400">
                {rating > 0 ? `${rating}/5` : 'Puan ver'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Yorumun</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm resize-none"
              placeholder="Bu içerik hakkında ne düşünüyorsun?"
            />
          </div>
        </form>
      </div>
        
        {/* Footer Buttons */}
        <div className="flex space-x-3 p-6 border-t border-gray-800/50 bg-gray-900/40">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800/30 border border-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700/30 transition-all duration-300 backdrop-blur-sm"
            disabled={isSubmitting}
          >
            İptal
          </button>
          <button
            type="submit"
            form="content-form"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-gray-800/25 border border-gray-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ekleniyor...
              </div>
            ) : (
              'Ekle'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};