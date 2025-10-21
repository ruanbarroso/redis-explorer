import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }
    
    const value = await redisService.getValue(key);
    
    return NextResponse.json({ value });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value, type, ttl } = await request.json();
    
    const success = await redisService.setValue(key, value, type, ttl);
    
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
