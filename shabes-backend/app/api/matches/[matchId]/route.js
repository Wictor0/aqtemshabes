import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// --- FUNÇÃO GET FINAL E CORRIGIDA ---
// Esta função agora faz uma consulta direta e confia na RLS para a segurança.
export async function GET(request, { params }) {
  const { matchId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  // Autenticação (essencial para que a RLS funcione)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // MODIFICAÇÃO: Fazer uma consulta direta em vez de chamar a RPC
  // A RLS que criámos irá garantir que o utilizador só pode buscar os matches dos quais ele faz parte.
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, status, personal_message, created_at,
      guest:profiles(id, full_name, email, phone),
      event:events(
        id, title, date, host_id,
        host:profiles(id, full_name, email, phone)
      )
    `)
    .eq('id', matchId)
    .single(); // .single() irá retornar um erro se a RLS bloquear o acesso

  if (error) {
    console.error("Erro ao buscar detalhes do match:", error);
    // O código 'PGRST116' do Supabase significa que a RLS filtrou o resultado (0 linhas)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Match não encontrado ou acesso negado.' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


// A função PATCH para atualizar o status continua a mesma
export async function PATCH(request, { params }) {
  const { matchId } = params;
  const { status } = await request.json();

  if (!matchId || !status) {
    return NextResponse.json({ error: 'É necessário fornecer o ID do match e um novo status' }, { status: 400 });
  }

  if (status !== 'accepted' && status !== 'declined') {
    return NextResponse.json({ error: 'O status deve ser "accepted" ou "declined"' }, { status: 400 });
  }
  
  const supabase = createRouteHandlerClient({ cookies });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

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

