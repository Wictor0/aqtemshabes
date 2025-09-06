import axios from 'axios';
<<<<<<< HEAD
import { supabase } from './supabase'; // Importa o cliente Supabase do frontend

const API_URL = 'http://192.168.100.17:3000/api'; // Use seu IP local

const api = axios.create({
  baseURL: API_URL,
});

// A MÁGICA ACONTECE AQUI: Interceptor para adicionar o token
api.interceptors.request.use(
  async (config) => {
    // Pega a sessão atual do Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Se houver uma sessão, adiciona o token de acesso no cabeçalho
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- SUAS FUNÇÕES DE API ---

export const getMyProfile = () => {
  return api.get('/profile');
};

export const updateMyProfile = (profileData) => {
  return api.patch('/profile', profileData);
};

export const validateInviteCode = (inviteCode) => {
  return api.post('/validate-invite', { inviteCode });
};

// ... adicione outras funções de API aqui (getEvents, etc.)

export default api;
=======

// IMPORTANTE: Certifique-se de que este IP está correto.
const API_URL = 'http://192.168.100.17:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

// --- Funções de API ---

export const getCsrfToken = async () => {
  try {
    const response = await api.get('/auth/csrf');
    return response.data.csrfToken;
  } catch (error) {
    console.error("Erro ao obter CSRF token:", error);
    return null;
  }
};

export const login = (email, password, csrfToken) => {
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('password', password);
  params.append('csrfToken', csrfToken);
  params.append('redirect', 'false');

  return api.post('/auth/callback/credentials', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    maxRedirects: 0,
    validateStatus: function (status) {
      return status >= 200 && status < 400;
    },
  });
};

export const getSession = () => api.get('/auth/session');

export default api;
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
