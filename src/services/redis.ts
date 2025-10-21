import Redis from 'ioredis';
import {
  RedisConnection,
  RedisKey,
  RedisValue,
  RedisInfo,
  RedisStats,
  SlowLogEntry,
  RedisDataType,
} from '@/types/redis';

class RedisService {
  private connections: Map<string, Redis> = new Map();
  private activeConnection: string | null = null;

  constructor() {
    console.log('RedisService: New instance created');
  }

  async connect(connection: RedisConnection): Promise<boolean> {
    try {
      console.log('RedisService: Connecting to', connection.host + ':' + connection.port);
      const redis = new Redis({
        host: connection.host,
        port: connection.port,
        password: connection.password,
        db: connection.database || 0,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      await redis.connect();
      this.connections.set(connection.id, redis);
      this.activeConnection = connection.id;
      
      console.log('RedisService: Connected successfully. Active connection:', this.activeConnection);
      console.log('RedisService: Total connections:', this.connections.size);
      
      return true;
    } catch (error) {
      console.error('Redis connection error:', error);
      return false;
    }
  }

  disconnect(connectionId: string): void {
    const redis = this.connections.get(connectionId);
    if (redis) {
      redis.disconnect();
      this.connections.delete(connectionId);
      if (this.activeConnection === connectionId) {
        this.activeConnection = null;
      }
    }
  }

  getActiveConnection(): Redis | null {
    console.log('getActiveConnection: activeConnection =', this.activeConnection);
    console.log('getActiveConnection: connections size =', this.connections.size);
    console.log('getActiveConnection: connections keys =', Array.from(this.connections.keys()));
    
    if (!this.activeConnection) return null;
    const connection = this.connections.get(this.activeConnection);
    console.log('getActiveConnection: found connection =', !!connection);
    return connection || null;
  }

  async ping(): Promise<boolean> {
    const redis = this.getActiveConnection();
    if (!redis) return false;

    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async getKeys(pattern: string = '*', count: number = 100): Promise<RedisKey[]> {
    const redis = this.getActiveConnection();
    if (!redis) return [];

    try {
      const keys = await redis.keys(pattern);
      const limitedKeys = keys.slice(0, count);
      
      const keyDetails = await Promise.all(
        limitedKeys.map(async (key) => {
          const [type, ttl, size] = await Promise.all([
            redis.type(key),
            redis.ttl(key),
            this.getKeySize(key),
          ]);

          return {
            name: key,
            type: type as RedisDataType,
            ttl,
            size,
          };
        })
      );

      return keyDetails;
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  async getValue(key: string): Promise<RedisValue | null> {
    const redis = this.getActiveConnection();
    if (!redis) return null;

    try {
      const type = await redis.type(key);
      const ttl = await redis.ttl(key);
      const size = await this.getKeySize(key);

      let value: any;

      switch (type) {
        case 'string':
          value = await redis.get(key);
          break;
        case 'hash':
          value = await redis.hgetall(key);
          break;
        case 'list':
          value = await redis.lrange(key, 0, -1);
          break;
        case 'set':
          value = await redis.smembers(key);
          break;
        case 'zset':
          value = await redis.zrange(key, 0, -1, 'WITHSCORES');
          break;
        default:
          value = null;
      }

      return {
        type: type as RedisDataType,
        value,
        ttl,
        size,
      };
    } catch (error) {
      console.error('Error getting value:', error);
      return null;
    }
  }

  async setValue(key: string, value: any, type: RedisDataType, ttl?: number): Promise<boolean> {
    const redis = this.getActiveConnection();
    if (!redis) return false;

    try {
      switch (type) {
        case 'string':
          await redis.set(key, value);
          break;
        case 'hash':
          await redis.hmset(key, value);
          break;
        case 'list':
          await redis.del(key);
          if (Array.isArray(value) && value.length > 0) {
            await redis.lpush(key, ...value.reverse());
          }
          break;
        case 'set':
          await redis.del(key);
          if (Array.isArray(value) && value.length > 0) {
            await redis.sadd(key, ...value);
          }
          break;
        case 'zset':
          await redis.del(key);
          if (Array.isArray(value) && value.length > 0) {
            const args = value.flatMap((item, index) => [index, item]);
            await redis.zadd(key, ...args);
          }
          break;
      }

      if (ttl && ttl > 0) {
        await redis.expire(key, ttl);
      }

      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }

  async deleteKey(key: string): Promise<boolean> {
    const redis = this.getActiveConnection();
    if (!redis) return false;

    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Error deleting key:', error);
      return false;
    }
  }

  async getInfo(): Promise<RedisInfo | null> {
    const redis = this.getActiveConnection();
    if (!redis) return null;

    try {
      const info = await redis.info();
      return this.parseInfo(info);
    } catch (error) {
      console.error('Error getting info:', error);
      return null;
    }
  }

  async getStats(): Promise<RedisStats | null> {
    const redis = this.getActiveConnection();
    if (!redis) {
      console.log('getStats: No active connection');
      return null;
    }

    try {
      console.log('getStats: Getting info...');
      const info = await this.getInfo();
      if (!info) {
        console.log('getStats: No info returned');
        return null;
      }
      console.log('getStats: Info received:', Object.keys(info));

      // Calculate keyspace totals
      let totalKeys = 0;
      let totalExpires = 0;
      try {
        Object.entries(info.keyspace || {}).forEach(([db, dbInfo]) => {
          if (typeof dbInfo === 'string' && dbInfo.includes('keys=')) {
            const keysMatch = dbInfo.match(/keys=(\d+)/);
            const expiresMatch = dbInfo.match(/expires=(\d+)/);
            if (keysMatch) totalKeys += parseInt(keysMatch[1]);
            if (expiresMatch) totalExpires += parseInt(expiresMatch[1]);
          }
        });
      } catch (error) {
        console.warn('Error parsing keyspace info:', error);
      }

      const avgTtl = totalExpires > 0 ? Math.round((totalExpires / totalKeys) * 100) / 100 : 0;

      return {
        connectedClients: parseInt(info.clients?.connected_clients || '0'),
        usedMemory: parseInt(info.memory?.used_memory || '0'),
        usedMemoryHuman: info.memory?.used_memory_human || '0B',
        totalCommandsProcessed: parseInt(info.stats?.total_commands_processed || '0'),
        instantaneousOpsPerSec: parseInt(info.stats?.instantaneous_ops_per_sec || '0'),
        keyspaceHits: parseInt(info.stats?.keyspace_hits || '0'),
        keyspaceMisses: parseInt(info.stats?.keyspace_misses || '0'),
        evictedKeys: parseInt(info.stats?.evicted_keys || '0'),
        expiredKeys: parseInt(info.stats?.expired_keys || '0'),
        // Additional stats with safe access
        maxMemory: parseInt(info.memory?.maxmemory || '0'),
        maxMemoryHuman: info.memory?.maxmemory_human || 'unlimited',
        memoryFragmentationRatio: parseFloat(info.memory?.mem_fragmentation_ratio || '1.0'),
        uptimeInSeconds: parseInt(info.server?.uptime_in_seconds || '0'),
        uptimeInDays: parseInt(info.server?.uptime_in_days || '0'),
        totalNetInputBytes: parseInt(info.stats?.total_net_input_bytes || '0'),
        totalNetOutputBytes: parseInt(info.stats?.total_net_output_bytes || '0'),
        rejectedConnections: parseInt(info.stats?.rejected_connections || '0'),
        syncFull: parseInt(info.replication?.sync_full || '0'),
        syncPartialOk: parseInt(info.replication?.sync_partial_ok || '0'),
        syncPartialErr: parseInt(info.replication?.sync_partial_err || '0'),
        pubsubChannels: parseInt(info.stats?.pubsub_channels || '0'),
        pubsubPatterns: parseInt(info.stats?.pubsub_patterns || '0'),
        latestForkUsec: parseInt(info.stats?.latest_fork_usec || '0'),
        blockedClients: parseInt(info.clients?.blocked_clients || '0'),
        trackingClients: parseInt(info.clients?.tracking_clients || '0'),
        // Keyspace info
        totalKeys,
        totalExpires,
        avgTtl,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  async getSlowLog(count: number = 10): Promise<SlowLogEntry[]> {
    const redis = this.getActiveConnection();
    if (!redis) return [];

    try {
      const slowLog = await redis.call('SLOWLOG', 'GET', count) as any[];
      return slowLog.map((entry: any) => ({
        id: entry[0],
        timestamp: entry[1],
        duration: entry[2],
        command: entry[3],
        clientAddress: entry[4],
        clientName: entry[5],
      }));
    } catch (error) {
      console.error('Error getting slow log:', error);
      return [];
    }
  }

  async executeCommand(command: string): Promise<any> {
    const redis = this.getActiveConnection();
    if (!redis) throw new Error('No active connection');

    try {
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      // @ts-ignore
      return await redis[cmd](...args);
    } catch (error) {
      throw error;
    }
  }

  private async getKeySize(key: string): Promise<number> {
    const redis = this.getActiveConnection();
    if (!redis) return 0;

    try {
      const type = await redis.type(key);
      
      switch (type) {
        case 'string':
          return await redis.strlen(key);
        case 'hash':
          return await redis.hlen(key);
        case 'list':
          return await redis.llen(key);
        case 'set':
          return await redis.scard(key);
        case 'zset':
          return await redis.zcard(key);
        default:
          return 0;
      }
    } catch {
      return 0;
    }
  }

  private parseInfo(infoString: string): RedisInfo {
    const sections: RedisInfo = {
      server: {},
      clients: {},
      memory: {},
      persistence: {},
      stats: {},
      replication: {},
      cpu: {},
      commandstats: {},
      cluster: {},
      keyspace: {},
    };

    let currentSection = '';
    const lines = infoString.split('\r\n');

    for (const line of lines) {
      if (line.startsWith('#')) {
        const sectionName = line.substring(2).toLowerCase();
        if (sections[sectionName as keyof RedisInfo]) {
          currentSection = sectionName;
        }
      } else if (line.includes(':') && currentSection) {
        const [key, value] = line.split(':');
        (sections[currentSection as keyof RedisInfo] as Record<string, string>)[key] = value;
      }
    }

    return sections;
  }
}

// Use global singleton to persist across Next.js hot reloads
const globalForRedis = globalThis as unknown as {
  redisService: RedisService | undefined;
};

export const redisService = globalForRedis.redisService ?? new RedisService();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisService = redisService;
}
