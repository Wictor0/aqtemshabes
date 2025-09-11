import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Esta função lida com pedidos GET para /api/events/[eventId]
export async function GET(request, { params }) {
  const { eventId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  // Busca o evento específico pelo ID dele
  // Também faz um "join" com a tabela 'profiles' para obter o nome do anfitrião
  const { data, error } = await supabase
    .from('events')
    .select(`
      *, 
      profiles (full_name)
    `)
    .eq('id', eventId)
    .single(); // .single() para obter um único objeto em vez de um array

  if (error || !data) {
    console.error('Erro ao buscar detalhe do evento:', error);
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
  }

  // Calcula os convidados atuais contando os matches aceites para este evento
  const { count: currentGuests, error: countError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'accepted');
    
  // Formata os dados para uma estrutura que o frontend espera
  const formattedData = {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.date,
    approximateAddress: data.approximate_address, // Converte para camelCase
    maxGuests: data.max_guests,
    hostAgeGroup: data.host_age_group,
    targetAudience: data.target_audience,
    languages: data.languages || [], // Garante que é um array
    currentGuests: countError ? 0 : currentGuests,
    host: {
      name: data.profiles ? data.profiles.full_name : 'Anfitrião Desconhecido'
    }
  };
  delete formattedData.profiles; // Remove o objeto aninhado original

  return NextResponse.json(formattedData);
}
