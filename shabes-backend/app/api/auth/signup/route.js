import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Rota de Cadastro robusta.
 * Agora suporta 'avatar_url' (foto de perfil) e 'face_photo_url' (foto de identificação).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extraímos os metadados (suporta formato plano ou aninhado via objeto 'metadata')
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // CAPTURA DAS IMAGENS: Suporta 'image', 'avatar_url' e a nova 'face_photo_url'
    const avatar_url = body.avatar_url || meta.avatar_url || body.image || meta.image || null;
    const face_photo_url = body.face_photo_url || meta.face_photo_url || null;
    
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
      
      // --- CAMPOS DE INTERESSE (BIO E VALIDAÇÃO) ---
      dietaryRestrictions: body.dietaryRestrictions || meta.dietaryRestrictions || "",
      validatorOrganization: body.validatorOrganization || meta.validatorOrganization || "Qualquer",
      
      notes: body.notes || meta.notes || "",
      invite_code: body.inviteCode || meta.invite_code || "",
      
      // --- CHAVES CRÍTICAS PARA O TRIGGER SQL ---
      avatar_url: avatar_url, 
      face_photo_url: face_photo_url, // Nova coluna no banco
      birth_date: body.birth_date || meta.birth_date || body.birthDate || meta.birthDate || null,
    };

    const supabase = createRouteHandlerClient({ cookies });

    const SITE_URL = "https://aqtemshabes.onrender.com";
    const redirectTo = `${SITE_URL}/api/auth/confirm`;

    console.log(`[AUTH-SIGNUP] Processando cadastro: ${email}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // 1. Realizamos o SignUp no Supabase Auth
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

    // 2. ENVIO DE E-MAIL PARA ADMIN (INCLUINDO A FOTO DE ROSTO)
    if (data.user) {
        const emailText = `🚀 Um novo usuário se cadastrou e aguarda aprovação.\n\n` +
                          `▪ Nome: ${userData.name}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Nascimento: ${userData.birth_date || 'Não informado'}\n` +
                          `▪ Restrições Alimentares (Bio): ${userData.dietaryRestrictions || 'Nenhuma'}\n` + 
                          `▪ Organização de Validação: ${userData.validatorOrganization}\n` + 
                          `▪ Telefone: ${userData.phone}\n\n` +
                          `📸 Foto de Identidade (Rosto): ${face_photo_url ? face_photo_url : 'Não enviada'}`;
        
        // Dispara a notificação para o admin (aquitemshabes@gmail.com)
        sendAdminNotification('🚀 Novo Usuário Cadastrado (Pendente)', emailText)
            .catch(err => console.error("Falha ao enviar notificação para Admin:", err));
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