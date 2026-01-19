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
    
    // Extraímos os metadados (suporta formato plano ou aninhado via objeto 'metadata')
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // CAPTURA DA IMAGEM: Procuramos por 'image' ou 'avatar_url' em qualquer nível do JSON
    const image = body.image || meta.image || body.avatar_url || meta.avatar_url || null;
    
    // Montamos o objeto de dados que irá para o raw_user_meta_data do Supabase Auth
    const userData = {
      // Campos básicos mapeados para o Trigger handle_new_user_final()
      name: body.name || meta.full_name || meta.name || 'Novo Usuário',
      phone: body.phone || meta.phone || '',
      address: body.address || meta.address || '',
      maxDistance: Number(body.maxDistance || meta.max_distance || 15),
      preferredStartTime: body.preferredStartTime || meta.preferred_start_time || "19:00",
      preferredEndTime: body.preferredEndTime || meta.preferred_end_time || "22:00",
      dietary: body.dietary || meta.dietary_preference || "kosher",
      dietaryRestrictions: body.dietaryRestrictions || meta.dietaryRestrictions || "",
      notes: body.notes || meta.notes || "",
      invite_code: body.inviteCode || meta.invite_code || "",
      
      // --- CHAVES CRÍTICAS PARA O TRIGGER SQL ---
      // O seu Trigger SQL usa: raw_meta->>'avatar_url'
      avatar_url: image, 
      // O seu Trigger SQL usa: raw_meta->>'birth_date'
      birth_date: body.birth_date || meta.birth_date || body.birthDate || meta.birthDate || null,
      validatorOrganization: body.validatorOrganization || meta.validatorOrganization || "Qualquer"
    };

    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Processando cadastro: ${email}`);
    
    if (image) {
      // Log do tamanho da string para verificar se excede limites do Supabase (Metadata)
      console.log(`[AUTH-SIGNUP] Foto detectada. Tamanho da string: ${image.length} caracteres.`);
      
      if (image.length > 50000) {
        console.warn("[AUTH-SIGNUP] AVISO: A imagem é muito grande e pode ser rejeitada pelo metadata do Supabase Auth.");
      }
    } else {
      console.log("[AUTH-SIGNUP] Nenhuma foto detectada no corpo da requisição.");
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Realizamos o SignUp no Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: userData, // O Supabase guarda isto no campo 'raw_user_meta_data'
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase Auth:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso! Verifique o seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro inesperado:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}