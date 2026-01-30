import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Helper para converter Base64 e fazer upload para o Storage do Supabase.
 * Melhora a compatibilidade com diferentes formatos de Base64.
 */
async function uploadBase64Image(supabase, base64Data, filePath) {
  try {
    if (!base64Data || typeof base64Data !== 'string' || base64Data.length < 100) {
      console.log(`[STORAGE] Dados de imagem inválidos ou muito curtos para ${filePath}.`);
      return null;
    }

    // Remove metadados do base64 (ex: data:image/png;base64,) para conversão em Buffer
    const base64Body = base64Data.includes(';base64,') 
      ? base64Data.split(';base64,')[1] 
      : base64Data;
    
    const buffer = Buffer.from(base64Body, 'base64');
    
    console.log(`[STORAGE] A processar upload para ${filePath}. Tamanho final: ${buffer.length} bytes.`);

    // Realiza o upload no bucket 'avatars'
    // Usamos upsert: true para sobrescrever caso já exista
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`[STORAGE-ERROR] Falha no upload (${filePath}):`, error.message);
      return null;
    }

    // Gera a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log(`[STORAGE] Upload concluído com sucesso. URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[STORAGE-CRITICAL] Erro no processamento de ${filePath}:`, err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Suporte para metadados aninhados ou planos
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // Captura flexível dos dados de imagem (Base64 vindo do Frontend)
    const avatarBase64 = body.avatar_url || meta.avatar_url || body.image || meta.image || null;
    const facePhotoBase64 = body.face_photo_url || meta.face_photo_url || body.facePhoto || null;

    console.log(`\n--- [AUTH-SIGNUP] Novo registo solicitado: ${email} ---`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 1. Criar o utilizador no Supabase Auth
    // Inserimos 'processing' inicialmente para que o Trigger SQL não falhe.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://aqtemshabes.onrender.com/api/auth/confirm`,
        data: {
          name: body.name || meta.full_name || 'Novo Utilizador',
          phone: body.phone || meta.phone || '',
          birth_date: body.birth_date || meta.birth_date || null,
          dietary_restrictions: body.dietaryRestrictions || meta.dietaryRestrictions || "",
          validator_organization: body.validatorOrganization || meta.validatorOrganization || "Qualquer",
          invite_code: body.inviteCode || meta.invite_code || "",
          avatar_url: avatarBase64 ? 'processing' : null,
          face_photo_url: facePhotoBase64 ? 'processing' : null
        },
      },
    });

    if (error) {
      console.error('[AUTH-SIGNUP] Erro no Supabase Auth:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    let finalAvatarUrl = null;
    let finalFaceUrl = null;

    // 2. Processar Imagens se o utilizador foi criado com sucesso
    if (userId) {
        console.log(`[AUTH-SIGNUP] Utilizador criado (ID: ${userId}). A processar ficheiros...`);

        // Upload da Foto de Perfil
        if (avatarBase64) {
            finalAvatarUrl = await uploadBase64Image(supabase, avatarBase64, `${userId}/profile/avatar.png`);
        }
        
        // Upload da Selfie de Verificação (Rosto)
        if (facePhotoBase64) {
            finalFaceUrl = await uploadBase64Image(supabase, facePhotoBase64, `${userId}/verification/face.png`);
        }

        // 3. Atualizar a tabela 'profiles' com as URLs finais clicáveis
        // IMPORTANTE: Este passo pode falhar se o RLS não permitir UPDATE para o utilizador
        const updateFields = {};
        if (finalAvatarUrl) updateFields.avatar_url = finalAvatarUrl;
        if (finalFaceUrl) updateFields.face_photo_url = finalFaceUrl;

        if (Object.keys(updateFields).length > 0) {
            console.log(`[AUTH-SIGNUP] A tentar atualizar a tabela profiles com:`, updateFields);
            const { error: profileError } = await supabase
                .from('profiles')
                .update(updateFields)
                .eq('id', userId);
            
            if (profileError) {
                console.error("[AUTH-SIGNUP] ERRO DE RLS/BANCO ao atualizar tabela profiles:", profileError.message);
            } else {
                console.log("[AUTH-SIGNUP] Banco de dados atualizado com as URLs das fotos.");
            }
        }
    }

    // 4. Enviar notificação para o Admin com os links reais gerados
    if (data.user) {
        const emailText = `🚀 Novo registo aguardando aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name || 'Novo Utilizador'}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Organização de Validação: ${body.validatorOrganization || meta.validatorOrganization || 'Qualquer'}\n` + 
                          `▪ Telefone: ${body.phone || meta.phone || 'N/A'}\n\n` +
                          `📸 FOTO DE ROSTO: ${finalFaceUrl ? finalFaceUrl : '⚠️ Falha no upload/processamento'}\n` +
                          `👤 FOTO DE PERFIL: ${finalAvatarUrl ? finalAvatarUrl : '⚠️ Falha no upload/processamento'}\n\n` +
                          `Aceda ao Supabase para gerir o perfil: https://supabase.com/dashboard/project/cafuulfswdjcpenmdutn/editor/table/profiles?filter=id%3Deq.${userId}`;
        
        sendAdminNotification('🚀 Novo Utilizador Cadastrado (Pendente)', emailText)
            .catch(err => console.error("[EMAIL-ERROR] Falha ao notificar admin:", err));
    }

    return NextResponse.json({
      message: 'Registo realizado com sucesso! Verifique o seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro inesperado na rota:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}