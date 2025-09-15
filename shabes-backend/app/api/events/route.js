import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const eventData = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('events')
    .insert({ ...eventData, host_id: session.user.id })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// --- FUNÇÃO GET ATUALIZADA ---
// Agora busca todos os campos necessários e o nome do anfitrião
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      date,
      approximate_address,
      max_guests,
      host:profiles (full_name)
    `)
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

