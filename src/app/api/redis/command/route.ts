import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }
    
    // Get Redis from session
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    // Parse command string into array
    const args = command.trim().split(/\s+/);
    const result = await redis.call(...args);
    
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
