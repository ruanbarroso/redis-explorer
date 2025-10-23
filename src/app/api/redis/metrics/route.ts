import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionManager } from '@/services/session-manager';
import { MetricsService } from '@/services/metrics';
import { RedisStats } from '@/types/redis';
import Redis from 'ioredis';

export async function GET() {
  try {
    // Obter sessionId do cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('redis-explorer-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const sessionId = sessionCookie.value;
    const redis = sessionManager.getRedis(sessionId);
    
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    // Buscar stats do Redis da sessão
    const info = await redis.info();
    const stats = parseRedisInfo(info);
    
    // Calcular latência estimada baseada em throughput e carga do servidor
    const latencies = calculateEstimatedLatency(stats);
    stats.clientRttP50 = latencies.p50;
    stats.clientRttP95 = latencies.p95;
    

    const metrics = MetricsService.calculateMetrics(stats, sessionId);
    
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

function calculateEstimatedLatency(stats: Partial<RedisStats>): { p50: number | null; p95: number | null } {
  // Calcular latência estimada baseada em:
  // 1. Throughput (ops/sec) - quanto maior, mais carga
  // 2. CPU usage - quanto maior, mais lento
  // 3. Memory fragmentation - quanto maior, mais lento
  // 4. Connected clients - quanto mais, mais contenção
  
  const opsPerSec = stats.instantaneousOpsPerSec || 0;
  const cpuPercent = stats.instantaneousCpuPercent || 0;
  const memFragRatio = stats.memoryFragmentationRatio || 1.0;
  const clients = stats.connectedClients || 1;
  
  // Latência base (sub-millisecond para Redis local)
  let baseLatency = 0.1; // 0.1ms
  
  // Fator de carga baseado em ops/sec
  // 0-100 ops: +0ms
  // 100-1000 ops: +0-2ms
  // 1000-10000 ops: +2-10ms
  // >10000 ops: +10-50ms
  if (opsPerSec > 10000) {
    baseLatency += 10 + (opsPerSec - 10000) / 1000;
  } else if (opsPerSec > 1000) {
    baseLatency += 2 + ((opsPerSec - 1000) / 1000);
  } else if (opsPerSec > 100) {
    baseLatency += (opsPerSec - 100) / 500;
  }
  
  // Fator de CPU (0-100%)
  // CPU alto = comandos mais lentos
  baseLatency += (cpuPercent / 100) * 5; // Até +5ms
  
  // Fator de fragmentação
  // >1.5 = problema de memória
  if (memFragRatio > 1.5) {
    baseLatency += (memFragRatio - 1.5) * 10;
  }
  
  // Fator de clientes
  // Muitos clientes = mais contenção
  if (clients > 50) {
    baseLatency += (clients - 50) / 50;
  }
  
  // P50 = latência base
  const p50 = Number(baseLatency.toFixed(2));
  
  // P95 = P50 * 1.5 a 3x (comandos mais lentos)
  const p95 = Number((baseLatency * 2.5).toFixed(2));
  
  return { p50, p95 };
}

function parseRedisInfo(infoString: string): RedisStats {
  const lines = infoString.split('\r\n');
  const stats: Partial<RedisStats> = {};
  const databases: any[] = [];
  let totalKeys = 0;
  let totalExpires = 0;

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      const numValue = parseFloat(value);
      
      // Parse keyspace (db0, db1, etc)
      if (key.startsWith('db')) {
        const dbMatch = value.match(/keys=(\d+),expires=(\d+)/);
        if (dbMatch) {
          const keys = parseInt(dbMatch[1]);
          const expires = parseInt(dbMatch[2]);
          totalKeys += keys;
          totalExpires += expires;
          databases.push({
            db: parseInt(key.substring(2)),
            keys,
            expires,
            avgTtl: 0,
          });
        }
        continue;
      }
      
      switch (key) {
        case 'used_memory':
          stats.usedMemory = parseInt(value);
          break;
        case 'used_memory_human':
          stats.usedMemoryHuman = value;
          break;
        case 'maxmemory':
          stats.maxMemory = parseInt(value);
          break;
        case 'maxmemory_human':
          stats.maxMemoryHuman = value;
          break;
        case 'mem_fragmentation_ratio':
          stats.memoryFragmentationRatio = numValue;
          break;
        case 'mem_fragmentation_bytes':
          stats.memFragmentationBytes = parseInt(value);
          break;
        case 'instantaneous_ops_per_sec':
          stats.instantaneousOpsPerSec = parseInt(value);
          break;
        case 'total_commands_processed':
          stats.totalCommandsProcessed = parseInt(value);
          break;
        case 'keyspace_hits':
          stats.keyspaceHits = parseInt(value);
          break;
        case 'keyspace_misses':
          stats.keyspaceMisses = parseInt(value);
          break;
        case 'evicted_keys':
          stats.evictedKeys = parseInt(value);
          break;
        case 'expired_keys':
          stats.expiredKeys = parseInt(value);
          break;
        case 'connected_clients':
          stats.connectedClients = parseInt(value);
          break;
        case 'blocked_clients':
          stats.blockedClients = parseInt(value);
          break;
        case 'rejected_connections':
          stats.rejectedConnections = parseInt(value);
          break;
        case 'total_connections_received':
          stats.totalConnectionsReceived = parseInt(value);
          break;
        case 'total_net_input_bytes':
          stats.totalNetInputBytes = parseInt(value);
          break;
        case 'total_net_output_bytes':
          stats.totalNetOutputBytes = parseInt(value);
          break;
        case 'used_cpu_sys':
          stats.usedCpuSys = numValue;
          break;
        case 'used_cpu_user':
          stats.usedCpuUser = numValue;
          break;
        case 'instantaneous_input_kbps':
          stats.instantaneousInputKbps = numValue;
          break;
        case 'instantaneous_output_kbps':
          stats.instantaneousOutputKbps = numValue;
          break;
        case 'uptime_in_seconds':
          stats.uptimeInSeconds = parseInt(value);
          break;
        case 'uptime_in_days':
          stats.uptimeInDays = parseInt(value);
          break;
        case 'redis_version':
          stats.redisVersion = value;
          break;
        case 'redis_mode':
          stats.redisMode = value;
          break;
        case 'os':
          stats.os = value;
          break;
        case 'process_id':
          stats.processId = value;
          break;
        case 'role':
          stats.role = value;
          break;
        case 'connected_slaves':
          stats.connectedSlaves = parseInt(value);
          break;
      }
    }
  }

  // Calcular CPU percentage corretamente
  // usedCpuSys e usedCpuUser são valores acumulados em segundos
  // Para obter %, precisamos calcular a taxa de mudança ao longo do tempo
  // Por enquanto, vamos usar 0 e deixar o MetricsService calcular com histórico
  const cpuPercent = 0; // Será calculado pelo MetricsService com base no histórico

  // Valores padrão
  return {
    usedMemory: stats.usedMemory || 0,
    usedMemoryHuman: stats.usedMemoryHuman || '0B',
    maxMemory: stats.maxMemory || 0,
    maxMemoryHuman: stats.maxMemoryHuman || 'unlimited',
    memoryFragmentationRatio: stats.memoryFragmentationRatio || 1.0,
    memFragmentationBytes: stats.memFragmentationBytes || 0,
    instantaneousOpsPerSec: stats.instantaneousOpsPerSec || 0,
    totalCommandsProcessed: stats.totalCommandsProcessed || 0,
    keyspaceHits: stats.keyspaceHits || 0,
    keyspaceMisses: stats.keyspaceMisses || 0,
    evictedKeys: stats.evictedKeys || 0,
    expiredKeys: stats.expiredKeys || 0,
    connectedClients: stats.connectedClients || 0,
    blockedClients: stats.blockedClients || 0,
    rejectedConnections: stats.rejectedConnections || 0,
    totalConnectionsReceived: stats.totalConnectionsReceived || 0,
    totalNetInputBytes: stats.totalNetInputBytes || 0,
    totalNetOutputBytes: stats.totalNetOutputBytes || 0,
    usedCpuSys: stats.usedCpuSys || 0,
    usedCpuUser: stats.usedCpuUser || 0,
    instantaneousCpuPercent: cpuPercent, // Será calculado pelo MetricsService
    instantaneousInputKbps: stats.instantaneousInputKbps || 0,
    instantaneousOutputKbps: stats.instantaneousOutputKbps || 0,
    uptimeInSeconds: stats.uptimeInSeconds || 0,
    uptimeInDays: stats.uptimeInDays || 0,
    redisVersion: stats.redisVersion || 'unknown',
    redisMode: stats.redisMode || 'standalone',
    os: stats.os || 'unknown',
    processId: stats.processId || 'unknown',
    role: stats.role || 'standalone',
    connectedSlaves: stats.connectedSlaves || 0,
    syncFull: 0,
    syncPartialOk: 0,
    syncPartialErr: 0,
    clientRttP50: null,
    clientRttP95: null,
    totalKeys,
    totalExpires,
    avgTtl: 0,
    databases,
  } as RedisStats;
}
