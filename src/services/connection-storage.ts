import fs from 'fs';
import path from 'path';
import { RedisConnection } from '@/types/redis';
import crypto from 'crypto';

// Cross-platform user data directory
const getUserDataDir = (): string => {
  // Check for custom data directory (Docker/Kubernetes)
  if (process.env.REDIS_EXPLORER_DATA_DIR) {
    return process.env.REDIS_EXPLORER_DATA_DIR;
  }
  
  const platform = process.platform;
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  
  switch (platform) {
    case 'win32':
      return process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support');
    case 'linux':
      return process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
    default:
      return path.join(homeDir, '.redis-explorer');
  }
};

const APP_DATA_DIR = process.env.REDIS_EXPLORER_DATA_DIR || path.join(getUserDataDir(), 'redis-explorer');
const CONNECTIONS_FILE = path.join(APP_DATA_DIR, 'connections.json');
const ENCRYPTION_KEY = process.env.REDIS_EXPLORER_KEY || 'default-key-change-in-production';

// Simple encryption for passwords (better than localStorage)
const encrypt = (text: string): string => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
};

const decrypt = (text: string): string => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    if (parts.length !== 2) return text; // Return original if not encrypted format
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original text if decryption fails
  }
};

// Ensure data directory exists
const ensureDataDir = (): void => {
  try {
    if (!fs.existsSync(APP_DATA_DIR)) {
      fs.mkdirSync(APP_DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
};

export class ServerConnectionStorage {
  constructor() {
    ensureDataDir();
  }

  // Load connections from server storage
  loadConnections(): RedisConnection[] {
    try {
      if (!fs.existsSync(CONNECTIONS_FILE)) {
        return [];
      }

      const data = fs.readFileSync(CONNECTIONS_FILE, 'utf8');
      const connections = JSON.parse(data) as RedisConnection[];
      
      // Decrypt passwords
      return connections.map(conn => ({
        ...conn,
        password: conn.password ? decrypt(conn.password) : '',
        connected: false, // Always start as disconnected
      }));
    } catch (error) {
      console.error('Failed to load connections:', error);
      return [];
    }
  }

  // Save connections to server storage
  saveConnections(connections: RedisConnection[]): boolean {
    try {
      ensureDataDir();
      
      // Encrypt passwords before saving
      const connectionsToSave = connections.map(conn => ({
        ...conn,
        password: conn.password ? encrypt(conn.password) : '',
        connected: false, // Never save connection status
      }));
      
      const data = JSON.stringify(connectionsToSave, null, 2);
      fs.writeFileSync(CONNECTIONS_FILE, data, 'utf8');
      
      return true;
    } catch (error) {
      console.error('Failed to save connections:', error);
      return false;
    }
  }

  // Add a new connection
  addConnection(connection: RedisConnection): boolean {
    try {
      const connections = this.loadConnections();
      
      // Check if connection with same ID already exists
      const existingIndex = connections.findIndex(conn => conn.id === connection.id);
      if (existingIndex !== -1) {
        // Update existing connection
        connections[existingIndex] = { ...connection, connected: false };
      } else {
        // Add new connection
        connections.push({ ...connection, connected: false });
      }
      
      return this.saveConnections(connections);
    } catch (error) {
      console.error('Failed to add connection:', error);
      return false;
    }
  }

  // Remove a connection
  removeConnection(connectionId: string): boolean {
    try {
      const connections = this.loadConnections();
      const filteredConnections = connections.filter(conn => conn.id !== connectionId);
      
      return this.saveConnections(filteredConnections);
    } catch (error) {
      console.error('Failed to remove connection:', error);
      return false;
    }
  }

  // Update an existing connection
  updateConnection(connection: RedisConnection): boolean {
    try {
      const connections = this.loadConnections();
      const index = connections.findIndex(conn => conn.id === connection.id);
      
      if (index === -1) {
        return false; // Connection not found
      }
      
      connections[index] = { ...connection, connected: false };
      return this.saveConnections(connections);
    } catch (error) {
      console.error('Failed to update connection:', error);
      return false;
    }
  }

  // Clear all connections
  clearAllConnections(): boolean {
    try {
      if (fs.existsSync(CONNECTIONS_FILE)) {
        fs.unlinkSync(CONNECTIONS_FILE);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear connections:', error);
      return false;
    }
  }

  // Export connections to JSON (for backup/sharing)
  exportConnections(): RedisConnection[] {
    return this.loadConnections();
  }

  // Import connections from JSON (merge with existing)
  importConnections(connections: RedisConnection[]): boolean {
    try {
      const existingConnections = this.loadConnections();
      const existingIds = new Set(existingConnections.map(conn => conn.id));
      
      // Filter out duplicates and add new connections
      const newConnections = connections
        .filter(conn => conn.id && conn.name && conn.host) // Validate structure
        .filter(conn => !existingIds.has(conn.id)) // Avoid duplicates
        .map(conn => ({ ...conn, connected: false })); // Ensure not connected
      
      const allConnections = [...existingConnections, ...newConnections];
      return this.saveConnections(allConnections);
    } catch (error) {
      console.error('Failed to import connections:', error);
      return false;
    }
  }

  // Get storage info (for debugging)
  getStorageInfo() {
    return {
      dataDir: APP_DATA_DIR,
      connectionsFile: CONNECTIONS_FILE,
      exists: fs.existsSync(CONNECTIONS_FILE),
      platform: process.platform,
    };
  }
}

export const serverConnectionStorage = new ServerConnectionStorage();
