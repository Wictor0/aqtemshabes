import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Desabilita o cache para garantir dados sempre atualizados
export const dynamic = 'force-dynamic';

// Cliente para operações públicas (Leitura)
const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

// 👇 NOVO: Cliente Admin para ignorar RLS (Escrita/Exclusão)
const createAdminSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // 👈 Certifique-se de que esta variável está no Render
    );
};

/**
 * GET /api/events/[id]
 */
export async function GET(request, { params }) {
    try {
        const eventId = params?.id || params?.eventId; 
        
        if (!eventId || eventId === 'undefined' || eventId === 'null') {
            return NextResponse.json({ error: 'ID do evento inválido.' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();
        console.log(`[GET_EVENT] Iniciando busca para o evento: ${eventId}`);

        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                host:profiles!events_host_id_fkey (
                    id, full_name, username, avatar_url, phone, push_token
                ),
                matches (
                    id, status, personal_message,
                    guest:profiles ( id, full_name, push_token )
                )
            `)
            .eq('id', eventId)
            .single();

        if (error) {
            console.error("[GET_EVENT] Erro na consulta Supabase:", error);
            if (error.code === 'PGRST116') { 
                return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Erro no banco', details: error.message }, { status: 500 });
        }

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (e) {
        console.error('[GET_EVENT] Erro crítico:', e);
        return NextResponse.json({ error: 'Erro interno.', message: e.message }, { status: 500 });
    }
}

/**
 * DELETE /api/events/[id]
 * Agora usando privilégios administrativos para garantir a remoção.
 */
export async function DELETE(request, { params }) {
    try {
        const eventId = params?.id || params?.eventId;

        if (!eventId || eventId === 'undefined' || eventId === 'null') {
            return NextResponse.json({ error: 'ID do evento inválido para exclusão.' }, { status: 400 });
        }

        // 👇 Mudança para o cliente ADMIN
        const supabaseAdmin = createAdminSupabaseClient();
        console.log(`[DELETE_EVENT] Solicitada exclusão do evento (ADMIN MODE): ${eventId}`);

        // Executa a deleção com contagem exata para verificação
        const { error, count } = await supabaseAdmin
            .from('events')
            .delete({ count: 'exact' }) 
            .eq('id', eventId);

        if (error) {
            console.error("[DELETE_EVENT] Erro ao deletar no Supabase:", {
                code: error.code,
                message: error.message
            });
            return NextResponse.json({ 
                error: 'Erro no banco de dados ao excluir.',
                details: error.message 
            }, { status: 500 });
        }

        // 👇 Se count for 0, o evento não existia ou o comando falhou silenciosamente
        if (count === 0) {
            console.warn(`[DELETE_EVENT] Nenhuma linha foi removida para o ID: ${eventId}`);
            return NextResponse.json({ error: 'O evento não foi encontrado ou já foi removido.' }, { status: 404 });
        }

        console.log(`[DELETE_EVENT] Evento ${eventId} e dependências removidos com sucesso. Linhas afetadas: ${count}`);

        return NextResponse.json({ message: 'Evento removido com sucesso!' }, { status: 200 });

    } catch (e) {
        console.error('[DELETE_EVENT] Erro crítico inesperado:', e);
        return NextResponse.json({ 
            error: 'Erro interno no servidor ao tentar excluir.',
            message: e.message 
        }, { status: 500 });
    }
}