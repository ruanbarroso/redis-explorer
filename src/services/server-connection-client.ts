import { RedisConnection } from '@/types/redis';

class ServerConnectionClient {
  private baseUrl = '/api/connections';

  // Load all connections from server
  async loadConnections(): Promise<RedisConnection[]> {
    try {
      console.log('ServerConnectionClient: Loading connections from', this.baseUrl);
      const response = await fetch(this.baseUrl);
      console.log('ServerConnectionClient: Response status:', response.status);
      
      const result = await response.json();
      console.log('ServerConnectionClient: Response data:', result);
      
      if (result.success) {
        console.log('ServerConnectionClient: Returning connections:', result.connections);
        return result.connections || [];
      } else {
        console.error('Failed to load connections:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      return [];
    }
  }

  // Save a connection to server
  async saveConnection(connection: RedisConnection): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving connection:', error);
      return false;
    }
  }

  // Update an existing connection on server
  async updateConnection(connection: RedisConnection): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating connection:', error);
      return false;
    }
  }

  // Remove a connection from server
  async removeConnection(connectionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${connectionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error removing connection:', error);
      return false;
    }
  }

  // Clear all connections on server
  async clearAllConnections(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error clearing connections:', error);
      return false;
    }
  }

  // Export connections from server
  async exportConnections(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/export`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                        `redis-connections-${new Date().toISOString().split('T')[0]}.json`;
        
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting connections:', error);
      throw error;
    }
  }

  // Import connections to server
  async importConnections(connections: RedisConnection[]): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connections }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error importing connections:', error);
      return { success: false, error: 'Failed to import connections' };
    }
  }

  // Migrate data from localStorage to server (one-time migration)
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const localStorageKey = 'redis-explorer-connections';
      const localData = localStorage.getItem(localStorageKey);
      
      if (!localData) {
        return true; // Nothing to migrate
      }

      const localConnections = JSON.parse(localData) as RedisConnection[];
      
      if (localConnections.length === 0) {
        return true; // Nothing to migrate
      }

      // Import to server
      const result = await this.importConnections(localConnections);
      
      if (result.success) {
        // Clear localStorage after successful migration
        localStorage.removeItem(localStorageKey);
        console.log(`Migrated ${result.importedCount} connections from localStorage to server`);
        return true;
      } else {
        console.error('Failed to migrate connections:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  }

  // Import connections from file (for UI usage)
  async importConnectionsFromFile(file: File): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const connections = JSON.parse(e.target?.result as string) as RedisConnection[];
          const result = await this.importConnections(connections);
          resolve(result);
        } catch (error) {
          resolve({ success: false, error: 'Invalid JSON file format' });
        }
      };
      
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  }
}

export const serverConnectionClient = new ServerConnectionClient();
