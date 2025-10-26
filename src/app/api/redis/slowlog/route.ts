import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    // Pegar todos os itens do slowlog (ou um número grande suficiente)
    // O Redis SLOWLOG retorna em ordem cronológica, não por duração
    const allSlowLog = await redis.slowlog('GET', 1000);
    
    // Ordenar do mais lento para o menos lento (duração decrescente)
    // slowLog format: [id, timestamp, duration, command, clientAddress, clientName]
    const sortedSlowLog = allSlowLog.sort((a: any, b: any) => b[2] - a[2]);
    
    // Calcular offset e pegar apenas a página solicitada
    const start = page * perPage;
    const end = start + perPage;
    const slowLog = sortedSlowLog.slice(start, end);
    const hasMore = end < sortedSlowLog.length;
    
    return NextResponse.json({ 
      slowLog,
      hasMore,
      total: sortedSlowLog.length,
      page,
      perPage
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
