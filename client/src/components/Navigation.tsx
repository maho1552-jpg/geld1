import React, { useState } from 'react';
import { User, LogOut, Sparkles, Menu, X, UserPlus } from 'lucide-react';

interface NavigationProps {
  currentPage: 'dashboard' | 'profile' | 'recommendations' | 'friends';
  onNavigate: (page: 'dashboard' | 'profile' | 'recommendations' | 'friends') => void;
  onAddContent: () => void;
  onAddFriend: () => void;
  onLogout: () => void;
  user: any;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  user
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { id: 'recommendations', label: 'Öneriler', icon: Sparkles },
    { id: 'friends', label: 'Arkadaşlar', icon: UserPlus },
  ];

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Clickable */}
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gray-800/50 border border-gray-700/50 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-xl font-semibold text-white">
              Geld
            </h1>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  console.log('Navigating to:', item.id);
                  onNavigate(item.id as 'dashboard' | 'profile' | 'recommendations' | 'friends');
                }}
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
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => onNavigate('profile')}
                className="text-right hover:bg-gray-900 px-3 py-2 rounded-lg transition-colors"
              >
                <p className="text-sm font-medium text-white">{user?.name || user?.username}</p>
                <p className="text-xs text-gray-400">@{user?.username}</p>
              </button>
              
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
                    onNavigate(item.id as 'dashboard' | 'profile' | 'recommendations' | 'friends');
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
                    onNavigate('profile');
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-gray-400 px-4 py-3 rounded-lg text-sm font-medium hover:text-white hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                >
                  <User size={16} />
                  <span>Profil</span>
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