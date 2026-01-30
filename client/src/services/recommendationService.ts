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

export const recommendationService = {
  async analyzeTaste() {
    const response = await api.post('/recommendations/analyze-taste');
    return response.data;
  },

  async getSimilarUsers(limit = 10) {
    const response = await api.get(`/recommendations/similar-users?limit=${limit}`);
    return response.data;
  },

  // Hibrit AI önerileri (AI + Collaborative)
  async getAISuggestions(type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    const response = await api.get(`/recommendations/ai-suggestions/${type}`);
    return response.data;
  },

  // Sadece AI önerileri
  async getAIOnlySuggestions(type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    const response = await api.get(`/recommendations/ai-only/${type}`);
    return response.data;
  },

  // Sadece collaborative filtering önerileri
  async getCollaborativeSuggestions(type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    const response = await api.get(`/recommendations/collaborative/${type}`);
    return response.data;
  },

  async sendRecommendation(data: {
    toUserId: string;
    type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT';
    contentId: string;
    message?: string;
  }) {
    const response = await api.post('/recommendations/send', data);
    return response.data;
  },

  async getReceivedRecommendations() {
    const response = await api.get('/recommendations/received');
    return response.data;
  },

  async getSentRecommendations() {
    const response = await api.get('/recommendations/sent');
    return response.data;
  },
};