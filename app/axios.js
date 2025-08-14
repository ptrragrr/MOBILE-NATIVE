import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Buat instance axios
const api = axios.create({
  baseURL: 'https://clear-gnat-certainly.ngrok-free.app/api', // Ganti dengan base URL kamu
  timeout: 10000,
});

// Tambahkan interceptor untuk request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tambahkan interceptor untuk response (opsional)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Kamu bisa menangani error global di sini
    if (error.response?.status === 401) {
      // Misalnya logout otomatis atau redirect
      console.log('Unauthorized, logout user or redirect.');
    }
    return Promise.reject(error);
  }
);

export default api;
