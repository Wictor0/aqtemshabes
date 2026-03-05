import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Desabilita o cache para garantir dados sempre atualizados
export const dynamic = 'force-dynamic';

const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * GET /api/events/[id]
 * Busca detalhes do evento, incluindo tokens para notificações.
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
                    id,
                    full_name,
                    username,
                    avatar_url,
                    phone,
                    push_token
                ),
                matches (
                    id,
                    status,
                    personal_message,
                    guest:profiles (
                        id,
                        full_name,
                        push_token
                    )
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
 * 👇 NOVA FUNÇÃO ADICIONADA 👇
 * DELETE /api/events/[id]
 * Remove o evento e, por cascata, os matches relacionados.
 */
export async function DELETE(request, { params }) {
    try {
        const eventId = params?.id || params?.eventId;

        if (!eventId || eventId === 'undefined' || eventId === 'null') {
            return NextResponse.json({ error: 'ID do evento inválido para exclusão.' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();
        console.log(`[DELETE_EVENT] Solicitada exclusão do evento: ${eventId}`);

        // Executa a deleção no Supabase
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error("[DELETE_EVENT] Erro ao deletar no Supabase:", {
                code: error.code,
                message: error.message
            });
            return NextResponse.json({ 
                error: 'Não foi possível deletar o evento no banco de dados.',
                details: error.message 
            }, { status: 500 });
        }

        console.log(`[DELETE_EVENT] Evento ${eventId} removido com sucesso.`);

        return NextResponse.json({ message: 'Evento removido com sucesso!' }, { status: 200 });

    } catch (e) {
        console.error('[DELETE_EVENT] Erro crítico inesperado:', e);
        return NextResponse.json({ 
            error: 'Erro interno no servidor ao tentar excluir.',
            message: e.message 
        }, { status: 500 });
    }
}