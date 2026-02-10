import React, { useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus, UserMinus, Users, Loader, MapPin, Briefcase } from 'lucide-react';
import { friendsService, User } from '../services/friendsService';
import { UserProfileModal } from './UserProfileModal';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

type TabType = 'search' | 'suggestions' | 'following' | 'followers';

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, initialTab = 'search' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // User Profile Modal
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab(initialTab); // Modal açıldığında tab'ı ayarla
      loadInitialData();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialTab]);

  // Arama debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [suggestionsData, followingData, followersData] = await Promise.all([
        friendsService.getSuggestions(),
        friendsService.getFollowing(),
        friendsService.getFollowers()
      ]);
      
      setSuggestions(suggestionsData);
      setFollowing(followingData);
      setFollowers(followersData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await friendsService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await friendsService.followUser(userId);
      
      // State'leri güncelle
      const updateUserInList = (users: User[]) =>
        users.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: true, followersCount: user.followersCount + 1 }
            : user
        );

      setSearchResults(prev => updateUserInList(prev));
      setSuggestions(prev => updateUserInList(prev));
      setFollowers(prev => updateUserInList(prev)); // Takipçiler listesini de güncelle
      
      // Following listesini yeniden yükle
      const updatedFollowing = await friendsService.getFollowing();
      setFollowing(updatedFollowing);
    } catch (error) {
      console.error('Takip etme hatası:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await friendsService.unfollowUser(userId);
      
      // State'leri güncelle
      const updateUserInList = (users: User[]) =>
        users.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: false, followersCount: Math.max(0, user.followersCount - 1) }
            : user
        );

      setSearchResults(prev => updateUserInList(prev));
      setSuggestions(prev => updateUserInList(prev));
      setFollowers(prev => updateUserInList(prev)); // Takipçiler listesini de güncelle
      setFollowing(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Takipten çıkarma hatası:', error);
    }
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setUserProfileModalOpen(true);
  };

  const UserCard: React.FC<{ user: User; showMutualCount?: boolean }> = ({ user, showMutualCount = false }) => (
    <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/40 transition-colors">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer"
          onClick={() => handleViewProfile(user.id)}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-medium">
                {(user.name || user.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-white hover:text-blue-400 transition-colors">{user.name || user.username}</h3>
              {user.name && (
                <span className="text-sm text-gray-400">@{user.username}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              <span>{user.followersCount} takipçi</span>
              <span>{user.contentCount} içerik</span>
              {showMutualCount && user.mutualCount && (
                <span className="text-blue-400">{user.mutualCount} ortak arkadaş</span>
              )}
            </div>
            
            {(user.city || user.work) && (
              <div className="flex items-center space-x-3 mt-1">
                {user.city && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>{user.city}</span>
                  </div>
                )}
                {user.work && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Briefcase size={12} />
                    <span>{user.work}</span>
                  </div>
                )}
              </div>
            )}
            
            {user.bio && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {user.isFollowing ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnfollow(user.id);
              }}
              className="px-3 py-1.5 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-colors text-sm flex items-center space-x-1 border border-gray-600/30"
            >
              <UserMinus size={14} />
              <span>Takip Ediliyor</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFollow(user.id);
              }}
              className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm flex items-center space-x-1 border border-blue-600/30"
            >
              <UserPlus size={14} />
              <span>Takip Et</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl w-full max-w-2xl my-8 mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Arkadaşlar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800/50">
          {[
            { id: 'search', label: 'Ara', icon: Search },
            { id: 'suggestions', label: 'Öneriler', icon: Users },
            { id: 'following', label: `Takip Edilenler (${following.length})`, icon: UserPlus },
            { id: 'followers', label: `Takipçiler (${followers.length})`, icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === id
                  ? 'text-white border-b-2 border-blue-500 bg-gray-800/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/20'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Kullanıcı adı, isim veya email ile ara..."
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {isSearching ? (
                    <Loader className="animate-spin h-5 w-5 text-gray-400" />
                  ) : (
                    <Search className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {searchQuery.length >= 2 && (
                <div className="space-y-3">
                  {searchResults.length > 0 ? (
                    searchResults.map(user => (
                      <UserCard key={user.id} user={user} />
                    ))
                  ) : !isSearching ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Kullanıcı bulunamadı</p>
                    </div>
                  ) : null}
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-400">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aramak için en az 2 karakter girin</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Öneriler yükleniyor...</p>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map(user => (
                  <UserCard key={user.id} user={user} showMutualCount />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Şu anda öneri yok</p>
                  <p className="text-sm mt-2">Daha fazla kişiyi takip ederek öneriler alabilirsiniz</p>
                </div>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Takip edilenler yükleniyor...</p>
                </div>
              ) : following.length > 0 ? (
                following.map(user => (
                  <UserCard key={user.id} user={user} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Henüz kimseyi takip etmiyorsunuz</p>
                  <p className="text-sm mt-2">Arama yaparak arkadaşlarınızı bulun</p>
                </div>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Takipçiler yükleniyor...</p>
                </div>
              ) : followers.length > 0 ? (
                followers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Henüz takipçiniz yok</p>
                  <p className="text-sm mt-2">İçerik paylaşarak takipçi kazanabilirsiniz</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        userId={selectedUserId}
      />
    </div>
  );
};