import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'redis-explorer-browser-settings';

interface BrowserSettingsState {
  keysToScan: number;
}

const loadFromStorage = (): Partial<BrowserSettingsState> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do browser:', error);
  }
  return {};
};

const saveToStorage = (state: BrowserSettingsState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar configurações do browser:', error);
  }
};

const storedSettings = loadFromStorage();

const initialState: BrowserSettingsState = {
  keysToScan: storedSettings.keysToScan ?? 1000,
};

const browserSettingsSlice = createSlice({
  name: 'browserSettings',
  initialState,
  reducers: {
    setKeysToScan: (state, action: PayloadAction<number>) => {
      state.keysToScan = action.payload;
      saveToStorage(state);
    },
  },
});

export const { setKeysToScan } = browserSettingsSlice.actions;

export default browserSettingsSlice.reducer;
