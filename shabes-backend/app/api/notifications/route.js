import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ======================
// GET /api/notifications
// ======================
export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });

  // --- Autenticação ---
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // --- Busca notificações + informações do match e evento ---
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      title,
      message,
      is_read,
      created_at,
      match:matches(
        id,
        status,
        event:events(
          id,
          title,
          date,
          host_id,
          host:profiles!events_host_id_fkey(
            id,
            full_name
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ======================
// PATCH /api/notifications
// ======================
export async function PATCH(request) {
  const { notificationId } = await request.json();
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

  // Marca como lida apenas se pertencer ao usuário
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Notificação marcada como lida.' });
}
