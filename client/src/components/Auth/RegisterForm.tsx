import React, { useState, useEffect } from 'react';

interface RegisterFormProps {
  onRegister: (data: {
    email: string;
    username: string;
    password: string;
    name: string;
  }) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
  error: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
  loading,
  error
}) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    username: '',
    password: '',
    name: ''
  });

  const [isCheckingAvailability, setIsCheckingAvailability] = useState({
    email: false,
    username: false
  });

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email adresi gerekli';
    if (!emailRegex.test(email)) return 'Geçerli bir email adresi girin';
    return '';
  };

  // Username validation
  const validateUsername = (username: string) => {
    if (!username) return 'Kullanıcı adı gerekli';
    if (username.length < 3) return 'Kullanıcı adı en az 3 karakter olmalı';
    if (username.length > 20) return 'Kullanıcı adı en fazla 20 karakter olabilir';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Kullanıcı adı sadece harf, rakam ve _ içerebilir';
    return '';
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) return 'Şifre gerekli';
    if (password.length < 6) return 'Şifre en az 6 karakter olmalı';
    return '';
  };

  // Name validation
  const validateName = (name: string) => {
    if (!name) return 'Ad soyad gerekli';
    if (name.length < 2) return 'Ad soyad en az 2 karakter olmalı';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    let error = '';
    switch (name) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'username':
        error = validateUsername(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'name':
        error = validateName(value);
        break;
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: error
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {
      name: validateName(formData.name),
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) return;

    onRegister(formData);
  };

  const getInputClassName = (fieldName: keyof typeof fieldErrors) => {
    const baseClass = "mt-1 appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-white bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }
    
    return `${baseClass} border-gray-700 focus:ring-white`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-800/50 border border-gray-700/50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <h2 className="text-3xl font-semibold text-white">
            Geld'e katıl
          </h2>
          <p className="mt-2 text-gray-400">
            Zevk yolculuğuna başla
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Ad Soyad
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={getInputClassName('name')}
                placeholder="Adın ve soyadın"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className={getInputClassName('username')}
                placeholder="Kullanıcı adın"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={getInputClassName('email')}
                placeholder="E-posta adresin"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={getInputClassName('password')}
                placeholder="Şifren"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || Object.values(fieldErrors).some(error => error !== '')}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-700/50 text-sm font-medium rounded-xl text-white bg-gray-800/50 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kayıt olunuyor...
                </div>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400">
              Zaten hesabın var mı?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-white hover:text-gray-300 transition-colors"
              >
                Giriş yap
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};