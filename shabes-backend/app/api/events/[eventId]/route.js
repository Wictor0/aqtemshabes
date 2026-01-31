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
        // Captura do ID de forma robusta
        const eventId = params?.id || params?.eventId; 
        
        if (!eventId || eventId === 'undefined' || eventId === 'null') {
            return NextResponse.json({ error: 'ID do evento inválido.' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();

        console.log(`[GET_EVENT] Iniciando busca para o evento: ${eventId}`);

        /**
         * Tentativa de consulta expandida.
         * Se esta consulta falhar, o erro aparecerá detalhado no console do Render.
         */
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
                matches:event_matches (
                    id,
                    status,
                    personal_message,
                    guest:profiles!event_matches_guest_id_fkey (
                        id,
                        full_name,
                        push_token
                    )
                )
            `)
            .eq('id', eventId)
            .single();

        if (error) {
            // Log detalhado para diagnóstico no Render
            console.error("[GET_EVENT] Erro na consulta Supabase:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });

            if (error.code === 'PGRST116') { 
                return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
            }
            
            // Retorna o erro específico do banco para ajudar no debug do frontend
            return NextResponse.json({ 
                error: 'Erro na consulta ao banco de dados', 
                details: error.message 
            }, { status: 500 });
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
        console.error('[GET_EVENT] Erro crítico inesperado:', e);
        return NextResponse.json({ 
            error: 'Erro interno no servidor.',
            message: e.message 
        }, { status: 500 });
    }
}