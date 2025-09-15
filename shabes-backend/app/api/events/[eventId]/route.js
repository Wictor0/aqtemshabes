import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { eventId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  // Busca todos os detalhes do evento, incluindo o nome do anfitrião
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles (full_name)
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhes do evento:", error);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

