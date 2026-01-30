import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { AIRecommendations } from './components/AIRecommendations';
import { Navigation } from './components/Navigation';
import { AddContentModal } from './components/AddContentModal';
import { FriendsModal } from './components/FriendsModal';
import { authService } from './services/authService';
import { contentService } from './services/contentService';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'recommendations'>('dashboard');
  const [dashboardRefresh, setDashboardRefresh] = useState(0); // Dashboard'ı yenilemek için
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'movie' | 'tvshow' | 'music' | 'restaurant'>('movie');
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [friendsModalTab, setFriendsModalTab] = useState<'search' | 'suggestions' | 'following' | 'followers'>('search');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Giriş yapılırken hata oluştu');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (data: {
    email: string;
    username: string;
    password: string;
    name: string;
  }) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await authService.register(data);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Kayıt olurken hata oluştu');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleAddContent = async (data: any) => {
    try {
      switch (addModalType) {
        case 'movie':
          await contentService.addMovie(data);
          break;
        case 'tvshow':
          await contentService.addTVShow(data);
          break;
        case 'music':
          await contentService.addMusic(data);
          break;
        case 'restaurant':
          await contentService.addRestaurant(data);
          break;
      }
      
      // Dashboard verilerini yenile
      setDashboardRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('Error adding content:', error);
      alert('İçerik eklenirken hata oluştu');
    }
  };

  const openAddModal = (type?: 'movie' | 'tvshow' | 'music' | 'restaurant') => {
    if (type) {
      setAddModalType(type);
    }
    setAddModalOpen(true);
  };

  const openFriendsModal = (tab: 'search' | 'suggestions' | 'following' | 'followers' = 'search') => {
    setFriendsModalTab(tab);
    setFriendsModalOpen(true);
  };

  const handleNavigate = (page: 'dashboard' | 'profile' | 'recommendations') => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => setAuthMode('login')}
                loading={authLoading}
                error={authError}
              />
            }
          />
          <Route
            path="*"
            element={
              authMode === 'login' ? (
                <LoginForm
                  onLogin={handleLogin}
                  onSwitchToRegister={() => setAuthMode('register')}
                  loading={authLoading}
                  error={authError}
                />
              ) : (
                <Navigate to="/register" replace />
              )
            }
          />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Navigation */}
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onAddContent={() => openAddModal()}
          onAddFriend={() => openFriendsModal()}
          onLogout={handleLogout}
          user={user}
        />

        {/* Main Content */}
        <div className="pt-0">
          {currentPage === 'dashboard' && <Dashboard user={user} onAddContent={openAddModal} onNavigate={handleNavigate} refreshTrigger={dashboardRefresh} />}
          {currentPage === 'profile' && <Profile user={user} onUserUpdate={setUser} refreshTrigger={dashboardRefresh} onOpenFriends={() => openFriendsModal()} />}
          {currentPage === 'recommendations' && <AIRecommendations user={user} />}
        </div>

        {/* Add Content Modal */}
        <AddContentModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          type={addModalType}
          onAdd={handleAddContent}
        />

        {/* Friends Modal */}
        <FriendsModal
          isOpen={friendsModalOpen}
          onClose={() => setFriendsModalOpen(false)}
          initialTab={friendsModalTab}
        />
      </div>
    </Router>
  );
}

export default App;