import { RedisConnection, RedisKey, RedisValue, RedisStats, RedisInfo, SlowLogEntry } from '@/types/redis';

class RedisClientService {
  private baseUrl = '/api/redis';

  async connect(connection: RedisConnection): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: 'POST',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async getKeys(pattern: string = '*', count: number = 100): Promise<RedisKey[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/keys?pattern=${encodeURIComponent(pattern)}&count=${count}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch keys');
      }

      const result = await response.json();
      return result.keys || [];
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  async getValue(key: string): Promise<RedisValue | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/value?key=${encodeURIComponent(key)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch value');
      }

      const result = await response.json();
      return result.value;
    } catch (error) {
      console.error('Error getting value:', error);
      return null;
    }
  }

  async setValue(key: string, value: any, type: string, ttl?: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/value`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, type, ttl }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }

  async deleteKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/keys`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting key:', error);
      return false;
    }
  }

  async getStats(): Promise<RedisStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching stats:', error.message);
      } else {
        console.error('Error fetching stats:', error);
      }
      return null;
    }
  }

  async getInfo(): Promise<RedisInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch info: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.info;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting info:', error.message);
      } else {
        console.error('Error getting info:', error);
      }
      return null;
    }
  }

  async getSlowLog(count: number = 10): Promise<SlowLogEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/slowlog?count=${count}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch slow log');
      }

      const result = await response.json();
      return result.slowLog || [];
    } catch (error) {
      console.error('Error getting slow log:', error);
      return [];
    }
  }

  async executeCommand(command: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Command failed');
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      throw error;
    }
  }
}

export const redisClientService = new RedisClientService();
