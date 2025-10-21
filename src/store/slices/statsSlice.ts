import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RedisStats, RedisInfo, SlowLogEntry } from '@/types/redis';
import { redisClientService } from '@/services/redis-client';

interface StatsState {
  stats: RedisStats | null;
  info: RedisInfo | null;
  slowLog: SlowLogEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  stats: null,
  info: null,
  slowLog: [],
  isLoading: false,
  error: null,
};

export const fetchStats = createAsyncThunk('stats/fetchStats', async () => {
  return await redisClientService.getStats();
});

export const fetchInfo = createAsyncThunk('stats/fetchInfo', async () => {
  return await redisClientService.getInfo();
});

export const fetchSlowLog = createAsyncThunk(
  'stats/fetchSlowLog',
  async (count: number = 10) => {
    return await redisClientService.getSlowLog(count);
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearStats: (state) => {
      state.stats = null;
      state.info = null;
      state.slowLog = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      .addCase(fetchInfo.fulfilled, (state, action) => {
        state.info = action.payload;
      })
      .addCase(fetchSlowLog.fulfilled, (state, action) => {
        state.slowLog = action.payload;
      });
  },
});

export const { clearStats, clearError } = statsSlice.actions;

export default statsSlice.reducer;
