import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerificationHtml } from '../../../../src/templates/verificationPage';

// Garantimos que a rota é dinâmica para evitar erros de cache durante o build no Render
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    console.log("[AUTH] Tentativa de confirmação de e-mail iniciada.");

    // Verificação das variáveis de ambiente necessárias para o Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[AUTH] Erro: Variáveis de ambiente do Supabase não configuradas no Render.");
      return new NextResponse(getVerificationHtml('error'), { 
        status: 500, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Troca o código temporário do Supabase por uma sessão real do utilizador
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log("[AUTH] Sucesso: E-mail verificado e sessão criada.");
        return new NextResponse(getVerificationHtml('success'), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      console.error("[AUTH] Erro ao trocar código por sessão:", error.message);
    }

    // Caso não exista código ou ocorra um erro na validação
    console.warn("[AUTH] Aviso: Código de confirmação inválido ou link expirado.");
    return new NextResponse(getVerificationHtml('error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error("[AUTH] Erro crítico inesperado na rota de confirmação:", err);
    return new NextResponse(getVerificationHtml('error'), { 
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}