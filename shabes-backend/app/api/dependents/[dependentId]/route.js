import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const getSupabaseClient = (authHeader) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
    );
};

// ===========================================
// PATCH /api/dependents/[dependentId]
// Atualiza um dependente específico.
// ===========================================
export async function PATCH(request, { params }) {
    const { dependentId } = params;
    const dependentData = await request.json();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    console.log(`[API LOG] Tentativa de PATCH no dependente ID: ${dependentId}`);
    console.log(`[API LOG] Pelo utilizador ID: ${user.id}`);
    console.log(`[API LOG] Com os dados:`, dependentData);

    delete dependentData.id;
    delete dependentData.user_id;
    delete dependentData.created_at;

    try {
        const { data, error } = await supabase
            .from('dependents')
            .update(dependentData)
            .eq('id', dependentId)
            .eq('user_id', user.id)
            .select()
            .single();
        
        if (error) {
            console.error("[API LOG] Erro do Supabase ao atualizar dependente:", error);
            throw error;
        }
        
        console.log("[API LOG] Dependente atualizado com sucesso:", data);
        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ===========================================
// DELETE /api/dependents/[dependentId]
// Apaga um dependente específico.
// ===========================================
export async function DELETE(request, { params }) {
    const { dependentId } = params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    console.log(`[API LOG] Tentativa de DELETE no dependente ID: ${dependentId}`);
    console.log(`[API LOG] Pelo utilizador ID: ${user.id}`);

    try {
        const { error } = await supabase
            .from('dependents')
            .delete()
            .eq('id', dependentId)
            .eq('user_id', user.id);

        if (error) {
            console.error("[API LOG] Erro do Supabase ao apagar dependente:", error);
            throw error;
        }

        console.log("[API LOG] Dependente apagado com sucesso.");
        return new NextResponse(null, { status: 204 }); 

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

