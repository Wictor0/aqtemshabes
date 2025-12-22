import { createClient } from '@supabase/supabase-js';

// Não precisamos de dotenv em Next.js, ele carrega .env.local nativamente

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase URL ou Key não encontrados no ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);