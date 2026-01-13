import axios from 'axios';
import { supabase } from './supabase';

// IP do Emulador Android (10.0.2.2)
// Se usar dispositivo físico, troque pelo seu IP (ex: http://192.168.100.194:3000/api)
const API_URL = 'https://aqtemshabes.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 segundos de tolerância
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Configuração Anti-Cache ---
const noCacheConfig = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

// --- Interceptor de Requisição (Token) ---
api.interceptors.request.use(
  async (config) => {
    try {
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

// --- Interceptor de Resposta (Debug de Erros) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error("⏱️ TIMEOUT: O servidor demorou mais de 30s para responder.");
    } else if (error.message === 'Network Error') {
      console.error("📡 ERRO DE REDE: Verifique se o IP do backend está correto e o servidor rodando.");
    }
    return Promise.reject(error);
  }
);

// --- Helper de Cache Busting ---
const cacheBust = (url) => {
  const connector = url.includes('?') ? '&' : '?';
  return `${url}${connector}_t=${new Date().getTime()}`;
};

// ==========================================
// --- FUNÇÕES DE API ---
// ==========================================

export const signUp = (userData) => api.post('/auth/signup', userData);

// --- Funções de Perfil ---
export const getMyProfile = () => api.get(cacheBust('/profile'), noCacheConfig);
export const getProfileById = (userId) => api.get(cacheBust(`/profile/${userId}`), noCacheConfig);
export const updateMyProfile = (profileData) => api.patch('/profile', profileData);
export const getHostHistory = (hostId) => api.get(cacheBust(`/profile/${hostId}/history`), noCacheConfig);

// --- Funções de Dependentes ---
export const getDependents = () => api.get(cacheBust('/dependents'), noCacheConfig);
export const createDependent = (dependentData) => api.post('/dependents', dependentData);
export const updateDependent = (id, data) => api.patch(`/dependents/${id}`, data);
export const deleteDependent = (id) => api.delete(`/dependents/${id}`);

// --- Funções de Eventos ---
export const createEvent = (eventData) => api.post('/events', eventData);

export const getEvents = (filters = {}) => {
  // 🔥 CORREÇÃO DE SEGURANÇA DE DATA (30 DIAS):
  // Busca eventos recentes para garantir que apareçam mesmo com diferença de fuso
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - 30); 
  
  const queryParams = {
    from_date: dateFilter.toISOString()
  };
  
  const params = new URLSearchParams(queryParams).toString();
  
  return api.get(cacheBust(`/events?${params}`), noCacheConfig);
};

export const getEventById = (eventId) => api.get(cacheBust(`/events/${eventId}`), noCacheConfig);

// --- Funções de Matches ---
export const createMatch = (matchData) => api.post('/matches', matchData);

export const updateMatchStatus = (matchId, status) => 
  api.patch(`/matches/${matchId}`, { status });

export const getMatchesForGuest = (guestId) => 
  api.get(cacheBust(`/matches?guest_id=${guestId}`), noCacheConfig);

export const getMatchesForHost = (hostId) => 
  api.get(cacheBust(`/matches?host_id=${hostId}`), noCacheConfig);

export const getMyMatches = () => api.get(cacheBust('/matches'), noCacheConfig);

export const getMatchById = (matchId) => api.get(cacheBust(`/matches?id=${matchId}`), noCacheConfig);

// --- Funções de Avaliações ---
export const submitRating = (matchId, rating, rating_comment) => 
  api.patch(`/matches/${matchId}`, { rating, rating_comment });

// --- Funções de Notificações ---
export const getNotifications = () => api.get(cacheBust('/notifications'), noCacheConfig);

export const markNotificationAsRead = (notificationId) => 
  api.patch('/notifications', { notificationId });

export default api;