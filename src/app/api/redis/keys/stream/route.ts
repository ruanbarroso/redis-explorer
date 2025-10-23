import { NextRequest } from 'next/server';
import { redisService } from '@/services/redis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pattern = searchParams.get('pattern') || '*';

  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          console.log('🚀 Iniciando stream de carregamento de todas as chaves...');
          
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            phase: 'starting',
            message: 'Iniciando carregamento',
            progress: 0,
            total: 0,
            current: 0
          })}\n\n`));

          // Get Redis connection
          const redis = (redisService as any).getActiveConnection();
          if (!redis) {
            throw new Error('No active Redis connection');
          }

          // Phase 1: Get all key names
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            phase: 'scanning',
            message: 'Buscando todas as chaves',
            progress: 5,
            total: 0,
            current: 0
          })}\n\n`));

          const allKeyNames = await redis.keys(pattern);
          const totalKeys = allKeyNames.length;

          console.log(`✅ Encontradas ${totalKeys} chaves`);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            phase: 'processing',
            message: `Processando ${totalKeys} chaves`,
            progress: 10,
            total: totalKeys,
            current: 0
          })}\n\n`));

          // Phase 2: Process keys in batches
          const keys = [];
          const batchSize = 1000;
          const totalBatches = Math.ceil(totalKeys / batchSize);

          for (let i = 0; i < allKeyNames.length; i += batchSize) {
            const batch = allKeyNames.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            
            console.log(`🔄 Processando lote ${batchNumber}/${totalBatches}`);

            // Send progress update
            const progress = 10 + ((batchNumber - 1) / totalBatches) * 85; // 10% to 95%
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              phase: 'processing',
              message: `Processando lote ${batchNumber}/${totalBatches}`,
              progress: Math.round(progress),
              total: totalKeys,
              current: i
            })}\n\n`));

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

          // Final progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            phase: 'completing',
            message: 'Finalizando',
            progress: 95,
            total: totalKeys,
            current: totalKeys
          })}\n\n`));

          console.log(`🎉 Processamento concluído: ${keys.length} chaves`);

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            phase: 'complete',
            message: `${keys.length} chaves carregadas com sucesso!`,
            progress: 100,
            total: totalKeys,
            current: totalKeys,
            keys: keys
          })}\n\n`));

        } catch (error) {
          console.error('❌ Erro no stream:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            error: true
          })}\n\n`));
        } finally {
          controller.close();
        }
      })();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
