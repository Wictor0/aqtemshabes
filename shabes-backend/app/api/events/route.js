import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST: Criação de evento (Mantém Autenticação do Usuário para segurança)
export async function POST(request) {
  const eventData = await request.json();
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Cabeçalho de autorização em falta' }, { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não autorizado' }, { status: 401 });
  }
  const dataToInsert = { ...eventData, host_id: user.id };
  try {
    const { data, error } = await supabase.from('events').insert(dataToInsert).select().single();
    if (error) {
      console.error('Erro do Supabase ao criar evento:', error);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no servidor:', e);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

// GET: Listagem de eventos (Usa Service Role para contar vagas e evitar erro 500)
export async function GET(request) {
  // Usamos a Service Role Key para ter acesso total de leitura ao banco.
  // Isso é necessário para ler a tabela 'matches' de todos os eventos e calcular a lotação,
  // sem ser bloqueado pelas regras de segurança (RLS) que restringem a visão de usuários comuns.
  // Os dados sensíveis são removidos antes de retornar a resposta.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
    
  const { searchParams } = request.nextUrl;
  const from_date = searchParams.get('from_date');
    
  // Simplifiquei a relação para 'host:profiles' para evitar erros de nome de constraint
  let query = supabase.from('events').select(`
      *,
      host:profiles (
        id,
        full_name,
        avatar_url,
        username,
        role 
      ),
      matches (
        status,
        dependent_ids
      )
    `);

  if (from_date) {
    query = query.gte('date', from_date);
  }

  const { data: events, error } = await query.order('date', { ascending: true });

  if (error) {
      console.error("Erro detalhado ao buscar eventos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lógica de Contagem e Filtragem (JavaScript)
  const availableEvents = events.map(event => {
    // Calcula ocupação
    const occupiedCount = event.matches.reduce((total, match) => {
        if (match.status === 'accepted') {
            // Conta o convidado (1) + número de dependentes
            const dependentsCount = Array.isArray(match.dependent_ids) ? match.dependent_ids.length : 0;
            return total + 1 + dependentsCount;
        }
        return total;
    }, 0);

    return {
        ...event,
        current_guests: occupiedCount
    };
  }).filter(event => {
    // 1. FILTRO DE PRAZO
    if (event.deadline_datetime) {
        const now = new Date();
        const deadline = new Date(event.deadline_datetime);
        if (now > deadline) {
            return false; // Esconde se o prazo já passou
        }
    }

    // 2. FILTRO DE VAGAS
    if (event.max_guests > 0) {
        return event.current_guests < event.max_guests;
    }
    return true; // Mantém eventos ilimitados
  });

  // Sanitização: Remove a lista de matches (privada) antes de enviar
  const cleanEvents = availableEvents.map(event => {
    const { matches, ...eventData } = event;
    return eventData;
  });

  return NextResponse.json(cleanEvents);
}