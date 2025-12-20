import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const getSupabaseClient = (authHeader) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
    );
};

// ======================
// GET /api/dependents
// Busca os dependentes do utilizador autenticado.
// ======================
export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseClient(authHeader);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('dependents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar dependentes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ======================
// POST /api/dependents
// Cria um novo dependente para o utilizador autenticado.
// ======================
export async function POST(request) {
    const dependentData = await request.json();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const dataToInsert = {
        ...dependentData,
        user_id: user.id,
    };

    try {
        const { data, error } = await supabase.from('dependents').insert(dataToInsert).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error("Erro ao criar dependente:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

