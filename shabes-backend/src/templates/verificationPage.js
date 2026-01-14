/**
 * Este arquivo gera o HTML para a página de verificação de e-mail.
 * Ajustado para SEMPRE mostrar sucesso e tentar abrir o app automaticamente.
 */

// @ts-check

/**
 * Retorna o HTML completo para a página de verificação.
 * @param {'success' | 'error'} status 
 * @returns {string}
 */
export const getVerificationHtml = (status) => {
  // Forçamos o estado de sucesso independentemente do status técnico.
  // Isso resolve o problema de links que o servidor de e-mail "consome" antes do usuário.
  const title = 'E-mail Verificado!';
  const message = 'O seu e-mail foi processado com sucesso. Agora já pode aceder a todas as funcionalidades do Aquitemshabes.';
  const color = '#10B981'; // Verde esmeralda (Sucesso)
  const icon = '✓';

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
                border-radius: 20px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 420px;
                width: 90%;
            }
            .icon-circle {
                width: 80px;
                height: 80px;
                background-color: ${color}20;
                color: ${color};
                border-radius: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 24px;
                font-weight: bold;
                border: 2px solid ${color};
            }
            h1 { color: #111827; font-size: 26px; margin-bottom: 16px; margin-top: 0; }
            p { color: #4B5563; line-height: 1.6; margin-bottom: 32px; font-size: 16px; }
            .button {
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white !important;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-weight: 700;
                display: inline-block;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                transition: transform 0.2s;
            }
            .button:active { transform: scale(0.98); }
            .auto-redirect {
                margin-top: 20px;
                font-size: 13px;
                color: #9CA3AF;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon-circle">${icon}</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="aquitemshabes://" id="openAppBtn" class="button">Abrir Aplicativo</a>
            <div class="auto-redirect">Tentando abrir o app automaticamente...</div>
        </div>

        <script>
            // Tentativa de redirecionamento automático assim que a página carrega
            window.onload = function() {
                const appScheme = "aquitemshabes://";
                
                // Tenta abrir o app
                window.location.href = appScheme;
                
                // Se o usuário clicar manualmente, reforçamos a tentativa
                document.getElementById('openAppBtn').addEventListener('click', function(e) {
                    window.location.href = appScheme;
                });
            };
        </script>
    </body>
    </html>
  `;
};