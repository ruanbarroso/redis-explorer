import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }
    
    const result = await redisService.executeCommand(command);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
