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

  // --- [ALTERAÇÃO PARA DEPURAÇÃO] ---
  // A consulta complexa foi substituída por uma consulta simples.
  // Estamos a buscar apenas os dados da tabela 'notifications' para isolar o problema.
  console.log(`Buscando notificações simples para o usuário: ${user.id}`);
  const { data, error } = await supabase
    .from('notifications')
    .select('*') // Busca todas as colunas da tabela 'notifications'
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar notificações (query simples):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Adicionado log para ver o que a query simples retorna
  console.log("Dados retornados pela query simples:", data);

  return NextResponse.json(data);
}


// ======================
// PATCH /api/notifications
// (Sem alterações)
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
