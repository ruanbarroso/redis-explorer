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
        credentials: 'include',
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
        credentials: 'include',
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
      const response = await fetch(`${this.baseUrl}/ping`, {
        credentials: 'include',
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async getKeys(pattern: string = '*', count: number = 100): Promise<RedisKey[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/keys?pattern=${encodeURIComponent(pattern)}&count=${count}`,
        { credentials: 'include' }
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

  async getAllKeys(pattern: string = '*'): Promise<RedisKey[]> {
    try {
      console.log('🚀 Iniciando carregamento de todas as chaves...');
      const response = await fetch(
        `${this.baseUrl}/keys?pattern=${encodeURIComponent(pattern)}&loadAll=true`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch all keys');
      }

      const result = await response.json();
      console.log(`✅ Carregamento concluído: ${result.total} chaves carregadas`);
      return result.keys || [];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async getValue(key: string): Promise<RedisValue | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/value?key=${encodeURIComponent(key)}`,
        { credentials: 'include' }
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
        signal: AbortSignal.timeout(20000), // 20 seconds timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      // Only log non-connection errors
      if (error instanceof Error && 
          !error.message.includes('502') && 
          !error.message.includes('503') &&
          !error.message.includes('Failed to fetch')) {
        console.error('Error fetching stats:', error.message);
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
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch info: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.info;
    } catch (error) {
      // Only log non-connection errors
      if (error instanceof Error && 
          !error.message.includes('502') && 
          !error.message.includes('503') &&
          !error.message.includes('Failed to fetch')) {
        console.error('Error getting info:', error.message);
      }
      return null;
    }
  }

  async getSlowLog(count: number = 10): Promise<SlowLogEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/slowlog?count=${count}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch slow log');
      }

      const result = await response.json();
      return result.slowLog || [];
    } catch (error) {
      // Only log non-connection errors
      if (error instanceof Error && 
          !error.message.includes('502') && 
          !error.message.includes('503') &&
          !error.message.includes('Failed to fetch')) {
        console.error('Error getting slow log:', error.message);
      }
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
        credentials: 'include',
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
