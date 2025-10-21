import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '10');
    
    const slowLog = await redisService.getSlowLog(count);
    return NextResponse.json({ slowLog });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
