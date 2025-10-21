import { NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET() {
  try {
    const info = await redisService.getInfo();
    return NextResponse.json({ info });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
