import React, { useState, useEffect } from 'react';
import { X, MapPin, Briefcase, Calendar, Globe, UserPlus, UserMinus, Loader, MapPin as Restaurant, Star, Clapperboard, Monitor, Headphones } from 'lucide-react';
import { friendsService, User } from '../services/friendsService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserContent {
  movies: any[];
  tvShows: any[];
  music: any[];
  restaurants: any[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userContent, setUserContent] = useState<UserContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'tvshows' | 'music' | 'restaurants'>('overview');

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadUserProfile();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const [userData, contentData] = await Promise.all([
        friendsService.getUserProfile(userId),
        friendsService.getUserContent(userId).catch(() => null) // İçerik yüklenemezse null döndür
      ]);
      
      console.log('Loaded user data:', userData);
      setUser(userData);
      setUserContent(contentData);
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    setIsFollowLoading(true);
    try {
      if (user.isFollowing) {
        await friendsService.unfollowUser(user.id);
        
        // Eğer profil gizli ise içeriği temizle
        if (user.isPrivate) {
          setUserContent(null);
        }
      } else {
        await friendsService.followUser(user.id);
        
        // Takip ettikten sonra içeriği yükle
        if (user.isPrivate) {
          try {
            const contentData = await friendsService.getUserContent(userId);
            setUserContent(contentData);
          } catch (error) {
            console.error('İçerik yükleme hatası:', error);
          }
        }
      }
      
      // Takip işlemi sonrasında profil verilerini yeniden yükle
      const updatedUserData = await friendsService.getUserProfile(userId);
      setUser(updatedUserData);
      console.log('Updated user data:', updatedUserData);
      
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl w-full max-w-4xl my-8 mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800/50">
          <h2 className="text-xl font-bold text-white">
            Kullanıcı Profili
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">Profil yükleniyor...</p>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {(user.name || user.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-1">
                  {user.name || user.username}
                </h3>
                
                {user.name && (
                  <p className="text-gray-400 mb-2">@{user.username}</p>
                )}
                
                {user.bio && (
                  <p className="text-gray-300 text-sm mb-4 max-w-sm mx-auto">
                    {user.bio}
                  </p>
                )}

                {/* Follow Button */}
                {!user.isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 mx-auto ${
                      user.isFollowing
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
                        : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                    } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowLoading ? (
                      <Loader className="animate-spin h-4 w-4" />
                    ) : user.isFollowing ? (
                      <>
                        <UserMinus size={16} />
                        <span>Arkadaş</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Takip Et</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{user.followersCount}</div>
                  <div className="text-sm text-gray-400">Takipçi</div>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{user.followingCount}</div>
                  <div className="text-sm text-gray-400">Takip</div>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{user.contentCount}</div>
                  <div className="text-sm text-gray-400">İçerik</div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-3">
                {user.city && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{user.city}{user.country && `, ${user.country}`}</span>
                  </div>
                )}
                
                {user.work && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Briefcase size={16} className="text-gray-400" />
                    <span>{user.work}{user.school && ` • ${user.school}`}</span>
                  </div>
                )}
                
                {user.website && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Globe size={16} className="text-gray-400" />
                    <a 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {user.website}
                    </a>
                  </div>
                )}
                
                {user.age && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{user.age} yaşında</span>
                  </div>
                )}
              </div>

              {/* Mutual Friends */}
              {user.isFollower && (
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <UserPlus size={16} />
                    <span className="text-sm font-medium">Bu kişi sizi takip ediyor</span>
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              {user.isPrivate && !user.isFollowing && !user.isOwnProfile && (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="text-center text-gray-400">
                    <div className="text-sm">🔒 Bu hesap gizli</div>
                    <div className="text-xs mt-1">İçerikleri görmek için takip etmeniz gerekiyor</div>
                  </div>
                </div>
              )}

              {/* Content Tabs - Only show if user can see content */}
              {(!user.isPrivate || user.isFollowing || user.isOwnProfile) && userContent && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-800/50 -mx-6 px-6">
                    {[
                      { id: 'overview', label: 'Genel', icon: null },
                      { id: 'movies', label: `Filmler (${userContent.movies.length})`, icon: Clapperboard },
                      { id: 'tvshows', label: `Diziler (${userContent.tvShows.length})`, icon: Monitor },
                      { id: 'music', label: `Müzik (${userContent.music.length})`, icon: Headphones },
                      { id: 'restaurants', label: `Mekanlar (${userContent.restaurants.length})`, icon: Restaurant }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center space-x-1 ${
                          activeTab === id
                            ? 'text-white border-b-2 border-blue-500 bg-gray-800/30'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/20'
                        }`}
                      >
                        {Icon && <Icon size={14} />}
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{id === 'overview' ? 'Genel' : userContent[id as keyof UserContent]?.length || 0}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 rounded-xl p-4">
                          <div className="text-lg font-bold text-white">{userContent.movies.length}</div>
                          <div className="text-sm text-gray-400">Film</div>
                        </div>
                        <div className="bg-gray-800/30 rounded-xl p-4">
                          <div className="text-lg font-bold text-white">{userContent.tvShows.length}</div>
                          <div className="text-sm text-gray-400">Dizi</div>
                        </div>
                        <div className="bg-gray-800/30 rounded-xl p-4">
                          <div className="text-lg font-bold text-white">{userContent.music.length}</div>
                          <div className="text-sm text-gray-400">Müzik</div>
                        </div>
                        <div className="bg-gray-800/30 rounded-xl p-4">
                          <div className="text-lg font-bold text-white">{userContent.restaurants.length}</div>
                          <div className="text-sm text-gray-400">Mekan</div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'movies' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {userContent.movies.length > 0 ? (
                          userContent.movies.map((movie, index) => (
                            <div key={index} className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-white">{movie.title}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                                    {movie.year && <span>{movie.year}</span>}
                                    {movie.director && <span>• {movie.director}</span>}
                                    {movie.genre && <span>• {movie.genre}</span>}
                                  </div>
                                </div>
                                {movie.rating && (
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm">{movie.rating}</span>
                                  </div>
                                )}
                              </div>
                              {movie.review && (
                                <p className="text-sm text-gray-300 mt-2">{movie.review}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Clapperboard size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Henüz film eklenmemiş</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'tvshows' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {userContent.tvShows.length > 0 ? (
                          userContent.tvShows.map((show, index) => (
                            <div key={index} className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-white">{show.title}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                                    {show.year && <span>{show.year}</span>}
                                    {show.seasons && <span>• {show.seasons} sezon</span>}
                                    {show.status && <span>• {show.status}</span>}
                                    {show.genre && <span>• {show.genre}</span>}
                                  </div>
                                </div>
                                {show.rating && (
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm">{show.rating}</span>
                                  </div>
                                )}
                              </div>
                              {show.review && (
                                <p className="text-sm text-gray-300 mt-2">{show.review}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Henüz dizi eklenmemiş</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'music' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {userContent.music.length > 0 ? (
                          userContent.music.map((song, index) => (
                            <div key={index} className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-white">{song.title}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                                    {song.artist && <span>{song.artist}</span>}
                                    {song.album && <span>• {song.album}</span>}
                                    {song.year && <span>• {song.year}</span>}
                                    {song.genre && <span>• {song.genre}</span>}
                                  </div>
                                </div>
                                {song.rating && (
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm">{song.rating}</span>
                                  </div>
                                )}
                              </div>
                              {song.review && (
                                <p className="text-sm text-gray-300 mt-2">{song.review}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Headphones size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Henüz müzik eklenmemiş</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'restaurants' && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {userContent.restaurants.length > 0 ? (
                          userContent.restaurants.map((restaurant, index) => (
                            <div key={index} className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-white">{restaurant.name}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                                    {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                                    {restaurant.location && <span>• {restaurant.location}</span>}
                                    {restaurant.type && <span>• {restaurant.type}</span>}
                                    {restaurant.priceRange && <span>• {restaurant.priceRange}</span>}
                                  </div>
                                </div>
                                {restaurant.rating && (
                                  <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm">{restaurant.rating}</span>
                                  </div>
                                )}
                              </div>
                              {restaurant.review && (
                                <p className="text-sm text-gray-300 mt-2">{restaurant.review}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Restaurant size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Henüz mekan eklenmemiş</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Kullanıcı profili yüklenemedi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};