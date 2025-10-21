import { configureStore } from '@reduxjs/toolkit';
import connectionSlice from './slices/connectionSlice';
import keysSlice from './slices/keysSlice';
import statsSlice from './slices/statsSlice';

export const store = configureStore({
  reducer: {
    connection: connectionSlice,
    keys: keysSlice,
    stats: statsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
