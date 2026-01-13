import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerificationHtml } from '../../../../src/templates/verificationPage';

// Esta rota deve ser obrigatoriamente GET para processar o clique no link do email
export const dynamic = 'force-dynamic';

const SITE_URL = "https://aqtemshabes.onrender.com";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    console.log("[AUTH-CONFIRM] Rota atingida.");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return new NextResponse(getVerificationHtml('error'), { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log("[AUTH-CONFIRM] Sucesso na verificação.");
        return new NextResponse(getVerificationHtml('success'), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    return new NextResponse(getVerificationHtml('error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error("[AUTH-CONFIRM] Erro crítico:", err);
    return new NextResponse(getVerificationHtml('error'), { 
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}