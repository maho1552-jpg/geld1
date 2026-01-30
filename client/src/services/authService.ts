import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(data: {
    email: string;
    username: string;
    password: string;
    name: string;
  }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: {
    name?: string;
    bio?: string;
    avatar?: string;
    age?: string;
    birthDate?: string;
    city?: string;
    country?: string;
    school?: string;
    work?: string;
    jobTitle?: string;
    website?: string;
    isPrivate?: boolean;
    showAge?: boolean;
    showLocation?: boolean;
    showWork?: boolean;
  }) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async uploadAvatar(avatar: string) {
    const response = await api.post('/auth/upload-avatar', { avatar });
    return response.data;
  },
};