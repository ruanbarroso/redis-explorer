import { NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET() {
  try {
    const success = await redisService.ping();
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
