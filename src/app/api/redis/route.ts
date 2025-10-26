import { NextResponse } from 'next/server';
import { sessionManager } from '@/services/session-manager';
import { Redis } from 'ioredis';

type CommandRequest = {
  command: string;
  args: (string | number)[];
};

export async function POST(req: Request) {
  try {
    const { command, args = [] } = (await req.json()) as CommandRequest;
    
    // Get the session ID from cookies
    const sessionId = req.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Get the Redis client from the session
    const redis = sessionManager.getRedis(sessionId);
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    // Execute the command
    const result = await (redis as any)[command.toLowerCase()](...args);
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error executing Redis command:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute command' },
      { status: 500 }
    );
  }
}
