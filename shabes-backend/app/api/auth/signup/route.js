import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Helper para converter Base64 e fazer upload para o Storage do Supabase
 */
async function uploadBase64Image(supabase, base64Data, filePath) {
  try {
    // Remove o prefixo 'data:image/png;base64,' se existir
    const base64Body = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Body, 'base64');
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error(`[STORAGE-UPLOAD-ERROR] ${filePath}:`, err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // Capturamos os dados de imagem (que agora devem vir em Base64 do frontend)
    const avatarBase64 = body.avatar_url || meta.avatar_url || body.image || null;
    const facePhotoBase64 = body.face_photo_url || meta.face_photo_url || null;

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
          // Inicializamos como pendente, o backend atualizará abaixo
          avatar_url: null,
          face_photo_url: null
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

    // 2. PROCESSAMENTO DE IMAGENS NO BACKEND (Se vierem em Base64)
    if (userId) {
        if (avatarBase64 && avatarBase64.startsWith('data:image')) {
            finalAvatarUrl = await uploadBase64Image(supabase, avatarBase64, `${userId}/profile/avatar.png`);
        }
        if (facePhotoBase64 && facePhotoBase64.startsWith('data:image')) {
            finalFaceUrl = await uploadBase64Image(supabase, facePhotoBase64, `${userId}/verification/face.png`);
        }

        // 3. ATUALIZAÇÃO MANUAL DA TABELA PROFILES (Garante que os links entrem no banco)
        if (finalAvatarUrl || finalFaceUrl) {
            await supabase
                .from('profiles')
                .update({ 
                    avatar_url: finalAvatarUrl, 
                    face_photo_url: finalFaceUrl 
                })
                .eq('id', userId);
        }
    }

    // 4. ENVIO DE E-MAIL PARA ADMIN COM LINKS REAIS
    if (data.user) {
        const emailText = `🚀 Novo usuário se cadastrou e aguarda aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Organização de Validação: ${body.validatorOrganization || meta.validatorOrganization || 'Qualquer'}\n` + 
                          `▪ Telefone: ${body.phone || meta.phone || 'N/A'}\n\n` +
                          `📸 FOTO DE ROSTO: ${finalFaceUrl || 'Não enviada ou erro no processamento'}\n` +
                          `👤 FOTO DE PERFIL: ${finalAvatarUrl || 'Não enviada'}\n\n` +
                          `Acesse o banco para aprovar: https://supabase.com/dashboard/project/cafuulfswdjcpenmdutn/editor/table/profiles?filter=id%3Deq.${userId}`;
        
        sendAdminNotification('🚀 Novo Usuário Cadastrado (Pendente)', emailText)
            .catch(err => console.error("Falha ao enviar e-mail admin:", err));
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso!',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro crítico:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}