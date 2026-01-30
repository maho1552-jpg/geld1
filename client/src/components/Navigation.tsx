import React, { useState } from 'react';
import { Home, User, Plus, LogOut, Sparkles, Menu, X, UserPlus } from 'lucide-react';

interface NavigationProps {
  currentPage: 'dashboard' | 'profile' | 'recommendations';
  onNavigate: (page: 'dashboard' | 'profile' | 'recommendations') => void;
  onAddContent: () => void;
  onAddFriend: () => void;
  onLogout: () => void;
  user: any;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  onAddContent,
  onAddFriend,
  onLogout,
  user
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'recommendations', label: 'Öneriler', icon: Sparkles },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-800/50 border border-gray-700/50 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-xl font-semibold text-white">
              Geld
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onAddContent}
              className="bg-gray-800/50 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center space-x-2 border border-gray-700/50"
            >
              <Plus size={16} />
              <span>Ekle</span>
            </button>
            
            <button
              onClick={onAddFriend}
              className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600/30 transition-colors flex items-center space-x-2 border border-blue-600/30"
            >
              <UserPlus size={16} />
              <span>Arkadaş</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name || user?.username}</p>
                <p className="text-xs text-gray-400">@{user?.username}</p>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Çıkış Yap"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as any);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
              
              <div className="border-t border-gray-800 pt-4 mt-4">
                <button
                  onClick={() => {
                    onAddContent();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gray-800/50 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-700/50 transition-colors flex items-center justify-center space-x-2 border border-gray-700/50 mb-2"
                >
                  <Plus size={16} />
                  <span>İçerik Ekle</span>
                </button>
                
                <button
                  onClick={() => {
                    onAddFriend();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-600/30 transition-colors flex items-center justify-center space-x-2 border border-blue-600/30"
                >
                  <UserPlus size={16} />
                  <span>Arkadaş Ekle</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className="w-full mt-2 text-gray-400 px-4 py-3 rounded-lg text-sm font-medium hover:text-white hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};