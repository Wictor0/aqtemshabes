// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Pega a URL e a chave do Supabase a partir das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Cria e exporta o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;