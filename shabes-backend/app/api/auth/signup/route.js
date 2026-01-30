import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

// Forçamos a rota a ser dinâmica para evitar falhas no build do Next.js ao detetar o uso de cookies
export const dynamic = 'force-dynamic';

/**
 * Cliente Supabase com privilégios de Admin (Service Role)
 * Inicializado dentro de uma função ou com verificação para evitar erros se as envs não estiverem prontas no build
 */
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error("[AUTH-SIGNUP] Erro: Variáveis de ambiente do Supabase ausentes.");
    return null;
  }
  return createClient(url, key);
};

async function uploadBase64Image(supabaseAdmin, base64Data, filePath) {
  try {
    if (!supabaseAdmin || !base64Data || typeof base64Data !== 'string' || base64Data.length < 100) {
      return null;
    }

    const base64Body = base64Data.includes(';base64,') 
      ? base64Data.split(';base64,')[1] 
      : base64Data;
    
    const buffer = Buffer.from(base64Body, 'base64');
    
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
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
    }

    // 1. SignUp no Auth
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
      console.error('[AUTH-SIGNUP] Erro no registo:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    let finalAvatarUrl = null;
    let finalFaceUrl = null;

    // 2. Processamento das imagens via Admin
    if (userId) {
        if (avatarBase64) {
          finalAvatarUrl = await uploadBase64Image(supabaseAdmin, avatarBase64, `${userId}/profile/avatar.png`);
        }
        if (facePhotoBase64) {
          finalFaceUrl = await uploadBase64Image(supabaseAdmin, facePhotoBase64, `${userId}/verification/face.png`);
        }

        // 3. Atualização forçada via Admin
        const updateFields = {};
        if (finalAvatarUrl) updateFields.avatar_url = finalAvatarUrl;
        if (finalFaceUrl) updateFields.face_photo_url = finalFaceUrl;

        if (Object.keys(updateFields).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(updateFields)
                .eq('id', userId);
            
            if (profileError) {
              console.error("[AUTH-SIGNUP] Erro ao atualizar perfil via Admin:", profileError.message);
            }
        }
    }

    // 4. Notificação por E-mail
    if (data.user) {
        const emailText = `🚀 Novo registo para aprovação.\n\n` +
                          `▪ Nome: ${body.name || meta.full_name || 'Novo Utilizador'}\n` +
                          `▪ Email: ${email}\n` +
                          `▪ Telefone: ${body.phone || meta.phone || 'N/A'}\n\n` +
                          `📸 FOTO ROSTO: ${finalFaceUrl || '⚠️ Falha no upload'}\n` +
                          `👤 FOTO PERFIL: ${finalAvatarUrl || '⚠️ Falha no upload'}`;
        
        sendAdminNotification('🚀 Novo Utilizador Cadastrado', emailText)
            .catch(err => console.error("[EMAIL-ERR] Falha ao enviar notificação:", err));
    }

    return NextResponse.json({ message: 'Sucesso', user: data.user });

  } catch (e) {
    console.error('[AUTH-SIGNUP] Erro Crítico Inesperado:', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}