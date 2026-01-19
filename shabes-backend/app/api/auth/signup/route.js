import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Rota de Cadastro atualizada para garantir persistência de metadados (incluindo imagem)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extração inteligente de dados (aceita metadados aninhados ou raiz)
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    const image = body.image || meta.image || null;
    
    const userData = {
      name: body.name || meta.full_name || meta.name,
      phone: body.phone || meta.phone,
      address: body.address || meta.address,
      maxDistance: Number(body.maxDistance || meta.max_distance || 15),
      preferredStartTime: body.preferredStartTime || meta.preferred_start_time || "19:00",
      preferredEndTime: body.preferredEndTime || meta.preferred_end_time || "22:00",
      dietary: body.dietary || meta.dietary_preference || "kosher",
      notes: body.notes || meta.notes,
      invite_code: body.inviteCode || meta.invite_code,
      image: image // A string Base64 da foto
    };

    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Iniciando cadastro para: ${email}`);
    if (image) console.log("[AUTH-SIGNUP] Foto de perfil detectada no payload.");

    // Registro no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        // É CRUCIAL que a imagem esteja aqui no data
        data: userData,
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Nota técnica: Se você usa um Trigger no Supabase para criar o perfil na tabela pública,
    // certifique-se de que o SQL do trigger inclua o campo 'image' vindo do raw_user_meta_data.

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique o seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}