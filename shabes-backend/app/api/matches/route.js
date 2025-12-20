import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const getSupabaseClient = (authHeader) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
    );
};

// String de seleção reutilizável (com Left Join no event por padrão)
// Adicionamos 'validator_organization' e 'dietary_restrictions'
const SELECT_STRING = `
    id,
    event_id,
    guest_id,
    status,
    personal_message,
    created_at,
    dependent_ids,
    rating,
    rating_comment,
    guest:profiles!matches_guest_id_fkey (
        id, 
        full_name, 
        avatar_url, 
        username,
        phone,
        role,
        dietary_restrictions,
        validator_organization,
        dependents (id, name, birth_date, relationship, description)
    ),
    event:events (
        *,
        host:profiles!events_host_id_fkey (
            id, full_name, avatar_url, username, phone, role
        )
    )
`;

// String de seleção para quando filtramos pelo Host (precisa de !inner no evento para o filtro funcionar)
const SELECT_STRING_WITH_INNER_EVENT = `
    id,
    event_id,
    guest_id,
    status,
    personal_message,
    created_at,
    dependent_ids,
    rating,
    rating_comment,
    guest:profiles!matches_guest_id_fkey (
        id, 
        full_name, 
        avatar_url, 
        username,
        phone,
        role,
        dietary_restrictions,
        validator_organization,
        dependents (id, name, birth_date, relationship, description)
    ),
    event:events!inner (
        *,
        host:profiles!events_host_id_fkey (
            id, full_name, avatar_url, username, phone, role
        )
    )
`;

// ======================
// GET /api/matches
// ======================
export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseClient(authHeader);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const guestId = searchParams.get('guest_id');
  const hostId = searchParams.get('host_id');
  const matchId = searchParams.get('id');

  try {
    let data = [];

    if (matchId) {
        // Caso 1: Busca por ID específico
        const { data: match, error } = await supabase
            .from('matches')
            .select(SELECT_STRING)
            .eq('id', matchId)
            .single();
        
        if (error) throw error;
        data = match;

    } else if (guestId) {
        // Caso 2: Busca por Guest ID
        const { data: matches, error } = await supabase
            .from('matches')
            .select(SELECT_STRING)
            .eq('guest_id', guestId);
        
        if (error) throw error;
        data = matches;

    } else if (hostId) {
        // Caso 3: Busca por Host ID (Filtra no evento)
        const { data: matches, error } = await supabase
            .from('matches')
            .select(SELECT_STRING_WITH_INNER_EVENT) // Usa !inner para permitir o filtro
            .eq('event.host_id', hostId);
        
        if (error) throw error;
        data = matches;

    } else {
        // Caso 4 (Padrão - getMyMatches): Busca onde sou Convidado OU Anfitrião
        // Executamos duas queries em paralelo para evitar erros de sintaxe complexos do Supabase
        const [guestResponse, hostResponse] = await Promise.all([
            // A: Onde sou convidado
            supabase.from('matches')
                .select(SELECT_STRING)
                .eq('guest_id', user.id),
            
            // B: Onde sou anfitrião (meus eventos)
            supabase.from('matches')
                .select(SELECT_STRING_WITH_INNER_EVENT)
                .eq('event.host_id', user.id)
        ]);

        if (guestResponse.error) throw guestResponse.error;
        if (hostResponse.error) throw hostResponse.error;

        // Combina os resultados e remove duplicatas (por ID)
        const allMatches = [...(guestResponse.data || []), ...(hostResponse.data || [])];
        const uniqueMatches = Array.from(new Map(allMatches.map(item => [item.id, item])).values());
        
        // Opcional: Ordenar por data de criação (mais recentes primeiro)
        uniqueMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        data = uniqueMatches;
    }

    return NextResponse.json(data);

  } catch (error) {
    if (error.code === 'PGRST116' && matchId) {
         return NextResponse.json(null);
    }
    console.error("Erro ao buscar matches:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// ======================
// POST /api/matches
// ======================
export async function POST(request) {
  // 1. Bloco try/catch externo para pegar erros (como user.id)
  try {
    const { event_id, personal_message, dependent_ids } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    
    // --- 2. VALIDAÇÃO DE USER (O FIM DO ERRO 500) ---
    if (!user) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // --- 3. Validação dos Dados ---
    if (!event_id) {
        return NextResponse.json({ error: 'ID do evento (event_id) é obrigatório' }, { status: 400 });
    }

    // --- 4. Validação de Regra de Negócio ---
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', event_id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (eventData.host_id === user.id) {
      return NextResponse.json({ error: 'Você não pode se inscrever no seu próprio evento' }, { status: 403 });
    }

    // --- 5. Preparação dos Dados ---
    const dataToInsert = {
        event_id,
        personal_message: personal_message || "",
        dependent_ids: dependent_ids || [], 
        guest_id: user.id, // Agora é seguro usar user.id
        status: 'pending' 
    };

    // --- 6. Lógica de Inserção ---
    const { data, error } = await supabase
      .from('matches')
      .insert(dataToInsert)
      .select()
      .single();

    // 7. Manipulação de Erro do Supabase (para duplicatas, etc)
    if (error) {
        console.error("Erro do Supabase ao criar match:", error);
        
        if (error.code === '23505') { // Erro de duplicata
            return NextResponse.json({ error: 'Você já se inscreveu neste evento.' }, { status: 409 });
        }
        
        return NextResponse.json({ error: "Você não tem permissão para realizar esta ação." }, { status: 403 });
    }

    // 8. Sucesso
    return NextResponse.json(data);

  } catch (e) {
      // Pega erros de JSON malformado ou outros erros inesperados
      console.error('Erro inesperado no servidor POST /api/matches:', e);
      return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}