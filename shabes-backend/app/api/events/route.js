import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// --- FUNÇÃO POST FINAL E CORRIGIDA ---
export async function POST(request) {
  const eventData = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  // Valida o token do cabeçalho da requisição
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado: token não fornecido' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'Não autorizado: token inválido' }, { status: 401 });
  }

  // Chama a função RPC 'create_event', passando o ID do anfitrião
  const { data, error } = await supabase.rpc('create_event', {
    p_host_id: user.id, // Passa o ID do anfitrião
    p_title: eventData.title,
    p_description: eventData.description,
    p_date: eventData.date,
    p_full_address: eventData.full_address,
    p_approximate_address: eventData.approximate_address,
    p_max_guests: eventData.max_guests,
    p_host_age_group: eventData.host_age_group,
    p_target_audience: eventData.target_audience,
    p_languages: eventData.languages,
  });

  if (error) {
    console.error('Erro ao chamar RPC create_event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// A função GET para listar eventos continua a mesma
export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);

  const region = searchParams.get('region');
  const ageGroup = searchParams.get('ageGroup');
  const guestCount = searchParams.get('guestCount');
  const languages = searchParams.get('languages');
  const date = searchParams.get('date');

  let query = supabase
    .from('events')
    .select(`
      id, title, date, approximate_address, max_guests,
      host_age_group, target_audience, languages,
      host:profiles!events_host_id_fkey(full_name)
    `);

  if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      query = query.gte('date', startDate.toISOString()).lte('date', endDate.toISOString());
  } else {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      query = query.gte('date', today.toISOString());
  }

  if (region) {
    query = query.ilike('approximate_address', `%${region}%`);
  }
  if (ageGroup) {
    query = query.eq('target_audience', ageGroup);
  }
  if (guestCount) {
    query = query.gte('max_guests', Number(guestCount));
  }
  if (languages) {
    const languagesArray = languages.split(',');
    query = query.overlaps('languages', languagesArray);
  }

  query = query.order('date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar eventos com filtros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

