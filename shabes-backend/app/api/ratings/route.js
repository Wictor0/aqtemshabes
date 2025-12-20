import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer'; // <--- Mudamos para Nodemailer

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Falta token' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { matchId, rating, comment } = body;

    console.log(`📝 Salvando avaliação... Match: ${matchId}`);

    // 1. Salva no Banco (Sem a coluna updated_at se não criou no banco ainda)
    const { data, error } = await supabase
      .from('matches')
      .update({ 
        rating: rating, 
        rating_comment: comment
        // updated_at: new Date().toISOString() // Descomente se tiver criado a coluna
      })
      .eq('id', matchId)
      .eq('guest_id', user.id)
      .select('*, event:events(title, date)')
      .single();

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ============================================================
    // 2. DISPARAR E-MAIL VIA GMAIL (Nodemailer)
    // Se a nota for baixa (3 ou menos), manda alerta.
    // ============================================================
    if (rating <= 3) {
      console.log('📧 Configurando envio via Gmail...');
      
      try {
        // Configura o transporte com suas credenciais do .env
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER, // aquitemshabes@gmail.com
            pass: process.env.EMAIL_PASS  // qcfn rjhs ...
          }
        });

        // Envia o e-mail
        await transporter.sendMail({
          from: `"App Shabbat" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL, 
          subject: `⚠️ Ocorrência: ${data.event?.title || 'Evento sem nome'}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #d32f2f;">Nova Ocorrência Reportada</h2>
              <p><strong>Evento:</strong> ${data.event?.title}</p>
              <p><strong>Nota:</strong> ${rating}/5 ⭐</p>
              <div style="background: #fff3cd; padding: 15px; border-left: 5px solid #ffc107; margin: 20px 0;">
                <strong>Relato do Usuário:</strong><br/>
                "${comment || "Sem comentário escrito."}"
              </div>
              <p style="color: #666; font-size: 12px;">
                Match ID: ${matchId} <br/>
                Usuário ID: ${user.id}
              </p>
            </div>
          `
        });
        
        console.log('✅ E-mail enviado com sucesso via Gmail!');
      } catch (emailError) {
        console.error('❌ Falha ao enviar e-mail:', emailError);
        // Não quebra o request, pois o banco já salvou
      }
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Erro Geral:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}