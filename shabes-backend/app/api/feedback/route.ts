
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// POST /api/feedback - Submit event feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.eventId || !body.rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Simulate creating feedback
    const feedback = {
      id: `feedback-${Date.now()}`,
      eventId: body.eventId,
      giverId: session.user.id,
      receiverId: body.receiverId, // Host or guest being reviewed
      rating: body.rating,
      comment: body.comment || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      isAnonymous: body.isAnonymous || false,
      createdAt: new Date()
    };

    // In a real application, you would save this to the database
    
    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      feedback 
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/feedback - Get feedback for a user or event
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    // In a real application, you would fetch from the database
    // For now, return empty array
    const feedback: any[] = [];

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
