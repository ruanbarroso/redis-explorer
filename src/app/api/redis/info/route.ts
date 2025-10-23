import { NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET() {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    const info = await redis.info();
    return NextResponse.json({ info });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
