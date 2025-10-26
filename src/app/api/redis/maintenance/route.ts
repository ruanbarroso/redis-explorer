import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { operation } = body;

    let result;

    switch (operation) {
      case 'bgsave':
        result = await redis.bgsave();
        break;

      case 'bgrewriteaof':
        result = await redis.bgrewriteaof();
        break;

      case 'flushdb':
        result = await redis.flushdb();
        break;

      case 'flushall':
        result = await redis.flushall();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      result: result 
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
