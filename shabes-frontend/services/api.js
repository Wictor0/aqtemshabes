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

/**
 * Converte um URI local (file://) em string Base64 real para envio
 */
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

/**
 * Gera um username automático baseado no primeiro e último nome com ESPAÇO
 */
const generateUsername = (fullName) => {
  if (!fullName) return "";
  
  const normalized = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  
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

/**
 * Cadastro Robusto: Garante que restrições e organização sejam enviadas de forma clara
 */
export const signUp = async (userData) => {
  // Criamos uma cópia limpa para manipular
  let finalData = { ...userData };
  
  // Garantimos que o objeto metadata existe
  if (!finalData.metadata) finalData.metadata = {};

  // 1. Username
  const fullName = finalData.name || finalData.metadata.full_name;
  if (fullName) {
    const generated = generateUsername(fullName);
    finalData.username = generated;
    finalData.metadata.username = generated;
    finalData.metadata.full_name = fullName;
  }

  // 2. Sincronização explícita para o metadata (usado pelo Trigger SQL)
  // Certificamos que os campos estão tanto na raiz quanto no metadata para o backend ler
  finalData.metadata.dietaryRestrictions = finalData.dietaryRestrictions || "";
  finalData.metadata.validatorOrganization = finalData.validatorOrganization || "Qualquer";
  finalData.metadata.birth_date = finalData.birth_date || null;
  finalData.metadata.phone = finalData.phone || "";
  finalData.metadata.invite_code = finalData.inviteCode || "";

  // 3. Processamento de Imagem
  const imageUri = finalData.image || finalData.metadata.image;
  if (imageUri && typeof imageUri === 'string' && imageUri.startsWith('file://')) {
    try {
      console.log("[API] Convertendo imagem para Base64...");
      const base64Image = await uriToBase64(imageUri);
      finalData.avatar_url = base64Image;
      finalData.metadata.avatar_url = base64Image;
      delete finalData.image;
    } catch (err) {
      console.error("[API] Falha ao processar imagem:", err);
    }
  }

  console.log("[API] Enviando cadastro para o Render...");

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

// --- Matches ---
export const createMatch = (matchData) => api.post('/matches', matchData);
export const getMatchById = (matchId) => api.get(`/matches?id=${matchId}`, noCacheConfig);
export const updateMatchStatus = (matchId, status) => api.patch(`/matches/${matchId}`, { status });
export const getMatchesForGuest = (guestId) => api.get(`/matches?guest_id=${guestId}`, noCacheConfig);
export const getMatchesForHost = (hostId) => api.get(`/matches?host_id=${hostId}`, noCacheConfig);

// --- Dependentes ---
export const getDependents = () => api.get('/dependents', noCacheConfig);

export default api;