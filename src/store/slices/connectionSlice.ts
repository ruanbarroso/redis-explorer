import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RedisConnection } from '@/types/redis';
import { redisClientService } from '@/services/redis-client';
import { serverConnectionClient } from '@/services/server-connection-client';

interface ConnectionState {
  connections: RedisConnection[];
  activeConnection: RedisConnection | null;
  isConnecting: boolean;
  error: string | null;
}

// Load active connection from localStorage if available
const loadActiveConnectionFromStorage = (): RedisConnection | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('redis-explorer-active-connection');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
};

// Save active connection to localStorage
const saveActiveConnectionToStorage = (connection: RedisConnection | null) => {
  if (typeof window !== 'undefined') {
    try {
      if (connection) {
        localStorage.setItem('redis-explorer-active-connection', JSON.stringify(connection));
      } else {
        localStorage.removeItem('redis-explorer-active-connection');
      }
    } catch {
      // Ignore localStorage errors
    }
  }
};

const initialState: ConnectionState = {
  connections: [],
  activeConnection: loadActiveConnectionFromStorage(),
  isConnecting: false,
  error: null,
};

export const loadConnections = createAsyncThunk(
  'connection/loadConnections',
  async () => {
    try {
      const connections = await serverConnectionClient.loadConnections();
      console.log('Loaded connections:', connections);
      
      return connections;
    } catch (error) {
      console.error('Failed to load connections:', error);
      throw error;
    }
  }
);

export const migrateFromLocalStorage = createAsyncThunk(
  'connection/migrateFromLocalStorage',
  async () => {
    try {
      const success = await serverConnectionClient.migrateFromLocalStorage();
      return success;
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
      throw error;
    }
  }
);

export const saveConnection = createAsyncThunk(
  'connection/saveConnection',
  async (connection: RedisConnection) => {
    const success = await serverConnectionClient.saveConnection(connection);
    if (!success) {
      throw new Error('Failed to save connection');
    }
    return connection;
  }
);

export const updateConnectionOnServer = createAsyncThunk(
  'connection/updateConnection',
  async (connection: RedisConnection) => {
    const success = await serverConnectionClient.updateConnection(connection);
    if (!success) {
      throw new Error('Failed to update connection');
    }
    return connection;
  }
);

export const removeConnectionFromServer = createAsyncThunk(
  'connection/removeConnection',
  async (connectionId: string) => {
    const success = await serverConnectionClient.removeConnection(connectionId);
    if (!success) {
      throw new Error('Failed to remove connection');
    }
    return connectionId;
  }
);

export const connectToRedis = createAsyncThunk(
  'connection/connect',
  async (connection: RedisConnection, { getState, dispatch }) => {
    const state = getState() as { connection: ConnectionState };
    
    // Disconnect from previous connection if exists
    if (state.connection.activeConnection) {
      await redisClientService.disconnect();
    }
    
    // Conectar usando o novo endpoint de sessão com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

    try {
      const response = await fetch('/api/redis/connect-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection),
        credentials: 'include', // Importante para enviar cookies
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Connection timeout after 10 seconds. Please check if Redis server is accessible.');
      }
      throw err;
    }

    // Também conectar no redisClientService (para keys browser e terminal)
    const success = await redisClientService.connect(connection);
    if (!success) {
      throw new Error(`Não foi possível conectar ao Redis em ${connection.host}:${connection.port}. Verifique se o servidor está rodando e as credenciais estão corretas.`);
    }
    
    // Clear keys state when connecting to a new Redis instance
    dispatch({ type: 'keys/clearKeys' });
    
    return { ...connection, connected: true };
  }
);

export const disconnectFromRedis = createAsyncThunk(
  'connection/disconnect',
  async (connectionId: string, { dispatch }) => {
    await redisClientService.disconnect();
    
    // Clear keys state when disconnecting
    dispatch({ type: 'keys/clearKeys' });
    
    return connectionId;
  }
);

export const testConnection = createAsyncThunk(
  'connection/test',
  async (connection: RedisConnection) => {
    const success = await redisClientService.connect(connection);
    return success;
  }
);

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    addConnection: (state, action: PayloadAction<RedisConnection>) => {
      state.connections.push(action.payload);
    },
    removeConnection: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(
        (conn) => conn.id !== action.payload
      );
      if (state.activeConnection?.id === action.payload) {
        state.activeConnection = null;
      }
    },
    updateConnection: (state, action: PayloadAction<RedisConnection>) => {
      const index = state.connections.findIndex(
        (conn) => conn.id === action.payload.id
      );
      if (index !== -1) {
        state.connections[index] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setConnections: (state, action: PayloadAction<RedisConnection[]>) => {
      state.connections = action.payload;
    },
    clearActiveConnection: (state) => {
      state.activeConnection = null;
      state.connections.forEach(conn => {
        conn.connected = false;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectToRedis.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectToRedis.fulfilled, (state, action) => {
        state.isConnecting = false;
        
        // Mark all connections as disconnected first
        state.connections.forEach(conn => {
          conn.connected = false;
        });
        
        // Mark the connected one as connected
        const index = state.connections.findIndex(
          (conn) => conn.id === action.payload.id
        );
        if (index !== -1) {
          state.connections[index] = { ...action.payload, connected: true };
        }
        
        state.activeConnection = { ...action.payload, connected: true };
        // Persist to localStorage
        saveActiveConnectionToStorage(state.activeConnection);
      })
      .addCase(connectToRedis.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.error.message || 'Connection failed';
      })
      .addCase(disconnectFromRedis.fulfilled, (state, action) => {
        if (state.activeConnection?.id === action.payload) {
          state.activeConnection = null;
          // Remove from localStorage
          saveActiveConnectionToStorage(null);
        }
        const index = state.connections.findIndex(
          (conn) => conn.id === action.payload
        );
        if (index !== -1) {
          state.connections[index].connected = false;
        }
      })
      .addCase(loadConnections.fulfilled, (state, action) => {
        console.log('Redux: loadConnections fulfilled with:', action.payload);
        state.connections = action.payload;
      })
      .addCase(loadConnections.rejected, (state, action) => {
        console.error('Redux: loadConnections rejected:', action.error);
        state.error = action.error.message || 'Failed to load connections';
      })
      .addCase(saveConnection.fulfilled, (state, action) => {
        const existingIndex = state.connections.findIndex(conn => conn.id === action.payload.id);
        if (existingIndex !== -1) {
          state.connections[existingIndex] = action.payload;
        } else {
          state.connections.push(action.payload);
        }
      })
      .addCase(updateConnectionOnServer.fulfilled, (state, action) => {
        const index = state.connections.findIndex(conn => conn.id === action.payload.id);
        if (index !== -1) {
          state.connections[index] = action.payload;
        }
      })
      .addCase(removeConnectionFromServer.fulfilled, (state, action) => {
        state.connections = state.connections.filter(conn => conn.id !== action.payload);
        if (state.activeConnection?.id === action.payload) {
          state.activeConnection = null;
          // Remove from localStorage
          saveActiveConnectionToStorage(null);
        }
      });
  },
});

export const { 
  addConnection, 
  removeConnection, 
  updateConnection, 
  clearError,
  setConnections,
  clearActiveConnection
} = connectionSlice.actions;

export default connectionSlice.reducer;
