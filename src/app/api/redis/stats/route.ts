import { NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET() {
  try {
    const stats = await redisService.getStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
