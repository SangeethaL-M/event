import axios from 'axios';

const API_URL = 'https://event-nexus-backend-co38.onrender.com';

// Interceptor to attach token automatically with "Bearer " prefix
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;