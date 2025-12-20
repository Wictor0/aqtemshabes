import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
  );
    
  const { searchParams } = request.nextUrl;
  const from_date = searchParams.get('from_date');
    
  let query = supabase.from('events').select(`
      *,
      host:profiles!events_host_id_fkey (
        id,
        full_name,
        avatar_url,
        username,
        role 
      ),
      matches (
        status
      )
    `);

  if (from_date) {
    query = query.gte('date', from_date);
  }

  // 👇 FILTRO AUTOMÁTICO: ESCONDE EVENTOS COM PRAZO VENCIDO 👇
  // Retorna eventos onde deadline_datetime é MAIOR que agora OU é nulo (sem prazo)
  const now = new Date().toISOString();
  query = query.or(`deadline_datetime.gt.${now},deadline_datetime.is.null`);

  const { data: events, error } = await query.order('date', { ascending: true });

  if (error) {
      console.error("Erro detalhado ao buscar eventos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const availableEvents = events.filter(event => {
    const acceptedCount = event.matches.filter(m => m.status === 'accepted').length;
    return acceptedCount < event.max_guests;
  });

  const cleanEvents = availableEvents.map(event => {
    delete event.matches; 
    return event;
  });

  return NextResponse.json(cleanEvents);
}