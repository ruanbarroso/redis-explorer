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

const initialState: ConnectionState = {
  connections: [],
  activeConnection: null,
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
    
    const success = await redisClientService.connect(connection);
    if (!success) {
      throw new Error('Failed to connect to Redis');
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
      })
      .addCase(connectToRedis.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.error.message || 'Connection failed';
      })
      .addCase(disconnectFromRedis.fulfilled, (state, action) => {
        if (state.activeConnection?.id === action.payload) {
          state.activeConnection = null;
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
        }
      });
  },
});

export const { 
  addConnection, 
  removeConnection, 
  updateConnection, 
  clearError,
  setConnections
} = connectionSlice.actions;

export default connectionSlice.reducer;
