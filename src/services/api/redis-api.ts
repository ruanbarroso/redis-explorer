import { isServer } from '@/lib/server-only';

// Tipos para a API
type TestConnectionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

class RedisApiClient {
  private baseUrl = '/api/redis';

  async testConnection(connection: {
    host: string;
    port: number;
    password?: string;
  }): Promise<TestConnectionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || 'Falha ao testar conexão',
        };
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

// Exporta uma instância única do cliente
export const redisApiClient = new RedisApiClient();
