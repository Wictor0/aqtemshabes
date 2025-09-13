import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // A função POST está final e correta.
  try {
    const matchData = await request.json(); 
    const supabase = createRouteHandlerClient({ cookies });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }
    const { user } = userData;

    const { data, error } = await supabase.rpc('create_match', {
      p_guest_id: user.id,
      p_event_id: matchData.event_id,
      p_personal_message: matchData.personal_message
    });

    if (error) {
      if (error.message.includes('O anfitrião não pode se inscrever no próprio evento.')) {
          return NextResponse.json({ error: 'Você não pode se inscrever no seu próprio evento.' }, { status: 403 });
      }
      if (error.code === '23505') { 
          return NextResponse.json({ error: 'Você já demonstrou interesse neste evento.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (e) {
    return NextResponse.json({ error: "Ocorreu um erro inesperado no servidor." }, { status: 500 });
  }
}

// --- FUNÇÃO GET FINAL E OTIMIZADA ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guest_id');
    const hostId = searchParams.get('host_id');

    if (!guestId && !hostId) {
      return NextResponse.json({ error: 'É necessário fornecer guest_id ou host_id' }, { status: 400 });
    }
    
    const supabase = createRouteHandlerClient({ cookies });

    // Autenticação (essencial para a RLS funcionar)
    const authHeader = request.headers.get('Authorization');
     if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
       return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (hostId) {
      // Etapa 1: Encontra os eventos do anfitrião
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('host_id', hostId);

      if (eventsError) throw eventsError;

      const eventIds = events.map(e => e.id);

      if (eventIds.length === 0) {
        return NextResponse.json([]);
      }

      // Etapa 2: Busca os matches, incluindo o nome do convidado
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, status, personal_message, created_at,
          guest:profiles!matches_guest_id_fkey(id, full_name),
          event:events!matches_event_id_fkey(id, title)
        `)
        .in('event_id', eventIds);

      if (error) throw error;
      return NextResponse.json(data);

    } else {
      // Busca os matches para o convidado, incluindo o nome do anfitrião
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, status, personal_message, created_at,
          event:events!matches_event_id_fkey(
            id, title,
            host:profiles!events_host_id_fkey(id, full_name)
          )
        `)
        .eq('guest_id', guestId);
      
      if (error) throw error;
      return NextResponse.json(data);
    }

  } catch(e) {
    console.error("Erro inesperado na rota GET /api/matches:", e);
    return NextResponse.json({ error: "Ocorreu um erro inesperado no servidor." }, { status: 500 });
  }
}

