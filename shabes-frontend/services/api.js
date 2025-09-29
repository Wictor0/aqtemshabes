import axios from 'axios';
import { supabase } from './supabase';

const API_URL = 'http://192.168.100.17:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// --- Interceptor para incluir token JWT ---
api.interceptors.request.use(
  async (config) => {
    try {
      // Garante que a sessão está atualizada
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        delete config.headers.Authorization;
      }
    } catch (err) {
      console.warn("⚠️ Falha ao obter sessão do Supabase:", err);
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- Funções de API ---

export const getMyProfile = () => api.get('/profile');

export const updateMyProfile = (profileData) => api.patch('/profile', profileData);

export const createEvent = (eventData) => api.post('/events', eventData);

// Aceita filtros dinâmicos (ex.: { date: '2025-09-23' })
export const getEvents = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/events?${params}`);
};

export const getEventById = (eventId) => api.get(`/events/${eventId}`);

export const createMatch = (matchData) => api.post('/matches', matchData);

export const updateMatchStatus = (matchId, status) =>
  api.patch(`/matches/${matchId}`, { status });

export const getMatchesForGuest = (guestId) =>
  api.get(`/matches?guest_id=${guestId}`);

export const getMatchesForHost = (hostId) =>
  api.get(`/matches?host_id=${hostId}`);

export const getMyMatches = () => api.get('/matches');

export const getNotifications = () => api.get('/notifications');

export const markNotificationAsRead = (notificationId) =>
  api.patch('/notifications', { notificationId });

export const getMatchById = (matchId) => api.get(`/matches/${matchId}`);

export default api;
