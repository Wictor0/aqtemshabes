import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Rota para criação de novos usuários (Signup)
 * Esta rota deve ser POST e receber os dados do formulário mobile
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      address, 
      maxDistance, 
      preferredStartTime, 
      preferredEndTime, 
      dietary, 
      notes, 
      inviteCode 
    } = body;

    // Inicialização do cliente Supabase com suporte a cookies do Next.js
    const supabase = createRouteHandlerClient({ cookies });

    // IMPORTANTE: Esta URL deve estar EXATAMENTE igual no Dashboard do Supabase (Redirect URLs)
    // Certifique-se de que não há barras extras ou espaços.
    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Iniciando cadastro para: ${email}`);
    console.log(`[AUTH-SIGNUP] Redirecionamento configurado para: ${redirectTo}`);

    // Realizamos o SignUp no Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), // Normalização para evitar erros de digitação
      password,
      options: {
        emailRedirectTo: redirectTo,
        // Guardamos todas as preferências do utilizador no user_metadata
        data: { 
          name, 
          phone, 
          address, 
          maxDistance: Number(maxDistance), // Garantimos que é um número
          preferredStartTime, 
          preferredEndTime, 
          dietary, 
          notes, 
          invite_code: inviteCode 
        },
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Retornamos sucesso. O utilizador deve agora clicar no link do e-mail.
    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique o seu e-mail para confirmar.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico no servidor:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}