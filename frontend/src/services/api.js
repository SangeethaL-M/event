import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'
  : 'https://event-nexus-backend-co38.onrender.com';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Interceptor to attach token automatically with "Bearer " prefix
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;