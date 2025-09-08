import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const eventData = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado: token não fornecido' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Não autorizado: token inválido' }, { status: 401 });
  }

  // MODIFICAÇÃO PRINCIPAL: Agora passamos o ID do utilizador para a função RPC
  const { data, error } = await supabase.rpc('create_event', {
    p_host_id: user.id, // << ENVIANDO O ID DO ANFITRIÃO
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

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      date,
      approximate_address,
      profiles (
        full_name
      )
    `);

  if (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

