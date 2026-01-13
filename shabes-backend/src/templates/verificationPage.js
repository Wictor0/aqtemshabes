/**
 * Este ficheiro gera o HTML para as páginas de sucesso ou erro.
 * Localização: shabes-backend/src/templates/verificationPage.js
 */

export const getVerificationHtml = (status) => {
  const isSuccess = status === 'success';
  
  const title = isSuccess ? 'E-mail Verificado!' : 'Link Expirado ou Inválido';
  const message = isSuccess 
    ? 'O seu e-mail foi verificado com sucesso. Agora já pode aceder a todas as funcionalidades do Aquitemshabes.' 
    : 'Infelizmente não conseguimos verificar o seu e-mail. O link pode ter expirado ou já ter sido utilizado.';
  
  const color = isSuccess ? '#4F46E5' : '#EF4444';
  const icon = isSuccess ? '✓' : '✕';

  // Adicionámos o comentário /* html */ antes da string. 
  // Isto ajuda o VS Code e extensões como a 'es6-string-html' a colorir o HTML interno.
  return /* html */ `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #F9FAFB;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon-circle {
                width: 80px;
                height: 80px;
                background-color: ${color}15;
                color: ${color};
                border-radius: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 24px;
                font-weight: bold;
            }
            h1 { color: #111827; font-size: 24px; margin-bottom: 16px; }
            p { color: #4B5563; line-height: 1.5; margin-bottom: 32px; }
            .button {
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon-circle">${icon}</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="aquitemshabes://" class="button">Abrir Aplicativo</a>
        </div>
    </body>
    </html>
  `;
};