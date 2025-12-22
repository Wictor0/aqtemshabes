import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
// Importação usando caminho relativo seguro (4 níveis acima até a raiz)
import { sendAdminNotification } from '../../../../lib/emailService';

const getSupabaseClient = (authHeader) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
    );
};

// ======================
// PATCH /api/matches/[matchId]
// Atualiza o status (Anfitrião) ou a avaliação (Convidado)
// ======================
export async function PATCH(request, { params }) {
    try {
        const { matchId } = params;
        const body = await request.json();
        const { status, rating, rating_comment } = body;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const supabase = getSupabaseClient(authHeader);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Busca o match E o evento associado
        const { data: match, error: fetchError } = await supabase
            .from('matches')
            .select(`
                guest_id,
                status,
                event_id, 
                event:events (
                    host_id,
                    date,
                    title
                )
            `)
            .eq('id', matchId)
            .single();

        if (fetchError || !match) {
            return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 });
        }

        // 🛡️ SEGURANÇA: Verifica se os dados do evento vieram corretamente
        if (!match.event) {
             console.error("Erro crítico: Match existe mas evento associado não foi encontrado ou retornado.");
             return NextResponse.json({ error: 'Dados do evento não encontrados. Contate o suporte.' }, { status: 500 });
        }

        let dataToUpdate = {};
        let validationError = null;

        // --- LÓGICA 1: Atualizando o STATUS (Ação do Anfitrião) ---
        if (status) {
            if (match.event.host_id !== user.id) {
                validationError = 'Apenas o anfitrião pode aceitar ou recusar pedidos.';
            } else {
                dataToUpdate = { status: status };
            }
        }
        // --- LÓGICA 2: Enviando AVALIAÇÃO/REPORTE (Ação do Convidado) ---
        else if (rating != null) {
            if (match.guest_id !== user.id) {
                validationError = 'Apenas o convidado pode avaliar este evento.';
            }
            else if (match.status !== 'accepted') {
                validationError = 'Você só pode avaliar eventos que participou.';
            }
            // Verifica a data com segurança
            else if (new Date(match.event.date) > new Date()) {
                validationError = 'Você só pode avaliar eventos após a data do mesmo.';
            }
            else {
                dataToUpdate = { 
                    rating: rating,
                    rating_comment: rating_comment || null
                };

                // 👇 LÓGICA DE NOTIFICAÇÃO POR EMAIL 👇
                if (rating <= 3 || (rating_comment && rating_comment.trim().length > 0)) {
                    const reportType = rating <= 2 ? '🚨 ALERTA: Reporte Crítico' : '📝 Novo Reporte de Evento';
                    const emailBody = `Um usuário enviou um reporte sobre um Shabat.\n\n` +
                        `📋 Detalhes:\n` +
                        `- Evento: ${match.event.title}\n` +
                        `- Data: ${new Date(match.event.date).toLocaleDateString('pt-BR')}\n` +
                        `- Nota: ${rating} / 5\n` +
                        `- Comentário: "${rating_comment || 'Sem comentário'}"\n\n` +
                        `🔍 IDs:\n Match: ${matchId}\n Evento: ${match.event_id}\n Autor: ${user.id}`;

                    try {
                        sendAdminNotification(
                            `${reportType} - ${match.event.title || 'Evento'}`,
                            emailBody
                        ).catch(err => console.error("Erro assíncrono no envio de email:", err));
                    } catch (emailErr) {
                        console.error("Erro ao iniciar serviço de email:", emailErr);
                    }
                }
            }
        }
        else {
            return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
        }

        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 403 });
        }

        // --- Executa a Atualização no Banco ---
        const { data, error } = await supabase
            .from('matches')
            .update(dataToUpdate)
            .eq('id', matchId)
            .select(); 

        if (error || !data || data.length === 0) {
            console.error("Erro ou falha de RLS ao atualizar match:", error);
            return NextResponse.json({ 
                error: error?.message || "Falha ao atualizar. Verifique permissões." 
            }, { status: 403 });
        }

        // 👇 --- LÓGICA 3 (CORRIGIDA COM ADMIN): CANCELAMENTO AUTOMÁTICO --- 👇
        if (status === 'accepted') {
            try {
                // Usamos a Service Role Key para criar um cliente com permissão total (Admin).
                // Isso permite ver e editar matches de outros anfitriões para fazer a limpeza.
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    { global: { headers: { Authorization: authHeader } } }
                );

                // 1. Busca TODOS os matches pendentes desse convidado
                const { data: userPendingMatches } = await supabaseAdmin
                    .from('matches')
                    .select('id, event:events(date)') 
                    .eq('guest_id', match.guest_id)   
                    .eq('status', 'pending')          
                    .neq('id', matchId);              

                if (userPendingMatches && userPendingMatches.length > 0) {
                    // Normaliza a data do evento atual para YYYY-MM-DD
                    const targetDate = new Date(match.event.date).toISOString().split('T')[0];

                    const conflictIds = userPendingMatches
                        .filter(m => m.event && new Date(m.event.date).toISOString().split('T')[0] === targetDate)
                        .map(m => m.id);

                    if (conflictIds.length > 0) {
                        console.log(`⚡ Conflito de agenda (Admin): Cancelando automaticamente ${conflictIds.length} pedidos do usuário ${match.guest_id} para a data ${targetDate}`);

                        // 3. Atualiza esses matches para 'declined' usando o Admin
                        await supabaseAdmin
                            .from('matches')
                            .update({ status: 'declined' }) 
                            .in('id', conflictIds);
                    }
                }
            } catch (autoCancelError) {
                console.error("Erro no cancelamento automático de conflitos:", autoCancelError);
            }
        }
        // 👆 --- FIM DA LÓGICA DE CANCELAMENTO --- 👆

        return NextResponse.json(data[0]);

    } catch (e) {
        // Log detalhado do erro para debug
        console.error('CRASH no PATCH /api/matches:', e);
        return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
    }
}