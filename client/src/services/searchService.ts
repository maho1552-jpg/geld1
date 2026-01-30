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

export const searchService = {
  async searchMovies(query: string) {
    const response = await api.get(`/search/movies?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  async searchTVShows(query: string) {
    const response = await api.get(`/search/tv-shows?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  async searchMusic(query: string) {
    const response = await api.get(`/search/music?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  async searchRestaurants(query: string, location?: string) {
    const params = new URLSearchParams({ query });
    if (location) params.append('location', location);
    
    const response = await api.get(`/search/restaurants?${params.toString()}`);
    return response.data;
  },
};