import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getVerificationHtml } from '../../../../src/templates/verificationPage';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[AUTH] Erro: Chaves do Supabase ausentes no Render.");
      return new NextResponse(getVerificationHtml('error'), { 
        status: 500, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        return new NextResponse(getVerificationHtml('success'), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      console.error("[AUTH] Erro Supabase:", error.message);
    }

    return new NextResponse(getVerificationHtml('error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error("[AUTH] Erro crítico:", err);
    return new NextResponse(getVerificationHtml('error'), { 
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}