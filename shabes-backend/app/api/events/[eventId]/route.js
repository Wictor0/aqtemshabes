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
 * Busca um evento específico pelo ID e inclui os dados do anfitrião necessários para notificações.
 */
export async function GET(request, { params }) {
    try {
        // Next.js mapeia o nome da pasta [id] para params.id
        const eventId = params.id; 
        
        if (!eventId) {
            return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();

        // Buscamos o evento e fazemos o JOIN com a tabela profiles.
        // Adicionamos 'push_token' na seleção para que o frontend consiga notificar o anfitrião.
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
                )
            `)
            .eq('id', eventId)
            .single();

        if (error) {
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
        console.error('Erro ao buscar evento por ID:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}