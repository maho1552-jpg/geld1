import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Briefcase, GraduationCap, Calendar, Globe, Eye, Camera, Upload } from 'lucide-react';
import { authService } from '../services/authService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (updatedUser: any) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    age: '',
    birthDate: '',
    city: '',
    country: '',
    school: '',
    work: '',
    jobTitle: '',
    website: '',
    isPrivate: false,
    showAge: true,
    showLocation: true,
    showWork: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'personal' | 'privacy'>('basic');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        age: user.age?.toString() || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        city: user.city || '',
        country: user.country || '',
        school: user.school || '',
        work: user.work || '',
        jobTitle: user.jobTitle || '',
        website: user.website || '',
        isPrivate: user.isPrivate || false,
        showAge: user.showAge ?? true,
        showLocation: user.showLocation ?? true,
        showWork: user.showWork ?? true,
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user, isOpen]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, avatar: url }));
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await authService.updateProfile(formData);
      onUpdate(response.user);
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profil güncellenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderBasicInfo = () => (
    <div className="space-y-5">
      {/* Avatar Section */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full flex items-center justify-center border border-gray-600 overflow-hidden">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={() => setAvatarPreview('')}
              />
            ) : (
              <User className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-2 border border-gray-600">
            <Camera className="w-4 h-4 text-gray-300" />
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">Profil fotoğrafı</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Upload className="inline w-4 h-4 mr-1" />
          Avatar URL
        </label>
        <input
          type="url"
          name="avatar"
          value={formData.avatar}
          onChange={handleAvatarChange}
          className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <User className="inline w-4 h-4 mr-1" />
          Ad Soyad
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
          placeholder="Adınız ve soyadınız"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm resize-none"
          placeholder="Kendiniz hakkında kısa bir açıklama..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Globe className="inline w-4 h-4 mr-1" />
          Website
        </label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
          placeholder="https://website.com"
        />
      </div>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Yaş
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            min="13"
            max="120"
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="25"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Doğum Tarihi
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Şehir
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="İstanbul"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ülke
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="Türkiye"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-1" />
          Okul/Üniversite
        </label>
        <input
          type="text"
          name="school"
          value={formData.school}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
          placeholder="İstanbul Üniversitesi"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Briefcase className="inline w-4 h-4 mr-1" />
            Şirket
          </label>
          <input
            type="text"
            name="work"
            value={formData.work}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="ABC Şirketi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pozisyon
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
            placeholder="Yazılım Geliştirici"
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/20 rounded-xl p-4 border border-gray-700/30">
        <h4 className="text-lg font-medium text-white mb-4">Profil Gizliliği</h4>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="isPrivate"
            checked={formData.isPrivate}
            onChange={handleInputChange}
            className="w-5 h-5 bg-gray-800/30 border border-gray-700/50 rounded focus:ring-2 focus:ring-gray-600"
          />
          <div>
            <span className="text-white font-medium">Özel Profil</span>
            <p className="text-sm text-gray-400">Profilinizi sadece takipçileriniz görebilir</p>
          </div>
        </label>
      </div>

      <div className="bg-gray-800/20 rounded-xl p-4 border border-gray-700/30">
        <h4 className="text-lg font-medium text-white mb-4">Görünürlük Ayarları</h4>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-white">Yaşımı Göster</span>
                <p className="text-sm text-gray-400">Diğer kullanıcılar yaşınızı görebilir</p>
              </div>
            </div>
            <input
              type="checkbox"
              name="showAge"
              checked={formData.showAge}
              onChange={handleInputChange}
              className="w-5 h-5 bg-gray-800/30 border border-gray-700/50 rounded focus:ring-2 focus:ring-gray-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-white">Konumumu Göster</span>
                <p className="text-sm text-gray-400">Şehir ve ülke bilgileriniz görünür</p>
              </div>
            </div>
            <input
              type="checkbox"
              name="showLocation"
              checked={formData.showLocation}
              onChange={handleInputChange}
              className="w-5 h-5 bg-gray-800/30 border border-gray-700/50 rounded focus:ring-2 focus:ring-gray-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-white">İş Bilgilerimi Göster</span>
                <p className="text-sm text-gray-400">Şirket ve pozisyon bilgileriniz görünür</p>
              </div>
            </div>
            <input
              type="checkbox"
              name="showWork"
              checked={formData.showWork}
              onChange={handleInputChange}
              className="w-5 h-5 bg-gray-800/30 border border-gray-700/50 rounded focus:ring-2 focus:ring-gray-600"
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl w-full max-w-2xl my-8 mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Profili Düzenle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-800/20 rounded-xl p-1">
            {[
              { id: 'basic', label: 'Temel Bilgiler', icon: User },
              { id: 'personal', label: 'Kişisel Bilgiler', icon: Calendar },
              { id: 'privacy', label: 'Gizlilik', icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gray-800/50 text-white border border-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/20'
                }`}
              >
                <tab.icon size={16} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'privacy' && renderPrivacySettings()}
          </div>

          {/* Footer */}
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-gray-800/25 border border-gray-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </div>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};