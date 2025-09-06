
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mockEventMatches } from '@/lib/mock-data';

// GET /api/matches - Get user's matches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'guest' or 'host'

    let userMatches = [];

    if (type === 'guest') {
      // Get matches where user is the guest
      userMatches = mockEventMatches.filter(match => match.guestId === session.user?.id);
    } else if (type === 'host') {
      // Get matches for events hosted by the user
      userMatches = mockEventMatches.filter(match => 
        match.event?.hostId === session.user?.id
      );
    } else {
      // Get all matches for the user
      userMatches = mockEventMatches.filter(match => 
        match.guestId === session.user?.id || match.event?.hostId === session.user?.id
      );
    }

    return NextResponse.json({ matches: userMatches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/matches - Express interest in an event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.eventId || !body.personalMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simulate creating a new match
    const newMatch = {
      id: `match-${Date.now()}`,
      eventId: body.eventId,
      guestId: session.user.id,
      personalMessage: body.personalMessage,
      matchScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
      status: 'PENDING',
      createdAt: new Date()
    };

    // In a real application, you would save this to the database
    
    return NextResponse.json({ 
      message: 'Interest expressed successfully',
      match: newMatch 
    }, { status: 201 });
  } catch (error) {
    console.error('Error expressing interest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
