import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Desabilita o cache para garantir dados sempre atualizados (essencial para tokens)
export const dynamic = 'force-dynamic';

const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

/**
 * GET /api/events/[id]
 * Busca um evento específico pelo ID e inclui os dados do anfitrião e dos convidados interessados.
 */
export async function GET(request, { params }) {
    try {
        // LOG DE DEPURAÇÃO: Verifique os logs no Render para ver o conteúdo de 'params'
        console.log("[GET_EVENT] Parâmetros recebidos na rota:", params);

        // Next.js mapeia o nome da pasta [id] para params.id. 
        const eventId = params?.id || params?.eventId; 
        
        if (!eventId || eventId === 'undefined' || eventId === 'null') {
            console.error("[GET_EVENT] Erro 400: ID do evento ausente ou inválido no URL.");
            return NextResponse.json({ 
                error: 'ID do evento é obrigatório e deve ser válido.',
                receivedParams: params 
            }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();

        // ATUALIZAÇÃO: Agora incluímos os matches e os push_tokens dos convidados (guest)
        // Isso permite que o anfitrião saiba para quem enviar a notificação de "Aceito"
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                host:profiles!events_host_id_fkey (
                    id,
                    full_name,
                    username,
                    avatar_url,
                    birth_date,
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
                        avatar_url,
                        push_token
                    )
                )
            `)
            .eq('id', eventId)
            .single();

        if (error) {
            console.error("[GET_EVENT] Erro na consulta Supabase:", error.message);
            if (error.code === 'PGRST116') { 
                return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
            }
            throw error;
        }

        // Retornamos os dados com headers para evitar cache agressivo no telemóvel
        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (e) {
        console.error('Erro crítico ao processar pedido de evento:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}