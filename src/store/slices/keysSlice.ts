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
  error: string | null;
}

const initialState: KeysState = {
  keys: [],
  selectedKey: null,
  selectedValue: null,
  searchPattern: '*',
  isLoading: false,
  isLoadingValue: false,
  error: null,
};

export const fetchKeys = createAsyncThunk(
  'keys/fetchKeys',
  async ({ pattern, count }: { pattern?: string; count?: number }) => {
    return await redisClientService.getKeys(pattern, count);
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
      });
  },
});

export const { setSearchPattern, setSelectedKey, clearKeys, clearError } =
  keysSlice.actions;

export default keysSlice.reducer;
