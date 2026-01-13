import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerificationHtml } from '../../../../src/templates/verificationPage';

// Definimos o URL de produção de forma fixa para garantir consistência nos redirecionamentos
const SITE_URL = "https://aqtemshabes.onrender.com";
const redirectTo = `${SITE_URL}/api/auth/confirm`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Logs para debug no console do Render para verificar se a rota foi atingida
    console.log(`[AUTH] Rota atingida: ${redirectTo}`);
    console.log("[AUTH] Código de verificação:", code ? "Presente" : "Ausente");

    // Verificação de segurança das variáveis de ambiente
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("ERRO: Variáveis de ambiente do Supabase não configuradas no Render!");
      return new NextResponse(getVerificationHtml('error'), { status: 500 });
    }

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Troca o código temporário por uma sessão real, confirmando o email no DB
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log("[AUTH] Sucesso: Email verificado com sucesso.");
        return new NextResponse(getVerificationHtml('success'), {
          headers: { 'Content-Type': 'text/html' },
        });
      } else {
        console.error("[AUTH] Erro do Supabase na troca do código:", error.message);
      }
    }

    // Se chegar aqui sem código ou com erro na troca, mostra a página de link inválido
    console.warn("[AUTH] Aviso: Tentativa de confirmação com link inválido ou expirado.");
    return new NextResponse(getVerificationHtml('error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error("[AUTH] Erro inesperado na rota de confirmação:", err);
    return new NextResponse(getVerificationHtml('error'), { 
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
// update