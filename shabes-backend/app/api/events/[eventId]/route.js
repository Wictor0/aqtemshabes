import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Desabilita o cache para esta rota
export const dynamic = 'force-dynamic';

const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

// ======================
// GET /api/events/[eventId]
// Busca um evento específico pelo ID
// ======================
export async function GET(request, { params }) {
    try {
        const { eventId } = params;
        if (!eventId) {
            return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();

        // 👇 --- CORREÇÃO APLICADA AQUI --- 👇
        // Trocamos 'host:profiles' por 'host:profiles!events_host_id_fkey'
        // para dizer ao Supabase qual "join" usar.
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
                    phone
                )
            `)
            .eq('id', eventId)
            .single();
        // 👆 --- FIM DA CORREÇÃO --- 👆

        if (error) {
            if (error.code === 'PGRST116') { // Código para 'Not Found'
                return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
            }
            throw error;
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
        console.error('Erro ao buscar evento por ID:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}