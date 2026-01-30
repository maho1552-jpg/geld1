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

export const contentService = {
  // Movies
  async addMovie(data: any) {
    const response = await api.post('/content/movies', data);
    return response.data;
  },

  async getMovies() {
    const response = await api.get('/content/movies');
    return response.data;
  },

  // TV Shows
  async addTVShow(data: any) {
    const response = await api.post('/content/tv-shows', data);
    return response.data;
  },

  async getTVShows() {
    const response = await api.get('/content/tv-shows');
    return response.data;
  },

  // Music
  async addMusic(data: any) {
    const response = await api.post('/content/music', data);
    return response.data;
  },

  async getMusic() {
    const response = await api.get('/content/music');
    return response.data;
  },

  // Restaurants
  async addRestaurant(data: any) {
    const response = await api.post('/content/restaurants', data);
    return response.data;
  },

  async getRestaurants() {
    const response = await api.get('/content/restaurants');
    return response.data;
  },

  // General
  async getMyContent() {
    const response = await api.get('/content/my-content');
    return response.data;
  },

  async getStats() {
    const response = await api.get('/content/stats');
    return response.data;
  },

  async likeContent(type: string, id: string) {
    const response = await api.post(`/content/${type}/${id}/like`);
    return response.data;
  },
};