
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// GET /api/users/profile - Get user profile and preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real application, you would fetch from the database
    const userProfile = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      phone: session.user.phone,
      preferences: {
        maxDistance: 15,
        address: '',
        preferredStartTime: '19:00',
        preferredEndTime: '22:00',
        dietary: 'kosher',
        notes: ''
      }
    };

    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/users/profile - Update user profile and preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // In a real application, you would update the database
    const updatedProfile = {
      ...body,
      id: session.user.id,
      updatedAt: new Date()
    };

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
