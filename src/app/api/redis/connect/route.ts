import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';
import { RedisConnection } from '@/types/redis';

export async function POST(request: NextRequest) {
  try {
    const connection: RedisConnection = await request.json();
    
    const success = await redisService.connect(connection);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não foi possível conectar ao Redis em ${connection.host}:${connection.port}. Verifique se o servidor está rodando e acessível.` 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
