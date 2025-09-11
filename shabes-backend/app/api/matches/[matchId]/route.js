import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Esta função lida com a atualização do status de um match (aceitar/recusar)
export async function PATCH(request, { params }) {
  const { matchId } = params;
  const { status } = await request.json(); // O novo status virá no corpo do pedido

  if (!matchId || !status) {
    return NextResponse.json({ error: 'É necessário fornecer o ID do match e um novo status' }, { status: 400 });
  }

  if (status !== 'accepted' && status !== 'declined') {
    return NextResponse.json({ error: 'O status deve ser "accepted" ou "declined"' }, { status: 400 });
  }
  
  const supabase = createRouteHandlerClient({ cookies });

  // Autentica o utilizador para garantir que ele é o anfitrião
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // Lógica de segurança: Verifica se o utilizador que está a fazer o pedido é realmente o anfitrião do evento
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('event:events(host_id)')
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 });
  }
  
  if (match.event.host_id !== user.id) {
    return NextResponse.json({ error: 'Apenas o anfitrião pode modificar este pedido.' }, { status: 403 });
  }

  // Se tudo estiver correto, atualiza o status do match
  const { data, error } = await supabase
    .from('matches')
    .update({ status: status })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar o status do match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
