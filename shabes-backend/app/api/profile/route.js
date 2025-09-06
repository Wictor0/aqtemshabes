import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Crie um cliente Supabase aqui usando as chaves de ambiente do backend.
// Esta é a forma mais segura de interagir com o Supabase no lado do servidor.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  try {
    // 1. Pega o token do cabeçalho da requisição, enviado pelo app
    const authHeader = request.headers.get('Authorization');
    const jwt = authHeader?.split('Bearer ')[1];

    if (!jwt) {
      return NextResponse.json({ error: 'Token de autorização não encontrado' }, { status: 401 });
    }

    // 2. Valida o token e pega os dados do usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // 3. Com o usuário validado, busca o perfil correspondente na tabela 'profiles'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Se houver um erro na busca do perfil, retorna erro 500
      throw new Error(profileError.message);
    }

    // 4. Se tudo deu certo, retorna os dados do perfil
    return NextResponse.json(profile);

  } catch (error) {
    console.error('Erro no servidor:', error);
    // Retorna uma mensagem de erro genérica para o cliente
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// A função PATCH para atualizar também pode ser simplificada da mesma forma no futuro.