import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
// 1. IMPORTAR O noStore FOI REMOVIDO

// A CORREÇÃO: Força o Next.js a nunca cachear esta rota
export const dynamic = 'force-dynamic';

// Função para criar um cliente Supabase "público" (anon)
const createPublicSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

// ======================
// GET /api/profile/[userId]
// Busca um perfil público e seus dependentes
// ======================
export async function GET(request, { params }) {
    // 2. CHAMAR O noStore() FOI REMOVIDO DAQUI
    // noStore(); 

    try {
        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        const supabase = createPublicSupabaseClient();

        // Busca o perfil E seus dependentes de uma só vez
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                username,
                avatar_url,
                birth_date,
                phone,
                interests, 
                dependents (
                    id,
                    name,
                    birth_date,
                    relationship,
                    description
                )
            `)
            .eq('id', userId)
            .single();

        if (error) {
            // Se o perfil não for encontrado (comum)
            if (error.code === 'PGRST116') { 
                return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
            }
            // Outro erro de banco
            throw error;
        }

        // 3. ADICIONADO HEADERS DE CACHE NA RESPOSTA
        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (e) {
        console.error('Erro ao buscar perfil:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}