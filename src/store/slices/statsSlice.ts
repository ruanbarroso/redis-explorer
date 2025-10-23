import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RedisStats, RedisInfo, SlowLogEntry } from '@/types/redis';
import { redisClientService } from '@/services/redis-client';

interface StatsState {
  stats: RedisStats | null;
  info: RedisInfo | null;
  slowLog: SlowLogEntry[];
  isLoading: boolean;
  error: string | null;
  derivedCpuPercent: number | null;
  lastUpdated: string | null;
  clientRttP50: number | null;
  clientRttP95: number | null;
  evictionsPerSec: number | null;
  expiredPerSec: number | null;
  rejectedConnPerSec: number | null;
}

const initialState: StatsState = {
  stats: null,
  info: null,
  slowLog: [],
  isLoading: false,
  error: null,
  derivedCpuPercent: null,
  lastUpdated: null,
  clientRttP50: null,
  clientRttP95: null,
  evictionsPerSec: null,
  expiredPerSec: null,
  rejectedConnPerSec: null,
};

export const fetchStats = createAsyncThunk(
  'stats/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await redisClientService.getStats();
      return stats;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch stats';
      if (errorMsg.includes('NO_REDIS_CONNECTION') || errorMsg.includes('NETWORK_ERROR') || errorMsg.includes('BACKEND_HTTP_502') || errorMsg.includes('BACKEND_HTTP_503')) {
        return rejectWithValue('REDIRECT_TO_CONNECTIONS');
      }
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchInfo = createAsyncThunk(
  'stats/fetchInfo',
  async () => {
    return await redisClientService.getInfo();
  }
);

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
        
        // Calcular métricas derivadas
        if (action.payload) {
          const cpu = action.payload.instantaneousCpuPercent;
          state.derivedCpuPercent = Number.isFinite(cpu as number) ? (cpu as number) : null;
          state.lastUpdated = new Date().toLocaleTimeString();
          const p50 = action.payload.clientRttP50 as number | undefined;
          const p95 = action.payload.clientRttP95 as number | undefined;
          state.clientRttP50 = Number.isFinite(p50 as number) ? (p50 as number) : null;
          state.clientRttP95 = Number.isFinite(p95 as number) ? (p95 as number) : null;
          
          // Calcular rates por segundo (assumindo refresh de 5s)
          const refreshInterval = 5;
          const ev = action.payload.evictedKeys as number | undefined;
          const ex = action.payload.expiredKeys as number | undefined;
          const rj = action.payload.rejectedConnections as number | undefined;
          state.evictionsPerSec = Number.isFinite(ev as number) ? (ev as number) / refreshInterval : null;
          state.expiredPerSec = Number.isFinite(ex as number) ? (ex as number) / refreshInterval : null;
          state.rejectedConnPerSec = Number.isFinite(rj as number) ? (rj as number) / refreshInterval : null;
        }
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      .addCase(fetchInfo.fulfilled, (state, action) => {
        state.info = action.payload;
        // Fallback para CPU: calcula média desde o início quando não houver instantâneo
        if (!Number.isFinite(state.derivedCpuPercent as number)) {
          const usedSys = parseFloat(action.payload?.cpu?.used_cpu_sys || '0');
          const uptime = parseInt(action.payload?.server?.uptime_in_seconds || '0');
          if (uptime > 0) {
            const avg = Math.min((usedSys / uptime) * 100, 100);
            state.derivedCpuPercent = Number.isFinite(avg) ? avg : state.derivedCpuPercent;
          }
        }
      })
      .addCase(fetchSlowLog.fulfilled, (state, action) => {
        state.slowLog = action.payload;
        // Fallback para latência: usa os durations do slowlog (us) para estimar p50/p95
        const durationsUs = (action.payload || [])
          .map((e) => (typeof e.duration === 'number' ? e.duration : (e as any).duration))
          .filter((v) => Number.isFinite(v));
        if (durationsUs.length > 0) {
          const sorted = [...durationsUs].sort((a, b) => a - b);
          const p = (q: number) => {
            const idx = Math.floor((q / 100) * (sorted.length - 1));
            return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
          };
          const p50ms = p(50) / 1000; // us -> ms
          const p95ms = p(95) / 1000;
          if (!Number.isFinite(state.clientRttP50 as number)) state.clientRttP50 = p50ms;
          if (!Number.isFinite(state.clientRttP95 as number)) state.clientRttP95 = p95ms;
        }
      });
  },
});

export const { clearStats, clearError } = statsSlice.actions;

export default statsSlice.reducer;
