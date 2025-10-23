import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RedisKey, RedisValue } from '@/types/redis';
import { redisClientService } from '@/services/redis-client';

interface KeysState {
  keys: RedisKey[];
  selectedKey: string | null;
  selectedValue: RedisValue | null;
  searchPattern: string;
  isLoading: boolean;
  isLoadingValue: boolean;
  isLoadingAllKeys: boolean;
  totalKeys: number | null;
  error: string | null;
  // Progress state
  loadingProgress: {
    isActive: boolean;
    phase: 'starting' | 'scanning' | 'processing' | 'completing' | 'complete';
    message: string;
    progress: number;
    total: number;
    current: number;
    startTime?: number;
  };
}

const initialState: KeysState = {
  keys: [],
  selectedKey: null,
  selectedValue: null,
  searchPattern: '*',
  isLoading: false,
  isLoadingValue: false,
  isLoadingAllKeys: false,
  totalKeys: null,
  error: null,
  loadingProgress: {
    isActive: false,
    phase: 'starting',
    message: '',
    progress: 0,
    total: 0,
    current: 0,
    startTime: undefined,
  },
};

export const fetchKeys = createAsyncThunk(
  'keys/fetchKeys',
  async ({ pattern, count }: { pattern?: string; count?: number }) => {
    return await redisClientService.getKeys(pattern, count);
  }
);

export const fetchAllKeys = createAsyncThunk(
  'keys/fetchAllKeys',
  async ({ pattern }: { pattern?: string }) => {
    return await redisClientService.getAllKeys(pattern);
  }
);

export const fetchValue = createAsyncThunk(
  'keys/fetchValue',
  async (key: string) => {
    return await redisClientService.getValue(key);
  }
);

export const updateValue = createAsyncThunk(
  'keys/updateValue',
  async ({
    key,
    value,
    type,
    ttl,
  }: {
    key: string;
    value: any;
    type: any;
    ttl?: number;
  }) => {
    const success = await redisClientService.setValue(key, value, type, ttl);
    if (!success) {
      throw new Error('Failed to update value');
    }
    return await redisClientService.getValue(key);
  }
);

export const deleteKey = createAsyncThunk(
  'keys/deleteKey',
  async (key: string) => {
    const success = await redisClientService.deleteKey(key);
    if (!success) {
      throw new Error('Failed to delete key');
    }
    return key;
  }
);

const keysSlice = createSlice({
  name: 'keys',
  initialState,
  reducers: {
    setSearchPattern: (state, action: PayloadAction<string>) => {
      state.searchPattern = action.payload;
    },
    setSelectedKey: (state, action: PayloadAction<string | null>) => {
      state.selectedKey = action.payload;
      if (!action.payload) {
        state.selectedValue = null;
      }
    },
    clearKeys: (state) => {
      state.keys = [];
      state.selectedKey = null;
      state.selectedValue = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoadingProgress: (state, action: PayloadAction<{
      isActive: boolean;
      phase?: 'starting' | 'scanning' | 'processing' | 'completing' | 'complete';
      message?: string;
      progress?: number;
      total?: number;
      current?: number;
      startTime?: number;
    }>) => {
      state.loadingProgress = {
        ...state.loadingProgress,
        ...action.payload,
      };
      
      // Set start time when starting
      if (action.payload.phase === 'starting' && action.payload.isActive) {
        state.loadingProgress.startTime = Date.now();
      }
    },
    resetLoadingProgress: (state) => {
      state.loadingProgress = {
        isActive: false,
        phase: 'starting',
        message: '',
        progress: 0,
        total: 0,
        current: 0,
        startTime: undefined,
      };
    },
    setKeys: (state, action: PayloadAction<RedisKey[]>) => {
      state.keys = action.payload;
    },
    setTotalKeys: (state, action: PayloadAction<number>) => {
      state.totalKeys = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKeys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKeys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.keys = action.payload;
      })
      .addCase(fetchKeys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch keys';
      })
      .addCase(fetchValue.pending, (state) => {
        state.isLoadingValue = true;
        state.error = null;
      })
      .addCase(fetchValue.fulfilled, (state, action) => {
        state.isLoadingValue = false;
        state.selectedValue = action.payload;
      })
      .addCase(fetchValue.rejected, (state, action) => {
        state.isLoadingValue = false;
        state.error = action.error.message || 'Failed to fetch value';
      })
      .addCase(updateValue.fulfilled, (state, action) => {
        state.selectedValue = action.payload;
      })
      .addCase(deleteKey.fulfilled, (state, action) => {
        state.keys = state.keys.filter((key) => key.name !== action.payload);
        if (state.selectedKey === action.payload) {
          state.selectedKey = null;
          state.selectedValue = null;
        }
      })
      .addCase(fetchAllKeys.pending, (state) => {
        state.isLoadingAllKeys = true;
        state.error = null;
      })
      .addCase(fetchAllKeys.fulfilled, (state, action) => {
        state.isLoadingAllKeys = false;
        state.keys = action.payload;
        state.totalKeys = action.payload.length;
      })
      .addCase(fetchAllKeys.rejected, (state, action) => {
        state.isLoadingAllKeys = false;
        state.error = action.error.message || 'Failed to fetch all keys';
      });
  },
});

export const { setSearchPattern, setSelectedKey, clearKeys, clearError, setLoadingProgress, resetLoadingProgress, setKeys, setTotalKeys } =
  keysSlice.actions;

export default keysSlice.reducer;
