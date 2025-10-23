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
    // Parse info string into stats object (simplified version)
    const stats = parseRedisInfo(info);
    
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

function parseRedisInfo(infoString: string): any {
  const stats: any = {};
  const lines = infoString.split('\r\n');
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      stats[key] = value;
    }
  }
  
  return stats;
}
