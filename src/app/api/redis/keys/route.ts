import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || '*';
    const count = parseInt(searchParams.get('count') || '100');
    const loadAll = searchParams.get('loadAll') === 'true';
    
    // Get Redis from session
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    if (loadAll) {
      // Load ALL keys using KEYS command directly
      console.log('🚀 API: Carregando TODAS as chaves com KEYS direto...');
      
      try {
        
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
      // Load limited keys using SCAN
      const keys = [];
      let cursor = '0';
      let iterations = 0;
      const maxIterations = 100; // Limite de segurança para evitar loops infinitos
      
      do {
        const [newCursor, foundKeys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100 // Scan mais chaves por iteração
        );
        
        cursor = newCursor;
        iterations++;
        
        // Get details for found keys (em batch para performance)
        if (foundKeys.length > 0) {
          const batchPromises = foundKeys.slice(0, count - keys.length).map(async (keyName: string) => {
            try {
              const [type, ttl] = await Promise.all([
                redis.type(keyName),
                redis.ttl(keyName),
              ]);
              
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
              } catch {
                size = 0;
              }
              
              return { name: keyName, type, ttl, size };
            } catch {
              return { name: keyName, type: 'string', ttl: -1, size: 0 };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          keys.push(...batchResults);
        }
        
        // Condições de parada:
        // 1. Cursor voltou ao início (0)
        // 2. Já temos chaves suficientes
        // 3. Atingimos o limite de iterações (segurança)
        if (cursor === '0' || keys.length >= count || iterations >= maxIterations) {
          break;
        }
      } while (true);
      
      return NextResponse.json({ keys: keys.slice(0, count) });
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
    
    // Get Redis from session
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    const result = await redis.del(key);
    const success = result > 0;
    
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
