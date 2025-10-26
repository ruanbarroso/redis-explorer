import { NextRequest } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let monitorRedis: any = null;
      
      try {
        // Pegar conexão Redis da sessão
        const redis = await getRedisFromSession();
        
        if (!redis) {
          console.log('Monitor: No active Redis connection');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No active connection' })}\n\n`));
          controller.close();
          return;
        }

        console.log('Monitor: Got Redis from session');
        
        // Duplicar conexão para monitor (não pode usar a principal)
        monitorRedis = redis.duplicate();
        
        console.log('Monitor: Attempting to connect duplicated instance...');
        await monitorRedis.connect();
        console.log('Monitor: Redis connected successfully');
        
        // Enviar mensagem de conexão bem-sucedida
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          command: '# Monitor started', 
          timestamp: Date.now() 
        })}\n\n`));

        // Iniciar monitor
        console.log('Monitor: Starting monitor command');
        monitorRedis.monitor((err, monitor) => {
          console.log('Monitor: Callback called', { err: err?.message, hasMonitor: !!monitor });
          if (err) {
            console.error('Monitor error:', err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: err.message, 
              timestamp: Date.now() 
            })}\n\n`));
            controller.close();
            return;
          }

          if (!monitor) {
            controller.close();
            return;
          }

          monitor.on('monitor', (time: number, args: string[], source: string, database: string) => {
            try {
              const command = args.join(' ');
              const message = `data: ${JSON.stringify({ 
                command,
                timestamp: time * 1000, // Redis retorna em segundos, converter para ms
                source: source || 'unknown',
                database: database || '0'
              })}\n\n`;
              controller.enqueue(encoder.encode(message));
            } catch (err) {
              // Controller já foi fechado, ignorar
            }
          });

          monitor.on('error', (err: Error) => {
            console.error('Monitor stream error:', err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: err.message, 
              timestamp: Date.now() 
            })}\n\n`));
          });
        });

        // Cleanup quando a conexão for fechada
        request.signal.addEventListener('abort', async () => {
          if (monitorRedis) {
            await monitorRedis.quit();
          }
          controller.close();
        });
      } catch (error) {
        console.error('Monitor setup error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error', 
          timestamp: Date.now() 
        })}\n\n`));
        if (monitorRedis) {
          await monitorRedis.quit();
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
