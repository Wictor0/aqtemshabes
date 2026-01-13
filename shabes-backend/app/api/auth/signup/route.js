import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Esta rota DEVE ser POST para receber os dados do formulário da aplicação
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, ...metadata } = body;

    const supabase = createRouteHandlerClient({ cookies });

    // URL fixa para garantir que o link no email aponte para a rota de confirmação
    const redirectTo = "https://aqtemshabes.onrender.com/api/auth/confirm";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { name, ...metadata },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Verifique o seu e-mail para confirmar o registo.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro no registo:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}