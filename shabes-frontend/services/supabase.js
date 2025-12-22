import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// =================================================================
// ⚠️ CONFIGURAÇÃO DO NOVO PROJETO SUPABASE ⚠️
// Copie e cole os dados de: Project Settings > API
// =================================================================

// 1. Cole a "Project URL" aqui:
const supabaseUrl = 'https://cafuulfswdjcpenmdutn.supabase.co'; 

// 2. Cole a chave "anon" / "public" aqui:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZnV1bGZzd2RqY3Blbm1kdXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNjYyNDgsImV4cCI6MjA4MTg0MjI0OH0.JeM3eOTQcTV1SfhNyuw9qVPyT5vtC-d9UZPCt0JOKdo';

// =================================================================

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});