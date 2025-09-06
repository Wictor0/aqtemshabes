
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mockEventMatches } from '@/lib/mock-data';
import { MatchStatus, HostResponse } from '@/lib/types';

// GET /api/matches/[id] - Get specific match details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = mockEventMatches.find(m => m.id === params.id);
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user has permission to view this match
    const isHost = match.event?.hostId === session.user.id;
    const isGuest = match.guestId === session.user.id;
    
    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/matches/[id] - Update match status (host response)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'accept', 'decline', or 'chat'

    const match = mockEventMatches.find(m => m.id === params.id);
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user is the host of this event
    if (match.event?.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Only the host can update match status' }, { status: 403 });
    }

    // Update match status based on action
    let newStatus = match.status;
    let hostResponse = match.hostResponse;

    switch (action) {
      case 'accept':
        newStatus = MatchStatus.ACCEPTED;
        hostResponse = HostResponse.ACCEPT;
        break;
      case 'decline':
        newStatus = MatchStatus.DECLINED;
        hostResponse = HostResponse.DECLINE;
        break;
      case 'chat':
        newStatus = MatchStatus.CHAT_REQUESTED;
        hostResponse = HostResponse.REQUEST_CHAT;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // In a real application, you would update this in the database
    const updatedMatch = {
      ...match,
      status: newStatus,
      hostResponse,
      respondedAt: new Date()
    };

    return NextResponse.json({ 
      message: 'Match updated successfully',
      match: updatedMatch 
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
