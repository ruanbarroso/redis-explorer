import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || '*';
    const count = parseInt(searchParams.get('count') || '100');
    const loadAll = searchParams.get('loadAll') === 'true';
    
    if (loadAll) {
      // Load ALL keys using KEYS command directly
      console.log('🚀 API: Carregando TODAS as chaves com KEYS direto...');
      
      try {
        // Get Redis connection
        const redis = (redisService as any).getActiveConnection();
        if (!redis) {
          throw new Error('No active Redis connection');
        }
        
        // Use KEYS command directly to get ALL keys
        const allKeyNames = await redis.keys(pattern);
        console.log(`✅ KEYS encontrou ${allKeyNames.length} chaves`);
        
        // Process in batches to get details
        const keys = [];
        const batchSize = 100;
        
        for (let i = 0; i < allKeyNames.length; i += batchSize) {
          const batch = allKeyNames.slice(i, i + batchSize);
          console.log(`🔄 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allKeyNames.length/batchSize)}`);
          
          const batchDetails = await Promise.all(
            batch.map(async (keyName: string) => {
              try {
                const [type, ttl] = await Promise.all([
                  redis.type(keyName),
                  redis.ttl(keyName),
                ]);
                
                // Simple size calculation
                let size = 0;
                try {
                  switch (type) {
                    case 'string':
                      size = await redis.strlen(keyName);
                      break;
                    case 'hash':
                      size = await redis.hlen(keyName);
                      break;
                    case 'list':
                      size = await redis.llen(keyName);
                      break;
                    case 'set':
                      size = await redis.scard(keyName);
                      break;
                    case 'zset':
                      size = await redis.zcard(keyName);
                      break;
                  }
                } catch (sizeError) {
                  size = 0;
                }

                return {
                  name: keyName,
                  type,
                  ttl,
                  size,
                };
              } catch (keyError) {
                return {
                  name: keyName,
                  type: 'string',
                  ttl: -1,
                  size: 0,
                };
              }
            })
          );
          
          keys.push(...batchDetails);
        }
        
        console.log(`🎉 Processamento concluído: ${keys.length} chaves processadas`);
        return NextResponse.json({ keys, total: keys.length });
      } catch (directError) {
        console.error('❌ Erro no carregamento direto:', directError);
        throw directError;
      }
    } else {
      // Load limited keys (original behavior)
      const keys = await redisService.getKeys(pattern, count);
      return NextResponse.json({ keys });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('❌ API Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
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
