export type AlertLevel = 'critical' | 'warning' | 'info';

export interface MetricAlert {
  level: AlertLevel;
  metric: string;
  message: string;
  value: number | string;
  threshold: number | string;
}

export interface RedisMetrics {
  // Métricas Críticas (Tier 1)
  cacheHitRatio: number; // Percentual 0-100
  memoryUsage: {
    used: number; // bytes
    usedHuman: string;
    max: number; // bytes
    maxHuman: string;
    percentage: number; // 0-100
  };
  memoryFragmentation: {
    ratio: number;
    bytes: number;
  };
  cpu: {
    percentage: number; // 0-100
    sys: number;
    user: number;
  };
  latency: {
    p50: number | null; // milliseconds
    p95: number | null; // milliseconds
    p99: number | null; // milliseconds
  };

  // Métricas de Performance (Tier 2)
  throughput: {
    opsPerSec: number;
    totalCommands: number;
  };
  connections: {
    connected: number;
    blocked: number;
    rejected: number;
    total: number;
  };
  eviction: {
    evictedKeys: number;
    evictedPerSec: number;
  };
  expiration: {
    expiredKeys: number;
    expiredPerSec: number;
  };

  // Métricas de Atividade (Tier 3)
  network: {
    inputKbps: number;
    outputKbps: number;
    totalInputBytes: number;
    totalOutputBytes: number;
  };
  keyspace: {
    totalKeys: number;
    totalExpires: number;
    avgTtl: number;
    databases: Array<{
      db: number;
      keys: number;
      expires: number;
      avgTtl: number;
    }>;
  };
  replication: {
    role: string;
    connectedSlaves: number;
    syncFull: number;
    syncPartialOk: number;
    syncPartialErr: number;
  };

  // Informações do Servidor
  server: {
    version: string;
    mode: string;
    uptime: number; // seconds
    uptimeDays: number;
    os: string;
    processId: string;
  };

  // Sistema de Alertas
  alerts: MetricAlert[];
  health: 'healthy' | 'warning' | 'critical';

  // Timestamp
  timestamp: number;
}

export interface MetricThresholds {
  cpu: {
    warning: number; // 65%
    critical: number; // 80%
  };
  memory: {
    warning: number; // 70%
    critical: number; // 80%
  };
  cacheHitRatio: {
    warning: number; // 80%
    critical: number; // 50%
  };
  memoryFragmentation: {
    warning: number; // 1.4
    critical: number; // 1.5
    low: number; // 1.0
  };
  latencyP95: {
    warning: number; // 5ms
    critical: number; // 10ms
  };
  connections: {
    rejectedWarning: number; // 0
  };
}

export const DEFAULT_THRESHOLDS: MetricThresholds = {
  cpu: {
    warning: 65,
    critical: 80,
  },
  memory: {
    warning: 70,
    critical: 80,
  },
  cacheHitRatio: {
    warning: 80,
    critical: 50,
  },
  memoryFragmentation: {
    warning: 1.4,
    critical: 1.5,
    low: 1.0,
  },
  latencyP95: {
    warning: 5,
    critical: 10,
  },
  connections: {
    rejectedWarning: 0,
  },
};
