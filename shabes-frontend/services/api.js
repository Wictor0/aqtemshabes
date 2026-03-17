import axios from 'axios';
import { supabase } from './supabase';

// IP do servidor Backend no Render
const API_URL = 'https://aqtemshabes.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
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

// --- FUNÇÕES AUXILIARES ---

const uriToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[CONVERSION-ERROR]", err);
    throw err;
  }
};

const generateUsername = (fullName) => {
  if (!fullName) return "";
  const normalized = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const parts = normalized.trim().split(/\s+/).map(p => p.replace(/[^a-z0-9]/g, ""));
  if (parts.length === 0) return "";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last}` : first;
};

// --- Interceptor de Requisição (Token) ---
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn("⚠️ Falha ao obter sessão do Supabase:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// --- FUNÇÕES DE API ---
// ==========================================

export const login = (email, password) => api.post('/auth/login', { email, password });
export const resendVerificationEmail = (email) => api.post('/auth/resend-verification', { email });

export const signUp = async (userData) => {
  let finalData = { ...userData };
  if (!finalData.metadata) finalData.metadata = {};
  const fullName = finalData.name || finalData.metadata.full_name;
  if (fullName) {
    const generated = generateUsername(fullName);
    finalData.username = generated;
    finalData.metadata.username = generated;
    finalData.metadata.full_name = fullName;
  }
  const avatarUri = finalData.image || finalData.avatar_url || (finalData.metadata && finalData.metadata.image);
  if (avatarUri && typeof avatarUri === 'string' && avatarUri.startsWith('file://')) {
    try {
      const base64Avatar = await uriToBase64(avatarUri);
      finalData.avatar_url = base64Avatar;
      finalData.metadata.avatar_url = base64Avatar;
      delete finalData.image;
    } catch (err) { console.error("[API] Erro Avatar:", err); }
  }
  const facePhotoUri = finalData.face_photo_url;
  if (facePhotoUri && typeof facePhotoUri === 'string' && facePhotoUri.startsWith('file://')) {
    try {
      const base64Face = await uriToBase64(facePhotoUri);
      finalData.face_photo_url = base64Face;
    } catch (err) { console.error("[API] Erro Foto Rosto:", err); }
  }
  return api.post('/auth/signup', finalData);
};

// --- Perfil ---
export const getMyProfile = () => api.get('/profile', noCacheConfig);
export const updateMyProfile = (profileData) => api.patch('/profile', profileData);
export const getProfileById = (userId) => api.get(`/profile/${userId}`, noCacheConfig);
export const getHostHistory = (hostId) => api.get(`/profile/${hostId}/history`, noCacheConfig);

// --- Eventos ---
export const getEvents = () => api.get('/events', noCacheConfig);
export const getEventById = (eventId) => api.get(`/events/${eventId}`, noCacheConfig);
export const createEvent = (eventData) => api.post('/events', eventData);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);
export const getEventsByHost = (hostId) => api.get(`/events?host_id=${hostId}`, noCacheConfig);

// --- Matches ---
export const createMatch = (matchData) => api.post('/matches', matchData);
export const getMatchById = (matchId) => api.get(`/matches?id=${matchId}`, noCacheConfig);
export const updateMatchStatus = (matchId, status) => api.patch(`/matches/${matchId}`, { status });

/**
 * 👇 IMPORTANTE: Certifique-se que o Backend Render inclui o push_token do convidado nesta rota 👇
 */
export const getAcceptedGuestsByEvent = (eventId) => 
  api.get(`/matches?event_id=${eventId}&status=accepted`, noCacheConfig);

export const submitRating = (matchId, rating, rating_comment) => 
  api.patch(`/matches/${matchId}`, { rating, rating_comment });

export const getMyMatches = () => api.get('/matches', noCacheConfig);
export const getMatchesForGuest = (guestId) => api.get(`/matches?guest_id=${guestId}`, noCacheConfig);
export const getMatchesForHost = (hostId) => api.get(`/matches?host_id=${hostId}`, noCacheConfig);

// --- Dependentes ---
export const getDependents = () => api.get('/dependents', noCacheConfig);
export const createDependent = (dependentData) => api.post('/dependents', dependentData);
export const updateDependent = (dependentId, dependentData) => api.patch(`/dependents/${dependentId}`, dependentData);
export const deleteDependent = (dependentId) => api.delete(`/dependents/${dependentId}`);

// --- Notificações ---
export const getNotifications = async (userId) => {
  return supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const markAllNotificationsAsRead = async (userId) => {
  return supabase
    .from('notifications')
    .update({ read: true, is_read: true }) 
    .eq('user_id', userId)
    .or('read.eq.false,is_read.eq.false');
};

/**
 * Salva uma notificação no histórico do banco de dados.
 * Suporta o mapeamento dinâmico para as colunas UUID do seu banco.
 */
export const saveInternalNotification = async (userId, title, message, type, relatedId = null) => {
  try {
    const payload = {
      user_id: userId,
      title: title,
      message: message,
      type: type,
      read: false,    
      is_read: false  
    };

    if (relatedId) {
      // Diferencia entre IDs de pedidos e IDs de eventos gerais
      if (type.includes('match')) {
        payload.match_id = relatedId;
      } else {
        payload.event_id = relatedId;
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select(); // Adicionado select para debug se necessário

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[API_ERROR] Falha ao salvar notificação:", err);
  }
};

export default api;