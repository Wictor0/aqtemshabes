
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mockEvents, mockEventMatches } from '@/lib/mock-data';

// GET /api/events - Get all events with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxDistance = searchParams.get('maxDistance');
    const dietary = searchParams.get('dietary');
    const ageGroup = searchParams.get('ageGroup');
    const language = searchParams.get('language');

    // Filter events based on query parameters
    let filteredEvents = mockEvents.filter(event => 
      event.isActive && new Date(event.date) >= new Date()
    );

    if (dietary && dietary !== '') {
      filteredEvents = filteredEvents.filter(event => event.dietary === dietary);
    }

    if (ageGroup && ageGroup !== '') {
      filteredEvents = filteredEvents.filter(event => event.ageGroup === ageGroup);
    }

    if (language && language !== '') {
      filteredEvents = filteredEvents.filter(event => event.language === language);
    }

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'date', 'startTime', 'fullAddress', 'maxGuests'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Simulate creating a new event
    const newEvent = {
      id: `event-${Date.now()}`,
      hostId: session.user.id,
      host: {
        id: session.user.id,
        name: session.user.name || 'Unknown',
        email: session.user.email || '',
      },
      title: body.title,
      description: body.description || null,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime || null,
      maxGuests: parseInt(body.maxGuests),
      currentGuests: 0,
      approximateAddress: body.fullAddress.split(',').slice(0, 2).join(','), // Approximate address
      fullAddress: body.fullAddress,
      latitude: -23.5505 + (Math.random() - 0.5) * 0.1, // Mock coordinates
      longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
      dietary: body.dietary || 'kosher',
      ageGroup: body.ageGroup || 'mixed',
      language: body.language || 'portuguese',
      isActive: true,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real application, you would save this to the database
    // For now, we'll just return the created event
    
    return NextResponse.json({ 
      message: 'Event created successfully',
      event: newEvent 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
