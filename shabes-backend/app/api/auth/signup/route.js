import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Helper para converter Base64 e fazer upload para o Storage do Supabase.
 * Agora aceita strings com ou sem o prefixo 'data:image...'.
 */
async function uploadBase64Image(supabase, base64Data, filePath) {
  try {
    if (!base64Data || typeof base64Data !== 'string') return null;

    // Remove o prefixo se existir para converter corretamente em Buffer
    const base64Body = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Body, 'base64');
    
    console.log(`[STORAGE] Tentando upload para ${filePath}. Tamanho: ${buffer.length} bytes.`);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`[STORAGE-ERROR] Erro no upload de ${filePath}:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log(`[STORAGE] Sucesso! URL gerada: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[STORAGE-CRITICAL] Erro inesperado no processamento de ${filePath}:`, err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const meta = body.metadata || {};
    const email = (body.email || meta.email || body.email)?.trim().toLowerCase();
    const password = body.password;
    
    // Captura flexível dos dados de imagem
    const avatarBase64 = body.avatar_url || meta.avatar_url || body.image || null;
    const facePhotoBase64 = body.face_photo_url || meta.face_photo_url || null;

    console.log(`\n--- [AUTH-SIGNUP] Iniciando cadastro para: ${email} ---`);
    console.log(`[AUTH-SIGNUP] Avatar recebido? ${avatarBase64 ? 'Sim' : 'Não'}`);
    console.log(`[AUTH-SIGNUP] Foto de rosto recebida? ${facePhotoBase64 ? 'Sim' : 'Não'}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 1. Realizamos o SignUp inicial no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://aqtemshabes.onrender.com/api/auth/confirm`,
        data: {
          name: body.name || meta.full_name || 'Novo Usuário',
          phone: body.phone || meta.phone || '',
          birth_date: body.birth_date || meta.birth_date || null,
          dietary_restrictions: body.dietaryRestrictions || meta.dietaryRestrictions || "",
          validator_organization: body.validatorOrganization || meta.validatorOrganization || "Qualquer",
          invite_code: body.inviteCode || meta.invite_code || "",
          // Marcamos como pendente no Auth metadata
          avatar_url: avatarBase64 ? 'processing' : null,
          face_photo_url: facePhotoBase64 ? 'processing' : null
        },
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro Supabase Auth:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    let finalAvatarUrl = null;
    let finalFaceUrl = null;

    // 2. PROCESSAMENTO DE IMAGENS NO BACKEND
    if (userId) {
        // Processa Avatar (aceita qualquer string longa que pareça base64)
        if (avatarBase64 && avatarBase64.length > 100) {
            finalAvatarUrl = await uploadBase64Image(supabase, avatarBase64, `${userId}/profile/avatar.png`);
        }
        
        // Processa Foto de Rosto
        if (facePhotoBase64 && facePhotoBase64.length > 100) {
            finalFaceUrl = await uploadBase64Image(supabase, facePhotoBase64, `${userId}/verification/face.png`);
        }

        // 3. ATUALIZAÇÃO PARCIAL DA TABELA PROFILES
        // Criamos o objeto apenas com campos que não são nulos para evitar apagar dados existentes
        const updateFields = {};
        if (finalAvatarUrl) updateFields.avatar_url = finalAvatarUrl;
        if (finalFaceUrl) updateFields.face_photo_url = finalFaceUrl;

        if (Object.keys(updateFields).length > 0) {
            console.log(`[AUTH-SIGNUP] Atualizando tabela profiles para o usuário ${userId}...`);
            const { error: profileError } = await supabase
                .from('profiles')
                .update(updateFields)
                .eq('id', userId);
            
            if (profileError) {
                console.error("[AUTH-SIGNUP] Erro ao atualizar tabela profiles:", profileError.message);
            } else {
                console.log("[AUTH-SIGNUP] Tabela profiles atualizada com sucesso.");
            }
        }
    }

    // 4. ENVIO DE E-MAIL PARA ADMIN COM LINKS REAIS
    if (data.user) {
        const emailText = `🚀 Novo usuário se cadastrou e aguarda aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name || 'Novo Usuário'}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Organização de Validação: ${body.validatorOrganization || meta.validatorOrganization || 'Qualquer'}\n` + 
                          `▪ Telefone: ${body.phone || meta.phone || 'N/A'}\n\n` +
                          `📸 FOTO DE ROSTO: ${finalFaceUrl || '⚠️ Não processada ou não enviada'}\n` +
                          `👤 FOTO DE PERFIL: ${finalAvatarUrl || '⚠️ Não processada ou não enviada'}\n\n` +
                          `Acesse o banco para aprovar: https://supabase.com/dashboard/project/cafuulfswdjcpenmdutn/editor/table/profiles?filter=id%3Deq.${userId}`;
        
        sendAdminNotification('🚀 Novo Usuário Cadastrado (Pendente)', emailText)
            .catch(err => console.error("Falha ao enviar e-mail admin:", err));
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso!',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico inesperado:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}