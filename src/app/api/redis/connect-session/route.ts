import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionManager } from '@/services/session-manager';
import { RedisConnection } from '@/types/redis';

export async function POST(request: NextRequest) {
  try {
    const connection: RedisConnection = await request.json();
    
    // Obter sessionId do cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('redis-explorer-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const sessionId = sessionCookie.value;
    
    // Conectar usando SessionManager
    const success = await sessionManager.connect(sessionId, connection);
    
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: `Connected to ${connection.name}`,
        sessionId 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to connect' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
