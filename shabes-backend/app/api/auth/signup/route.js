import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Rota de Cadastro robusta.
 * Garante que a imagem seja mapeada para 'avatar_url' (o que o seu Trigger SQL exige).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extraímos os metadados (suporta formato plano ou aninhado)
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // CAPTURA DA IMAGEM: O Trigger SQL espera a chave 'avatar_url'
    const image = body.image || meta.image || body.avatar_url || meta.avatar_url || null;
    
    // Montamos o objeto de dados que irá para o raw_user_meta_data do Supabase Auth
    const userData = {
      // Campos que o Trigger handle_new_user_final() utiliza:
      name: body.name || meta.full_name || meta.name || 'Novo Usuário',
      phone: body.phone || meta.phone || '',
      address: body.address || meta.address || '',
      maxDistance: Number(body.maxDistance || meta.max_distance || 15),
      preferredStartTime: body.preferredStartTime || meta.preferred_start_time || "19:00",
      preferredEndTime: body.preferredEndTime || meta.preferred_end_time || "22:00",
      dietary: body.dietary || meta.dietary_preference || "kosher",
      notes: body.notes || meta.notes || "",
      invite_code: body.inviteCode || meta.invite_code || "",
      
      // --- CHAVES CRÍTICAS PARA O TRIGGER SQL ---
      avatar_url: image, // 👈 Se esta chave não for EXATAMENTE 'avatar_url', a foto não vai para o perfil
      birth_date: body.birth_date || meta.birth_date || body.birthDate || null, // Para o cálculo de idade
      validatorOrganization: body.validatorOrganization || meta.validatorOrganization || "Qualquer"
    };

    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Processando cadastro: ${email}`);
    if (image) {
      console.log(`[AUTH-SIGNUP] Foto de perfil enviada ao Supabase Auth (Meta).`);
    }

    // Realizamos o SignUp no Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: userData, // Aqui o Supabase guarda tudo no campo raw_user_meta_data
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro inesperado:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}