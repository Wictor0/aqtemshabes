import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ======================
// Cliente de Administrador (ignora RLS)
// ======================
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// A função GET para buscar detalhes não muda
export async function GET(request, { params }) {
    const { matchId } = params;
    const supabase = createRouteHandlerClient({ cookies });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('matches')
        .select(`
      id, status, personal_message, created_at,
      guest:profiles(id, full_name, email, phone),
      event:events(
        id, title, date, host_id,
        host:profiles!events_host_id_fkey(id, full_name, email, phone)
      )
    `)
        .eq('id', matchId)
        .single();

    if (error) {
        console.error("Erro ao buscar detalhes do match:", error);
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Match não encontrado ou acesso negado.' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// ================= PATCH (FUNÇÃO FINAL E CORRIGIDA) =================
export async function PATCH(request, { params }) {
    const { matchId } = params;
    const { status } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    if (!matchId || !status || (status !== 'accepted' && status !== 'declined')) {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    // 1. Verificação de segurança no código do backend
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('event:events(host_id)')
        .eq('id', matchId)
        .single();

    if (matchError || !match) {
        return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 });
    }
    
    if (match.event?.host_id !== user.id) {
        return NextResponse.json({ error: 'Apenas o anfitrião pode modificar este pedido.' }, { status: 403 });
    }

    // 2. MODIFICAÇÃO: Usar o cliente de administrador para a atualização
    const { error: updateError } = await supabaseAdmin
        .from('matches')
        .update({ status })
        .eq('id', matchId);


    if (updateError) {
        console.error("🔥 Erro ao ATUALIZAR o status do match:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("✅ Status do match atualizado com sucesso via Admin:", matchId);
    return NextResponse.json({ message: "Status atualizado com sucesso" });
}

