import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Força o Next.js a não fazer cache dessa rota
export const dynamic = 'force-dynamic';

// ======================
// GET /api/profile
// Busca o perfil do usuário logado
// ======================
export async function GET(request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Cabeçalho de autorização faltando' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verifica quem é o usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // Busca o perfil desse usuário E seus dependentes/interesses
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        dependents (*)
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
        if (profileError.code === 'PGRST116') {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }
        throw profileError;
    }

    // Retorna o perfil
    return NextResponse.json(profile, {
        status: 200,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });

  } catch (error) {
    console.error('Erro ao buscar meu perfil:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// ======================
// PATCH /api/profile
// Atualiza o perfil do usuário logado
// ======================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const headersList = headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        // Impede que o usuário altere seu próprio status via API por segurança
        if (body.status) {
            delete body.status;
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(body)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
    }
}