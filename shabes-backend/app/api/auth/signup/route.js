import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Rota para criação de novos usuários (Signup)
 * Esta rota foi atualizada para ser robusta e aceitar dados em diferentes formatos (flat ou nested metadata).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extraímos o objeto metadata caso o frontend o esteja a enviar (comum em versões anteriores)
    const meta = body.metadata || {};

    // Mapeamento inteligente: procura o dado na raiz ou dentro do metadata
    const email = body.email || meta.email;
    const password = body.password;
    const image = body.image || meta.image || null;
    
    // Captura de dados de perfil com nomes alternativos (name vs full_name)
    const name = body.name || meta.full_name || meta.name;
    const phone = body.phone || meta.phone;
    const address = body.address || meta.address;
    const maxDistance = body.maxDistance || meta.max_distance || meta.maxDistance || 15;
    const preferredStartTime = body.preferredStartTime || meta.preferred_start_time || "19:00";
    const preferredEndTime = body.preferredEndTime || meta.preferred_end_time || "22:00";
    const dietary = body.dietary || meta.dietary_preference || meta.dietary || "kosher";
    const notes = body.notes || meta.notes;
    const inviteCode = body.inviteCode || meta.invite_code || meta.inviteCode;

    // Inicialização do cliente Supabase
    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Tentando cadastro para: ${email}`);
    console.log(`[AUTH-SIGNUP] Imagem recebida: ${image ? "Sim (Base64)" : "Não"}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Realizamos o SignUp no Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        // Guardamos TODA a informação no user_metadata
        // É daqui que o seu ProfileScreen deve ler os dados no primeiro login
        data: { 
          name, 
          phone, 
          address, 
          maxDistance: Number(maxDistance), 
          preferredStartTime, 
          preferredEndTime, 
          dietary, 
          notes, 
          invite_code: inviteCode,
          image: image // A imagem Base64 é salva aqui
        },
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique o seu e-mail para confirmar.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico no servidor:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}