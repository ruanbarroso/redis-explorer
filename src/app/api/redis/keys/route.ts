import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || '*';
    const count = parseInt(searchParams.get('count') || '100');
    
    const keys = await redisService.getKeys(pattern, count);
    
    return NextResponse.json({ keys });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    const success = await redisService.deleteKey(key);
    
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
