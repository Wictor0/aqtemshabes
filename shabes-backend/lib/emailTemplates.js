// Estilos base para reutilização
const styles = {
  container: `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
  `,
  header: `
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    padding: 30px;
    text-align: center;
  `,
  headerTitle: `
    color: #ffffff;
    margin: 0;
    font-size: 24px;
    font-weight: bold;
  `,
  content: `
    padding: 30px;
    color: #374151;
    line-height: 1.6;
  `,
  dataBox: `
    background-color: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  `,
  dataRow: `
    margin-bottom: 10px;
    display: flex;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  `,
  label: `
    font-weight: bold;
    color: #4B5563;
    width: 140px;
    display: inline-block;
  `,
  value: `
    color: #1F2937;
  `,
  footer: `
    background-color: #F3F4F6;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #9CA3AF;
  `,
  button: `
    display: inline-block;
    background-color: #4F46E5;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    margin-top: 20px;
  `
};

// Template Base (Wrapper)
const wrapEmail = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <h1 style="${styles.headerTitle}">Shabes</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Conectando Comunidades</p>
    </div>
    <div style="${styles.content}">
      <h2 style="color: #1F2937; margin-top: 0;">${title}</h2>
      ${bodyContent}
    </div>
    <div style="${styles.footer}">
      <p>© ${new Date().getFullYear()} Shabes App. Todos os direitos reservados.</p>
      <p>Esta é uma mensagem automática do sistema.</p>
    </div>
  </div>
</body>
</html>
`;

// --- TEMPLATE 1: Novo Usuário (Para Admin) ---
export const getNewUserTemplate = (data) => {
  const content = `
    <p>Um novo usuário acabou de se cadastrar na plataforma e está com status <strong>Pendente</strong>.</p>
    
    <div style="${styles.dataBox}">
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Nome:</span>
        <span style="${styles.value}">${data.name}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Email:</span>
        <span style="${styles.value}">${data.email}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Telefone:</span>
        <span style="${styles.value}">${data.phone || 'N/A'}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Endereço:</span>
        <span style="${styles.value}">${data.address || 'N/A'}</span>
      </div>
      <div>
        <span style="${styles.label}">Dieta:</span>
        <span style="${styles.value}">${data.dietary || 'N/A'}</span>
      </div>
    </div>

    <p>Acesse o painel administrativo do Supabase para aprovar ou rejeitar este usuário.</p>
  `;
  
  return wrapEmail('🚀 Novo Cadastro Pendente', content);
};

// --- TEMPLATE 2: Reporte/Avaliação (Para Admin) ---
export const getReportTemplate = (data) => {
  const isCritical = data.rating <= 2;
  const titleColor = isCritical ? '#DC2626' : '#4F46E5';
  const titleIcon = isCritical ? '🚨' : '📝';
  
  const content = `
    <p style="font-size: 16px;">Um usuário enviou um reporte sobre o evento <strong>"${data.eventTitle}"</strong>.</p>
    
    <div style="${styles.dataBox}; border-left: 4px solid ${titleColor};">
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Data do Evento:</span>
        <span style="${styles.value}">${data.eventDate}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <span style="${styles.label}">Nota:</span>
        <span style="color: #F59E0B; font-weight: bold; font-size: 18px;">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</span>
        <span style="color: #6B7280; font-size: 14px;">(${data.rating}/5)</span>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #d1d5db;">
        <span style="${styles.label}">Comentário:</span>
        <p style="background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #eee; margin-top: 5px; font-style: italic;">
          "${data.comment || 'Sem comentário por escrito.'}"
        </p>
      </div>
    </div>

    <div style="font-size: 12px; color: #6B7280; margin-top: 20px;">
      <p><strong>IDs para referência:</strong></p>
      <ul>
        <li>Match ID: ${data.matchId}</li>
        <li>Evento ID: ${data.eventId}</li>
        <li>Autor (Guest) ID: ${data.authorId}</li>
      </ul>
    </div>
  `;
  
  return wrapEmail(`${titleIcon} Novo Reporte de Evento`, content);
};