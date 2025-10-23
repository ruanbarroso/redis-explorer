import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function POST(request: NextRequest) {
  try {
    const { pattern = '*', operationId } = await request.json();
    
    if (!operationId) {
      return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
    }

    console.log(`🚀 Iniciando carregamento com operationId: ${operationId}`);

    // Start the operation in background
    processKeysInBackground(pattern, operationId);
    
    return NextResponse.json({ 
      success: true, 
      operationId,
      message: 'Operation started' 
    });
  } catch (error) {
    console.error('❌ Error starting operation:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Get shared operation status store
function getOperationStatus() {
  if (typeof global !== 'undefined') {
    if (!(global as any).operationStatus) {
      (global as any).operationStatus = new Map();
    }
    return (global as any).operationStatus;
  }
  return new Map();
}

async function processKeysInBackground(pattern: string, operationId: string) {
  try {
    // Update status: starting
    await updateOperationStatus(operationId, {
      status: 'running',
      progress: 0,
      phase: 'starting',
      message: 'Conectando',
      total: 0,
      current: 0,
    });

    // Check if cancelled
    if (await isOperationCancelled(operationId)) {
      console.log(`🛑 Operação ${operationId} foi cancelada durante início`);
      return;
    }

    // Get Redis connection
    const redis = (redisService as any).getActiveConnection();
    if (!redis) {
      throw new Error('No active Redis connection');
    }

    // Update status: scanning
    await updateOperationStatus(operationId, {
      status: 'running',
      progress: 5,
      phase: 'scanning',
      message: 'Buscando todas as chaves',
      total: 0,
      current: 0,
    });

    // Get all key names
    const allKeyNames = await redis.keys(pattern);
    const totalKeys = allKeyNames.length;

    console.log(`✅ Encontradas ${totalKeys} chaves`);

    // Update status: processing
    await updateOperationStatus(operationId, {
      status: 'running',
      progress: 10,
      phase: 'processing',
      message: `Processando ${totalKeys} chaves`,
      total: totalKeys,
      current: 0,
    });

    // Process keys in batches
    const keys = [];
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalKeys / batchSize);

    for (let i = 0; i < allKeyNames.length; i += batchSize) {
      // Check if cancelled before each batch
      if (await isOperationCancelled(operationId)) {
        console.log(`🛑 Operação ${operationId} foi cancelada durante processamento`);
        return;
      }

      const batch = allKeyNames.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`🔄 Processando lote ${batchNumber}/${totalBatches}`);

      // Update progress
      const progress = 10 + ((batchNumber - 1) / totalBatches) * 85; // 10% to 95%
      await updateOperationStatus(operationId, {
        status: 'running',
        progress: Math.round(progress),
        phase: 'processing',
        message: `Processando lote ${batchNumber}/${totalBatches}`,
        total: totalKeys,
        current: i,
      });

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

    // Final status: completing
    await updateOperationStatus(operationId, {
      status: 'running',
      progress: 95,
      phase: 'completing',
      message: 'Finalizando',
      total: totalKeys,
      current: totalKeys,
    });

    console.log(`🎉 Processamento concluído: ${keys.length} chaves`);

    // Final status: complete
    await updateOperationStatus(operationId, {
      status: 'complete',
      progress: 100,
      phase: 'complete',
      message: `${keys.length} chaves carregadas com sucesso!`,
      total: totalKeys,
      current: totalKeys,
      keys: keys,
    });

  } catch (error) {
    console.error('❌ Error processing keys:', error);
    await updateOperationStatus(operationId, {
      status: 'error',
      progress: 0,
      phase: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
      current: 0,
      error: String(error),
    });
  }
}

async function updateOperationStatus(operationId: string, status: any) {
  try {
    // Update local status first
    const operationStatus = getOperationStatus();
    operationStatus.set(operationId, {
      operationId,
      ...status,
    });

    // Also update via API for consistency
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/redis/keys/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationId,
        ...status,
      }),
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
  }
}

async function isOperationCancelled(operationId: string): Promise<boolean> {
  try {
    const operationStatus = getOperationStatus();
    const operation = operationStatus.get(operationId);
    return operation?.cancelled === true || operation?.status === 'cancelled';
  } catch (error) {
    console.error('❌ Error checking cancellation:', error);
    return false;
  }
}
