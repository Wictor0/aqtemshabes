import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Helper para converter Base64 e fazer upload para o Storage do Supabase.
 * Agora com logs de debug mais agressivos.
 */
async function uploadBase64Image(supabase, base64Data, filePath) {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      console.log(`[STORAGE] Erro: Dados ausentes para ${filePath}`);
      return null;
    }

    if (base64Data === "pending_upload" || base64Data.length < 100) {
      console.log(`[STORAGE] Erro: Recebido marcador "${base64Data}" em vez de imagem real para ${filePath}`);
      return null;
    }

    // Limpa o cabeçalho base64 se presente
    const base64Body = base64Data.includes(';base64,') 
      ? base64Data.split(';base64,')[1] 
      : base64Data;
    
    const buffer = Buffer.from(base64Body, 'base64');
    
    console.log(`[STORAGE] A processar ${filePath}. Tamanho do buffer: ${buffer.length} bytes.`);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`[STORAGE-ERROR] Falha no Supabase Storage (${filePath}):`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log(`[STORAGE] SUCESSO! URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[STORAGE-CRITICAL] Erro catastrófico em ${filePath}:`, err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    // Captura as imagens. 
    // O Frontend DEVE enviar o Base64 aqui, não "pending_upload"
    const avatarBase64 = body.avatar_url || meta.avatar_url || body.image || null;
    const facePhotoBase64 = body.face_photo_url || meta.face_photo_url || body.facePhoto || null;

    console.log(`\n--- [AUTH-SIGNUP] Início do processo para: ${email} ---`);
    console.log(`[AUTH-SIGNUP] Imagem Perfil (tamanho string): ${avatarBase64?.length || 0}`);
    console.log(`[AUTH-SIGNUP] Imagem Rosto (tamanho string): ${facePhotoBase64?.length || 0}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios." }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 1. SignUp no Auth
    // Nota: Passamos as URLs como 'processing' apenas para o metadata inicial
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
      console.error('[AUTH-SIGNUP] Erro Auth:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    let finalAvatarUrl = null;
    let finalFaceUrl = null;

    // 2. Processamento imediato das imagens
    if (userId) {
        console.log(`[AUTH-SIGNUP] ID do utilizador: ${userId}. A iniciar uploads...`);

        if (avatarBase64 && avatarBase64 !== "pending_upload") {
            finalAvatarUrl = await uploadBase64Image(supabase, avatarBase64, `${userId}/profile/avatar.png`);
        }
        
        if (facePhotoBase64 && facePhotoBase64 !== "pending_upload") {
            finalFaceUrl = await uploadBase64Image(supabase, facePhotoBase64, `${userId}/verification/face.png`);
        }

        // 3. Atualizar a tabela profiles manualmente
        // Tentamos fazer isto no backend para garantir que os links reais substituam o "processing"
        const updateFields = {};
        if (finalAvatarUrl) updateFields.avatar_url = finalAvatarUrl;
        if (finalFaceUrl) updateFields.face_photo_url = finalFaceUrl;

        if (Object.keys(updateFields).length > 0) {
            console.log(`[AUTH-SIGNUP] A atualizar a tabela profiles com os links reais...`);
            const { error: profileError } = await supabase
                .from('profiles')
                .update(updateFields)
                .eq('id', userId);
            
            if (profileError) {
                console.error("[AUTH-SIGNUP] Erro ao gravar links no banco (Possível RLS):", profileError.message);
            } else {
                console.log("[AUTH-SIGNUP] Perfil atualizado com sucesso no banco de dados.");
            }
        } else {
            console.log("[AUTH-SIGNUP] Nenhuma imagem válida para gravar no banco.");
        }
    }

    // 4. E-mail Administrativo
    if (data.user) {
        const emailText = `🚀 Novo registo para aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Validação: ${body.validatorOrganization || meta.validatorOrganization || 'Qualquer'}\n\n` +
                          `📸 FOTO ROSTO: ${finalFaceUrl || '⚠️ Falha ou Não enviada'}\n` +
                          `👤 FOTO PERFIL: ${finalAvatarUrl || '⚠️ Falha ou Não enviada'}\n\n` +
                          `Gestão: https://supabase.com/dashboard/project/cafuulfswdjcpenmdutn/editor/table/profiles?filter=id%3Deq.${userId}`;
        
        sendAdminNotification('🚀 Novo Usuário Cadastrado', emailText)
            .catch(err => console.error("[EMAIL-ERR]", err));
    }

    return NextResponse.json({
      message: 'Cadastro iniciado. Confirme o seu e-mail.',
      user: data.user,
    });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro Crítico:', e);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}