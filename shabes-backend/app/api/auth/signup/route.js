import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAdminNotification } from '../../../../lib/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      address,
      maxDistance,
      preferredStartTime,
      preferredEndTime,
      dietary,
      notes,
      inviteCode,
      validatorOrganization,
      dietaryRestrictions,
      birth_date // 👈 IMPORTANTE: Recebendo a data do frontend
    } = body;

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, 
          phone,
          address,
          maxDistance,
          preferredStartTime,
          preferredEndTime,
          dietary,
          notes,
          invite_code: inviteCode,
          validatorOrganization,
          dietaryRestrictions,
          birth_date // 👈 IMPORTANTE: Enviando para o Gatilho SQL
        },
      },
    });

    if (error) {
      console.error('Erro no cadastro do Supabase (Auth):', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Envio de email para Admin
    if (data.user) {
        const emailText = `Um novo usuário se cadastrou e aguarda aprovação.\n\n` +
                          `Nome: ${name}\n` +
                          `Email: ${email}\n` +
                          `Nascimento: ${birth_date || 'N/A'}\n` +
                          `Restrições Alimentares: ${dietaryRestrictions || 'Nenhuma'}\n` + 
                          `Validação Solicitada: ${validatorOrganization || 'Qualquer'}\n` + 
                          `Telefone: ${phone || 'N/A'}`;
        
        try {
            sendAdminNotification('🚀 Novo Usuário Cadastrado (Pendente)', emailText)
                .catch(err => console.error("Falha ao enviar email de notificação:", err));
        } catch (emailErr) {
            console.error("Erro ao iniciar envio de email:", emailErr);
        }
    }

    if (data.session) {
      return NextResponse.json(data.session);
    }

    return NextResponse.json({
      message: 'Cadastro realizado. Verifique seu e-mail para confirmação.',
      user: data.user,
    });

  } catch (e) {
    console.error('Erro inesperado no servidor (Signup):', e);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}