import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Função para criar um cliente Supabase "público" (anon)
const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

// ======================
// GET /api/profile/[userId]/history
// Busca o histórico de eventos (SEM CÁLCULO DE AVALIAÇÃO)
// ======================
export async function GET(request, { params }) {
    try {
        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();
        const today = new Date().toISOString();

        // 1. Busca todos os eventos passados e seus matches aceitos
        const { data: events, error } = await supabase
            .from('events')
            .select(`
                id,
                title,
                date,
                matches (
                    status,
                    dependent_ids
                )
            `)
            .eq('host_id', userId)
            .lt('date', today);

        if (error) {
            throw error;
        }

        // 2. Processa os dados
        const history = events.map(event => {
            const acceptedMatches = event.matches.filter(m => m.status === 'accepted');
            
            // LÓGICA DE AVALIAÇÃO REMOVIDA

            const guestCount = acceptedMatches.length;

            const dependentCount = acceptedMatches.reduce((total, match) => {
                return total + (match.dependent_ids ? match.dependent_ids.length : 0);
            }, 0);

            return {
                id: event.id,
                title: event.title,
                date: event.date,
                guestCount: guestCount,
                dependentCount: dependentCount,
                // averageRating: null, // REMOVIDO
            };
        })
        .filter(event => event.guestCount > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));


        return NextResponse.json(history);

    } catch (e) {
        console.error('Erro ao buscar histórico de eventos:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}