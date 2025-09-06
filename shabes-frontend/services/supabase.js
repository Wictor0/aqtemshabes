import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Lembre-se de criar um arquivo .env na raiz do seu projeto frontend
// com as variáveis abaixo:
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);