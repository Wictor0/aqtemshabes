import axios from 'axios';
import { supabase } from './supabase'; 

const API_URL = 'http://192.168.100.17:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

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

// --- Funções de API ---

export const getMyProfile = () => {
  return api.get('/profile');
};

export const updateMyProfile = (profileData) => {
  return api.patch('/profile', profileData);
};

export const createEvent = (eventData) => {
    return api.post('/events', eventData);
};

export const getEvents = () => {
    return api.get('/events');
};

export const getEventById = (eventId) => {
  return api.get(`/events/${eventId}`);
};

export const createMatch = (matchData) => {
  return api.post('/matches', matchData);
};

export const updateMatchStatus = (matchId, status) => {
  return api.patch(`/matches/${matchId}`, { status });
};

// --- FUNÇÕES DE BUSCA CORRIGIDAS E EXPLÍCITAS ---
export const getMatchesForGuest = (guestId) => {
  return api.get(`/matches?guest_id=${guestId}`);
};

export const getMatchesForHost = (hostId) => {
  return api.get(`/matches?host_id=${hostId}`);
};

export default api;

