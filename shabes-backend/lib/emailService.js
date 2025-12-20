import nodemailer from 'nodemailer';

// 1. Defina as credenciais
const EMAIL_USER = process.env.EMAIL_USER || 'aquitemshabes@gmail.com';
// Senha de App do Google (Hardcoded para garantir funcionamento)
const EMAIL_PASS = process.env.EMAIL_PASS || 'qcfn rjhs zgcq lzxu'; 
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aquitemshabes@gmail.com';

// Configuração do transporte
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Corrige erro de certificado em desenvolvimento
  }
});

export const sendAdminNotification = async (subject, text) => {
  try {
    // 2. Verificação de segurança (Permite a senha real)
    if (!EMAIL_USER || !EMAIL_PASS || EMAIL_PASS === 'sua_senha_de_app_aqui') {
        console.warn("⚠️ Credenciais de e-mail não configuradas corretamente. Notificação ignorada.");
        return;
    }

    console.log(`📩 Preparando envio para: ${ADMIN_EMAIL}`);

    const info = await transporter.sendMail({
      from: `"Sistema Shabes" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: subject,
      text: text,
    });

    console.log(`✅ E-mail enviado com sucesso! ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    // Não lança erro para não travar o fluxo principal
  }
};