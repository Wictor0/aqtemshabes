import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Rota de Cadastro atualizada para garantir persistência de metadados (incluindo imagem)
 * Sincronizada com o Trigger SQL public.handle_new_user_final()
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extração inteligente de dados (aceita metadados aninhados ou raiz)
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // O Trigger espera 'avatar_url', então mapeamos o campo 'image' para este nome
    const image = body.image || meta.image || meta.avatar_url || null;
    
    // Mapeamento de dados seguindo exatamente o que o Trigger handle_new_user_final() espera
    const userData = {
      name: body.name || meta.full_name || meta.name,
      phone: body.phone || meta.phone,
      address: body.address || meta.address,
      maxDistance: Number(body.maxDistance || meta.max_distance || 15),
      preferredStartTime: body.preferredStartTime || meta.preferred_start_time || "19:00",
      preferredEndTime: body.preferredEndTime || meta.preferred_end_time || "22:00",
      dietary: body.dietary || meta.dietary_preference || "kosher",
      dietaryRestrictions: body.dietaryRestrictions || meta.dietaryRestrictions || "",
      notes: body.notes || meta.notes,
      invite_code: body.inviteCode || meta.invite_code,
      
      // Campos essenciais para o Trigger SQL processar nascimento e avatar
      avatar_url: image, // 👈 Alinhado com o Trigger: raw_meta->>'avatar_url'
      birth_date: body.birth_date || meta.birth_date || body.birthDate || meta.birthDate || null, // 👈 Para o cálculo de age_group
      validatorOrganization: body.validatorOrganization || meta.validatorOrganization || "Qualquer"
    };

    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Iniciando cadastro para: ${email}`);
    if (image) console.log("[AUTH-SIGNUP] Foto de perfil detectada e mapeada para avatar_url.");

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Registro no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        // Enviamos o objeto formatado para o raw_user_meta_data do auth.users
        data: userData,
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique o seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}