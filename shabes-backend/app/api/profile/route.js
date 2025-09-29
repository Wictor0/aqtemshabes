import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ================= PATCH =================
export async function PATCH(request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Autenticação
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = await request.json();

  // 🔧 Filtra apenas os campos permitidos
  const allowedFields = ['full_name', 'phone', 'avatar_url', 'role'];
  const filteredBody = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  console.log("📦 PATCH /profile -> Body filtrado:", filteredBody);

  // Faz o update direto (RLS garante que só o próprio usuário pode alterar)
  const { data, error } = await supabase
    .from('profiles')
    .update(filteredBody)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error("❌ PATCH /profile -> Erro ao atualizar o perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("✅ PATCH /profile -> Perfil atualizado:", data);

  return NextResponse.json(data);
}

// ================= GET =================
export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("❌ GET /profile -> Erro ao buscar o perfil:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  console.log("✅ GET /profile -> Perfil retornado:", data);

  return NextResponse.json(data);
}
