import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';

export async function POST(request: Request) {
  try {
    const { host, port, password } = await request.json();

    if (!host || !port) {
      return NextResponse.json(
        { success: false, error: 'Host e porta são obrigatórios' },
        { status: 400 }
      );
    }

    const redis = new Redis({
      host,
      port: Number(port),
      password: password || undefined,
      retryStrategy: () => null, // Desativa tentativas de reconexão automática
      connectTimeout: 5000, // 5 segundos de timeout
    });

    try {
      // Testa a conexão
      await redis.ping();
      
      // Se chegou aqui, a conexão foi bem-sucedida
      return NextResponse.json({
        success: true,
        message: 'Conexão com o Redis estabelecida com sucesso!',
      });
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Falha ao conectar ao Redis' 
        },
        { status: 500 }
      );
    } finally {
      // Fecha a conexão após o teste
      await redis.quit();
    }
  } catch (error) {
    console.error('Erro ao testar conexão com o Redis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Desativa o cache para este endpoint
