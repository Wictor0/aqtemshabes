import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js'; // Importação necessária para o cliente Admin
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

/**
 * Cliente Supabase com privilégios de Admin (Service Role)
 * Isto permite ignorar o RLS e atualizar a tabela profiles mesmo antes do email ser confirmado.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Certifique-se de que esta variável está no Render
);

async function uploadBase64Image(supabase, base64Data, filePath) {
  try {
    if (!base64Data || typeof base64Data !== 'string' || base64Data.length < 100) return null;

    const base64Body = base64Data.includes(';base64,') 
      ? base64Data.split(';base64,')[1] 
      : base64Data;
    
    const buffer = Buffer.from(base64Body, 'base64');
    
    // Fazemos o upload usando o cliente Admin para garantir sucesso
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`[STORAGE-ERROR] ${filePath}:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error(`[STORAGE-CRITICAL] ${filePath}:`, err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const meta = body.metadata || {};
    const email = (body.email || meta.email)?.trim().toLowerCase();
    const password = body.password;
    
    const avatarBase64 = body.avatar_url || meta.avatar_url || null;
    const facePhotoBase64 = body.face_photo_url || meta.face_photo_url || null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios." }, { status: 400 });
    }

    // Cliente para Auth (com cookies do utilizador)
    const supabase = createRouteHandlerClient({ cookies });

    // 1. SignUp no Auth (O Trigger SQL criará a linha com 'processing')
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

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const userId = data.user?.id;
    let finalAvatarUrl = null;
    let finalFaceUrl = null;

    // 2. Processamento das imagens via Admin (Garante sucesso no Storage)
    if (userId) {
        if (avatarBase64) finalAvatarUrl = await uploadBase64Image(supabase, avatarBase64, `${userId}/profile/avatar.png`);
        if (facePhotoBase64) finalFaceUrl = await uploadBase64Image(supabase, facePhotoBase64, `${userId}/verification/face.png`);

        // 3. Atualização forçada na tabela Profiles usando o Cliente Admin
        // Isto ignora o RLS e substitui o "processing" pelo link real
        const updateFields = {};
        if (finalAvatarUrl) updateFields.avatar_url = finalAvatarUrl;
        if (finalFaceUrl) updateFields.face_photo_url = finalFaceUrl;

        if (Object.keys(updateFields).length > 0) {
            console.log(`[AUTH-SIGNUP] A forçar atualização do perfil ${userId} via Admin...`);
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(updateFields)
                .eq('id', userId);
            
            if (profileError) console.error("[AUTH-SIGNUP] Erro Admin Update:", profileError.message);
        }
    }

    // 4. E-mail Administrativo
    if (data.user) {
        const emailText = `🚀 Novo registo para aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Telefone: ${body.phone || meta.phone || 'N/A'}\n\n` +
                          `📸 FOTO ROSTO: ${finalFaceUrl || '⚠️ Erro no upload'}\n` +
                          `👤 FOTO PERFIL: ${finalAvatarUrl || '⚠️ Erro no upload'}`;
        
        sendAdminNotification('🚀 Novo Usuário Cadastrado', emailText)
            .catch(err => console.error("[EMAIL-ERR]", err));
    }

    return NextResponse.json({ message: 'Sucesso', user: data.user });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro Crítico:', e);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}