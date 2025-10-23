import { RedisStats } from '@/types/redis';
import { RedisMetrics, MetricAlert, DEFAULT_THRESHOLDS, AlertLevel } from '@/types/metrics';

interface SessionMetrics {
  previousStats: RedisStats | null;
  previousTimestamp: number;
}

export class MetricsService {
  // Map de sessionId -> histórico de métricas
  private static sessions = new Map<string, SessionMetrics>();

  static calculateMetrics(stats: RedisStats, sessionId: string): RedisMetrics {
    const now = Date.now();
    
    // Obter ou criar sessão
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { previousStats: null, previousTimestamp: 0 };
      this.sessions.set(sessionId, session);
    }

    const timeDiffSec = session.previousStats && session.previousTimestamp 
      ? (now - session.previousTimestamp) / 1000 
      : 5; // default 5s

    // Calcular Cache Hit Ratio
    const totalRequests = stats.keyspaceHits + stats.keyspaceMisses;
    const cacheHitRatio = totalRequests > 0 
      ? (stats.keyspaceHits / totalRequests) * 100 
      : 0;

    // Calcular Memory Usage
    const memoryPercentage = stats.maxMemory && stats.maxMemory > 0
      ? (stats.usedMemory / stats.maxMemory) * 100
      : 0;

    // Calcular CPU percentage corretamente
    // usedCpuSys e usedCpuUser são valores acumulados em segundos
    // CPU% = (delta_cpu_time / delta_real_time) * 100
    let cpuPercentage = 0;
    if (session.previousStats) {
      const deltaCpuSys = stats.usedCpuSys - session.previousStats.usedCpuSys;
      const deltaCpuUser = stats.usedCpuUser - session.previousStats.usedCpuUser;
      const deltaCpuTotal = deltaCpuSys + deltaCpuUser;
      
      // CPU% = (tempo de CPU usado / tempo real decorrido) * 100
      cpuPercentage = (deltaCpuTotal / timeDiffSec) * 100;
      
      // Limitar entre 0 e 100%
      cpuPercentage = Math.max(0, Math.min(100, cpuPercentage));
    }

    // Calcular taxas por segundo
    const evictedPerSec = session.previousStats
      ? Math.max(0, (stats.evictedKeys - session.previousStats.evictedKeys) / timeDiffSec)
      : 0;

    const expiredPerSec = session.previousStats
      ? Math.max(0, (stats.expiredKeys - session.previousStats.expiredKeys) / timeDiffSec)
      : 0;

    // Calcular Network I/O
    const inputKbps = session.previousStats
      ? ((stats.totalNetInputBytes - session.previousStats.totalNetInputBytes) / timeDiffSec) / 1024
      : 0;

    const outputKbps = session.previousStats
      ? ((stats.totalNetOutputBytes - session.previousStats.totalNetOutputBytes) / timeDiffSec) / 1024
      : 0;

    // Construir objeto de métricas
    const metrics: Omit<RedisMetrics, 'alerts' | 'health'> = {
      // Tier 1: Críticas
      cacheHitRatio,
      memoryUsage: {
        used: stats.usedMemory,
        usedHuman: stats.usedMemoryHuman,
        max: stats.maxMemory || 0,
        maxHuman: stats.maxMemoryHuman || 'unlimited',
        percentage: memoryPercentage,
      },
      memoryFragmentation: {
        ratio: stats.memoryFragmentationRatio || 1.0,
        bytes: stats.memFragmentationBytes || 0,
      },
      cpu: {
        percentage: cpuPercentage,
        sys: stats.usedCpuSys || 0,
        user: stats.usedCpuUser || 0,
      },
      latency: {
        p50: stats.clientRttP50 || null,
        p95: stats.clientRttP95 || null,
        p99: null, // Não disponível ainda
      },

      // Tier 2: Performance
      throughput: {
        opsPerSec: stats.instantaneousOpsPerSec,
        totalCommands: stats.totalCommandsProcessed,
      },
      connections: {
        connected: stats.connectedClients,
        blocked: stats.blockedClients,
        rejected: stats.rejectedConnections,
        total: stats.totalConnectionsReceived || 0,
      },
      eviction: {
        evictedKeys: stats.evictedKeys,
        evictedPerSec,
      },
      expiration: {
        expiredKeys: stats.expiredKeys,
        expiredPerSec,
      },

      // Tier 3: Atividade
      network: {
        inputKbps,
        outputKbps,
        totalInputBytes: stats.totalNetInputBytes,
        totalOutputBytes: stats.totalNetOutputBytes,
      },
      keyspace: {
        totalKeys: stats.totalKeys,
        totalExpires: stats.totalExpires,
        avgTtl: stats.avgTtl,
        databases: stats.databases || [],
      },
      replication: {
        role: stats.role || 'standalone',
        connectedSlaves: stats.connectedSlaves || 0,
        syncFull: stats.syncFull,
        syncPartialOk: stats.syncPartialOk,
        syncPartialErr: stats.syncPartialErr,
      },

      // Server Info
      server: {
        version: stats.redisVersion || 'unknown',
        mode: stats.redisMode || 'standalone',
        uptime: stats.uptimeInSeconds,
        uptimeDays: stats.uptimeInDays,
        os: stats.os || 'unknown',
        processId: stats.processId || 'unknown',
      },

      // Timestamp
      timestamp: now,
    };

    // Gerar alertas
    const alerts = this.generateAlerts(metrics);
    const health = this.calculateHealth(alerts);

    // Atualizar histórico da sessão
    session.previousStats = stats;
    session.previousTimestamp = now;

    return {
      ...metrics,
      alerts,
      health,
    };
  }

  static clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  static reset(): void {
    this.sessions.clear();
  }

  private static generateAlerts(metrics: Omit<RedisMetrics, 'alerts' | 'health'>): MetricAlert[] {
    const alerts: MetricAlert[] = [];
    const t = DEFAULT_THRESHOLDS;

    // CPU Alerts
    if (metrics.cpu.percentage >= t.cpu.critical) {
      alerts.push({
        level: 'critical',
        metric: 'CPU',
        message: 'CPU usage crítico - Redis pode estar saturado',
        value: `${metrics.cpu.percentage.toFixed(1)}%`,
        threshold: `${t.cpu.critical}%`,
      });
    } else if (metrics.cpu.percentage >= t.cpu.warning) {
      alerts.push({
        level: 'warning',
        metric: 'CPU',
        message: 'CPU usage elevado - considere otimizar comandos',
        value: `${metrics.cpu.percentage.toFixed(1)}%`,
        threshold: `${t.cpu.warning}%`,
      });
    }

    // Memory Alerts
    if (metrics.memoryUsage.max > 0) {
      if (metrics.memoryUsage.percentage >= t.memory.critical) {
        alerts.push({
          level: 'critical',
          metric: 'Memory',
          message: 'Memória crítica - risco de evictions ou OOM',
          value: `${metrics.memoryUsage.percentage.toFixed(1)}%`,
          threshold: `${t.memory.critical}%`,
        });
      } else if (metrics.memoryUsage.percentage >= t.memory.warning) {
        alerts.push({
          level: 'warning',
          metric: 'Memory',
          message: 'Uso de memória elevado - planeje scaling',
          value: `${metrics.memoryUsage.percentage.toFixed(1)}%`,
          threshold: `${t.memory.warning}%`,
        });
      }
    }

    // Memory Fragmentation Alerts
    if (metrics.memoryFragmentation.ratio >= t.memoryFragmentation.critical) {
      alerts.push({
        level: 'critical',
        metric: 'Memory Fragmentation',
        message: 'Fragmentação crítica - considere restart do Redis',
        value: metrics.memoryFragmentation.ratio.toFixed(2),
        threshold: t.memoryFragmentation.critical.toFixed(1),
      });
    } else if (metrics.memoryFragmentation.ratio >= t.memoryFragmentation.warning) {
      alerts.push({
        level: 'warning',
        metric: 'Memory Fragmentation',
        message: 'Fragmentação elevada - monitore de perto',
        value: metrics.memoryFragmentation.ratio.toFixed(2),
        threshold: t.memoryFragmentation.warning.toFixed(1),
      });
    } else if (metrics.memoryFragmentation.ratio < t.memoryFragmentation.low) {
      alerts.push({
        level: 'critical',
        metric: 'Memory Fragmentation',
        message: 'Redis usando swap - performance degradada',
        value: metrics.memoryFragmentation.ratio.toFixed(2),
        threshold: `< ${t.memoryFragmentation.low}`,
      });
    }

    // Cache Hit Ratio Alerts
    if (metrics.cacheHitRatio < t.cacheHitRatio.critical) {
      alerts.push({
        level: 'critical',
        metric: 'Cache Hit Ratio',
        message: 'Hit ratio crítico - possível thrashing',
        value: `${metrics.cacheHitRatio.toFixed(1)}%`,
        threshold: `< ${t.cacheHitRatio.critical}%`,
      });
    } else if (metrics.cacheHitRatio < t.cacheHitRatio.warning) {
      alerts.push({
        level: 'warning',
        metric: 'Cache Hit Ratio',
        message: 'Hit ratio baixo - cache pode estar pequeno',
        value: `${metrics.cacheHitRatio.toFixed(1)}%`,
        threshold: `< ${t.cacheHitRatio.warning}%`,
      });
    }

    // Latency Alerts
    if (metrics.latency.p95 !== null) {
      if (metrics.latency.p95 >= t.latencyP95.critical) {
        alerts.push({
          level: 'critical',
          metric: 'Latency P95',
          message: 'Latência crítica - performance degradada',
          value: `${metrics.latency.p95.toFixed(2)}ms`,
          threshold: `>= ${t.latencyP95.critical}ms`,
        });
      } else if (metrics.latency.p95 >= t.latencyP95.warning) {
        alerts.push({
          level: 'warning',
          metric: 'Latency P95',
          message: 'Latência elevada - investigue comandos lentos',
          value: `${metrics.latency.p95.toFixed(2)}ms`,
          threshold: `>= ${t.latencyP95.warning}ms`,
        });
      }
    }

    // Rejected Connections Alert
    if (metrics.connections.rejected > t.connections.rejectedWarning) {
      alerts.push({
        level: 'warning',
        metric: 'Rejected Connections',
        message: 'Conexões rejeitadas - limite de maxclients atingido',
        value: metrics.connections.rejected,
        threshold: `> ${t.connections.rejectedWarning}`,
      });
    }

    // Blocked Clients Alert
    if (metrics.connections.blocked > 0) {
      alerts.push({
        level: 'info',
        metric: 'Blocked Clients',
        message: 'Clientes bloqueados aguardando operações',
        value: metrics.connections.blocked,
        threshold: '> 0',
      });
    }

    // Eviction Rate Alert
    if (metrics.eviction.evictedPerSec > 100) {
      alerts.push({
        level: 'warning',
        metric: 'Eviction Rate',
        message: 'Taxa de eviction elevada - memória insuficiente',
        value: `${metrics.eviction.evictedPerSec.toFixed(1)}/s`,
        threshold: '> 100/s',
      });
    }

    // Replication Errors
    if (metrics.replication.syncPartialErr > 0) {
      alerts.push({
        level: 'warning',
        metric: 'Replication',
        message: 'Erros de sincronização parcial detectados',
        value: metrics.replication.syncPartialErr,
        threshold: '> 0',
      });
    }

    return alerts;
  }

  private static calculateHealth(alerts: MetricAlert[]): 'healthy' | 'warning' | 'critical' {
    const hasCritical = alerts.some(a => a.level === 'critical');
    const hasWarning = alerts.some(a => a.level === 'warning');

    if (hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'healthy';
  }
}
