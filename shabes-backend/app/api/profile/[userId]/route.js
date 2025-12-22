import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Desabilita o cache para esta rota para garantir dados frescos
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        // 1. Autenticação (Obrigatória para ver perfis)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // 2. Busca Perfil Público (SEM DADOS SENSÍVEIS INICIAIS)
        // Removemos 'phone' desta lista inicial
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                username,
                avatar_url,
                birth_date,
                role,
                validator_organization,
                dietary_restrictions,
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
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
            }
            throw error;
        }

        // 3. Verifica Permissão para Dados Sensíveis (Telefone)
        let showSensitiveInfo = false;

        if (user.id === userId) {
            // Vendo o próprio perfil
            showSensitiveInfo = true;
        } else {
            // Verifica conexão por Match Aceito
            
            // A: Eu sou o Convidado, ele é o Anfitrião
            const { data: asGuest } = await supabase
                .from('matches')
                .select('id, event!inner(host_id)')
                .eq('guest_id', user.id)
                .eq('event.host_id', userId)
                .eq('status', 'accepted')
                .maybeSingle();

            // B: Eu sou o Anfitrião, ele é o Convidado
            const { data: asHost } = await supabase
                .from('matches')
                .select('id')
                .eq('guest_id', userId) // Ele é o convidado
                .eq('status', 'accepted')
                // Precisamos verificar se o evento é meu. 
                // A query abaixo faz join com events onde host_id sou eu
                .not('event_id', 'is', null) // Garante que tem evento
                .filter('event.host_id', 'eq', user.id) // *Nota: Filter complexo em join pode precisar de !inner.
                // Simplificando com !inner no select:
                .select('id, event!inner(host_id)')
                .eq('event.host_id', user.id)
                .maybeSingle();

            if (asGuest || asHost) {
                showSensitiveInfo = true;
            }
        }

        // 4. Se autorizado, busca o telefone
        if (showSensitiveInfo) {
            const { data: sensitiveData } = await supabase
                .from('profiles')
                .select('phone')
                .eq('id', userId)
                .single();
            
            if (sensitiveData) {
                profile.phone = sensitiveData.phone;
            }
        }

        return NextResponse.json(profile, {
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