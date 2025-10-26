import { RedisKey, RedisValue, RedisStats, RedisInfo, SlowLogEntry, RedisCommand } from '@/types/redis';

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

class RedisApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`/api/redis/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to execute Redis command');
    }

    return response.json();
  }

  // Métodos para stats
  async getStats(): Promise<RedisStats> {
    const response = await this.request<ApiResponse<RedisStats>>('stats');
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  async getInfo(): Promise<RedisInfo> {
    const response = await this.request<ApiResponse<RedisInfo>>('info');
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  async getSlowLog(count: number = 10): Promise<SlowLogEntry[]> {
    const response = await this.request<ApiResponse<SlowLogEntry[]>>(`slowlog?count=${count}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Métodos para keys
  async getKeys(pattern: string = '*'): Promise<RedisKey[]> {
    const response = await this.request<ApiResponse<RedisKey[]>>(`keys?pattern=${encodeURIComponent(pattern)}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  async getKeyValue(key: string): Promise<RedisValue> {
    const response = await this.request<ApiResponse<RedisValue>>(`key/${encodeURIComponent(key)}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  async setKeyValue(key: string, value: string, ttl?: number): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`key/${encodeURIComponent(key)}`, {
      method: 'POST',
      body: JSON.stringify({ value, ttl }),
    });
    if (response.error) throw new Error(response.error);
  }

  async deleteKey(key: string): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`key/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    if (response.error) throw new Error(response.error);
  }

  // Método para executar comandos arbitrários
  async executeCommand(command: string, args: (string | number)[] = []): Promise<any> {
    const response = await this.request<ApiResponse<any>>('command', {
      method: 'POST',
      body: JSON.stringify({ command, args }),
    });
    if (response.error) throw new Error(response.error);
    return response.data;
  }

  async testConnection(connection: { host: string; port: number; password?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/redis/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao testar conexão');
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}

export const redisApiService = new RedisApiService();
