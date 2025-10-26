import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    let configObj: Record<string, string> = {};
    let configDisabled = false;

    // Tentar buscar configurações (pode estar desabilitado)
    try {
      const configs = await redis.config('GET', '*');
      
      // Converter array [key, value, key, value] para objeto
      for (let i = 0; i < configs.length; i += 2) {
        configObj[configs[i]] = configs[i + 1];
      }
    } catch (err: any) {
      // CONFIG pode estar desabilitado (comum em ambientes gerenciados)
      if (err.message?.includes('unknown command') || err.message?.includes('CONFIG')) {
        configDisabled = true;
        configObj = {};
      } else {
        throw err;
      }
    }

    // Buscar informações do servidor
    const info = await redis.info('server');
    const replication = await redis.info('replication');
    const persistence = await redis.info('persistence');

    // Remover linhas de cabeçalho (# Server, # Replication, etc)
    const cleanInfo = (text: string) => {
      return text.split('\n')
        .filter(line => !line.startsWith('#'))
        .join('\n')
        .trim();
    };

    return NextResponse.json({
      config: configObj,
      configDisabled,
      info: {
        server: cleanInfo(info),
        replication: cleanInfo(replication),
        persistence: cleanInfo(persistence),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Atualizar configuração
    await redis.config('SET', key, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
