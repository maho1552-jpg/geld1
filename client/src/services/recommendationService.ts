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
    console.log('=== API CALL: analyzeTaste ===');
    const response = await api.post('/recommendations/analyze-taste');
    console.log('analyzeTaste response:', response.data);
    return response.data;
  },

  async getSimilarUsers(limit = 10) {
    console.log('=== API CALL: getSimilarUsers ===');
    const response = await api.get(`/recommendations/similar-users?limit=${limit}`);
    console.log('getSimilarUsers response:', response.data);
    return response.data;
  },

  // Hibrit AI önerileri (AI + Collaborative)
  async getAISuggestions(type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    console.log('=== API CALL: getAISuggestions ===', type);
    const response = await api.get(`/recommendations/ai-suggestions/${type}`);
    console.log('getAISuggestions response:', response.data);
    return response.data;
  },

  // Sadece AI önerileri
  async getAIOnlySuggestions(type: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'RESTAURANT') {
    console.log('=== API CALL: getAIOnlySuggestions ===', type);
    const response = await api.get(`/recommendations/ai-only/${type}`);
    console.log('getAIOnlySuggestions response:', response.data);
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