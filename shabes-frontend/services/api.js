import axios from 'axios';
import { supabase } from './supabase'; // Importa o cliente Supabase do frontend

const API_URL = 'http://192.168.100.17:3000/api'; // Use seu IP local

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token de autenticação do Supabase em cada requisição
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- FUNÇÕES DE PERFIL ---

export const getMyProfile = () => {
  return api.get('/profile');
};

export const updateMyProfile = (profileData) => {
  return api.patch('/profile', profileData);
};

export const validateInviteCode = (inviteCode) => {
  return api.post('/validate-invite', { inviteCode });
};

// --- FUNÇÕES DE EVENTOS (ADICIONADAS) ---

export const createEvent = (eventData) => {
  return api.post('/events', eventData);
};

export const getEvents = () => {
  return api.get('/events');
};

// --- FUNÇÕES DE MATCHES (ADICIONADAS) ---

export const createMatch = (matchData) => {
  return api.post('/matches', matchData);
};

export const updateMatchStatus = (matchId, status) => {
  return api.patch(`/matches/${matchId}`, { status });
};

export default api;

