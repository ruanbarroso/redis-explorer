export interface RedisConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  database?: number;
  ssl?: boolean;
  connected?: boolean;
}

export interface RedisKey {
  name: string;
  type: RedisDataType;
  ttl: number;
  size: number;
  encoding?: string;
}

export type RedisDataType = 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream' | 'json';

export interface RedisValue {
  type: RedisDataType;
  value: any;
  ttl: number;
  size: number;
  encoding?: string;
}

export interface RedisInfo {
  server: Record<string, string>;
  clients: Record<string, string>;
  memory: Record<string, string>;
  persistence: Record<string, string>;
  stats: Record<string, string>;
  replication: Record<string, string>;
  cpu: Record<string, string>;
  commandstats: Record<string, string>;
  cluster: Record<string, string>;
  keyspace: Record<string, string>;
}

export interface RedisStats {
  connectedClients: number;
  usedMemory: number;
  usedMemoryHuman: string;
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  evictedKeys: number;
  expiredKeys: number;
  // Additional stats
  maxMemory?: number;
  maxMemoryHuman?: string;
  memoryFragmentationRatio?: number;
  uptimeInSeconds: number;
  uptimeInDays: number;
  totalNetInputBytes: number;
  totalNetOutputBytes: number;
  rejectedConnections: number;
  syncFull: number;
  syncPartialOk: number;
  syncPartialErr: number;
  pubsubChannels: number;
  pubsubPatterns: number;
  latestForkUsec: number;
  blockedClients: number;
  trackingClients: number;
  // Keyspace info
  totalKeys: number;
  totalExpires: number;
  avgTtl: number;
}

export interface RedisCommand {
  command: string;
  timestamp: number;
  duration?: number;
  result?: any;
  error?: string;
}

export interface SlowLogEntry {
  id: number;
  timestamp: number;
  duration: number;
  command: string[];
  clientAddress?: string;
  clientName?: string;
}
