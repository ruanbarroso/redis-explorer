import { RedisConnection } from '@/types/redis';

const STORAGE_KEY = 'redis-explorer-connections';
const ENCRYPTION_KEY = 'redis-explorer-key';

// Simple encryption/decryption for passwords (not production-grade, but better than plain text)
const encrypt = (text: string): string => {
  try {
    return btoa(encodeURIComponent(text));
  } catch {
    return text;
  }
};

const decrypt = (encryptedText: string): string => {
  try {
    return decodeURIComponent(atob(encryptedText));
  } catch {
    return encryptedText;
  }
};

export const connectionStorage = {
  // Save connections to localStorage
  saveConnections: (connections: RedisConnection[]): void => {
    try {
      const connectionsToSave = connections.map(conn => ({
        ...conn,
        // Encrypt password for basic security
        password: conn.password ? encrypt(conn.password) : '',
        // Don't save connection status
        connected: false,
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connectionsToSave));
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  },

  // Load connections from localStorage
  loadConnections: (): RedisConnection[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const connections = JSON.parse(stored) as RedisConnection[];
      
      // Decrypt passwords and ensure proper structure
      return connections.map(conn => ({
        ...conn,
        password: conn.password ? decrypt(conn.password) : '',
        connected: false, // Always start as disconnected
      }));
    } catch (error) {
      console.error('Failed to load connections:', error);
      return [];
    }
  },

  // Clear all saved connections
  clearConnections: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear connections:', error);
    }
  },

  // Export connections to JSON file
  exportConnections: (connections: RedisConnection[]): void => {
    try {
      const dataStr = JSON.stringify(connections, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `redis-connections-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export connections:', error);
    }
  },

  // Import connections from JSON file
  importConnections: (file: File): Promise<RedisConnection[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const connections = JSON.parse(e.target?.result as string) as RedisConnection[];
          
          // Validate structure and clean data
          const validConnections = connections
            .filter(conn => conn.id && conn.name && conn.host)
            .map(conn => ({
              ...conn,
              connected: false, // Always start as disconnected
            }));
          
          resolve(validConnections);
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
