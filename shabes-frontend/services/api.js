import axios from 'axios';
import { supabase } from './supabase'; // Importa o cliente Supabase do frontend

const API_URL = 'http://192.168.100.17:3000/api'; // Use seu IP local

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token de autenticação do Supabase em cada requisição
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
