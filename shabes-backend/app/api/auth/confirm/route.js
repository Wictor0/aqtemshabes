import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerificationHtml } from '../../../../src/templates/verificationPage';

// Forçamos a rota a ser dinâmica para evitar que o build do Next.js tente pré-renderizá-la sem as variáveis de ambiente
export const dynamic = 'force-dynamic';

/**
 * Rota de confirmação de e-mail (Supabase Auth)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    console.log("[AUTH] Processando confirmação de e-mail...");

    // Validação de segurança das chaves de ambiente
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[AUTH] ERRO CRÍTICO: Variáveis de ambiente do Supabase ausentes no servidor.");
      const errorHtml = getVerificationHtml('error');
      return new NextResponse(errorHtml, { 
        status: 500, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    if (code) {
      // Inicialização padrão recomendada para Next.js 14
      const supabase = createRouteHandlerClient({ cookies });
      
      // Troca o código pela sessão real
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log("[AUTH] Sucesso: E-mail verificado.");
        const successHtml = getVerificationHtml('success');
        return new NextResponse(successHtml, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      console.error("[AUTH] Erro do Supabase ao trocar código:", error.message);
    }

    // Retorno padrão para links inválidos ou sem código
    console.warn("[AUTH] Aviso: Link inválido ou código expirado.");
    const invalidHtml = getVerificationHtml('error');
    return new NextResponse(invalidHtml, {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error("[AUTH] Erro inesperado na rota:", err);
    // Em caso de erro catastrófico, tentamos retornar o HTML de erro
    try {
      return new NextResponse(getVerificationHtml('error'), { 
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    } catch {
      return new NextResponse("Erro interno no servidor.", { status: 500 });
    }
  }
}