import Redis from 'ioredis';
import { RedisConnection } from '@/types/redis';

interface SessionData {
  connectionId: string | null;
  lastActivity: number;
}

interface RedisConnectionData {
  redis: Redis;
  sessionCount: number; // Quantas sessões usam esta conexão
}

class SessionManager {
  private sessions = new Map<string, SessionData>();
  private connections = new Map<string, RedisConnectionData>(); // connectionId -> Redis
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Executar cleanup a cada 10 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 10 * 60 * 1000);
  }

  getSession(sessionId: string): SessionData {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        connectionId: null,
        lastActivity: Date.now(),
      });
    }
    const session = this.sessions.get(sessionId)!;
    session.lastActivity = Date.now(); // Atualizar última atividade
    return session;
  }

  async connect(sessionId: string, connection: RedisConnection): Promise<boolean> {
    try {
      const session = this.getSession(sessionId);
      
      // Se já está conectado à mesma connection, apenas incrementar contador
      if (session.connectionId === connection.id) {
        const connData = this.connections.get(connection.id);
        if (connData) {
          // Verificar se a conexão ainda está ativa
          try {
            await connData.redis.ping();
            return true; // Conexão ativa, reutilizar
          } catch (pingError) {
            // Conexão morreu, remover e reconectar
            this.connections.delete(connection.id);
          }
        }
      }
      
      // Guardar connectionId anterior para desconectar depois
      const previousConnectionId = session.connectionId !== connection.id ? session.connectionId : null;
      
      // Verificar se já existe uma conexão para este connectionId
      let connData = this.connections.get(connection.id);
      
      if (!connData) {
        // Criar nova conexão Redis
        const redis = new Redis({
          host: connection.host,
          port: connection.port,
          password: connection.password,
          db: connection.database || 0,
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });

        // Tentar conectar - se falhar, lança erro e não altera nada
        await redis.connect();
        
        connData = {
          redis,
          sessionCount: 0,
        };
        this.connections.set(connection.id, connData);
      }
      
      // APENAS se chegou aqui, a conexão foi bem-sucedida
      // Agora sim podemos atualizar a session e incrementar contador
      connData.sessionCount++;
      session.connectionId = connection.id;
      
      // Só desconectar da conexão anterior DEPOIS que a nova foi bem-sucedida
      if (previousConnectionId) {
        await this.decrementConnectionUsage(previousConnectionId);
      }
      
      return true;
    } catch (error) {
      console.error(`SessionManager: Error connecting session ${sessionId}:`, error);
      // Se der erro, a session.connectionId NÃO foi alterada
      // A conexão anterior permanece ativa
      throw error;
    }
  }
  
  private async decrementConnectionUsage(connectionId: string): Promise<void> {
    const connData = this.connections.get(connectionId);
    if (connData) {
      connData.sessionCount--;
      
      // Se nenhuma sessão está usando esta conexão, fechá-la
      if (connData.sessionCount <= 0) {
        await connData.redis.quit().catch(() => {});
        this.connections.delete(connectionId);
      }
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session?.connectionId) {
      await this.decrementConnectionUsage(session.connectionId);
      session.connectionId = null;
    }
  }

  getRedis(sessionId: string): Redis | null {
    const session = this.getSession(sessionId);
    if (!session.connectionId) {
      return null;
    }
    const connData = this.connections.get(session.connectionId);
    return connData?.redis || null;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Cleanup de sessões antigas (opcional)
  cleanup(): void {
    this.connections.forEach((connData) => {
      connData.redis.quit().catch(() => {});
    });
    this.connections.clear();
    this.sessions.clear();
  }

  // Cleanup automático de sessões inativas (24 horas)
  cleanupInactiveSessions(): void {
    const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas
    const now = Date.now();
    
    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
        if (session.connectionId) {
          this.decrementConnectionUsage(session.connectionId).catch(() => {});
        }
        this.sessions.delete(sessionId);
      }
    });
  }
}

// Singleton global
const globalForSessionManager = globalThis as unknown as {
  sessionManager: SessionManager | undefined;
};

export const sessionManager = globalForSessionManager.sessionManager ?? new SessionManager();

if (process.env.NODE_ENV !== 'production') {
  globalForSessionManager.sessionManager = sessionManager;
}
