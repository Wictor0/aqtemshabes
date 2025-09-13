import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Função para buscar as notificações do utilizador logado
export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Autenticação
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // Busca as notificações para o utilizador atual, ordenadas pela mais recente
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Função para marcar uma notificação como lida
export async function PATCH(request) {
    const { notificationId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
  
    // Autenticação
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
  
    // Atualiza a notificação para 'is_read = true'
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id); // Garante que o utilizador só pode marcar as suas próprias notificações
  
    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    return NextResponse.json({ message: 'Notificação marcada como lida.' });
  }
