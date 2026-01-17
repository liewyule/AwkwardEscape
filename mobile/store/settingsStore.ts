import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CallMode } from '@/types/call';

type SettingsState = {
  mode: CallMode;
  personaId: string;
  setMode: (mode: CallMode) => void;
  setPersonaId: (personaId: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: 'call',
      personaId: 'panicked-roommate',
      setMode: (mode) => set({ mode }),
      setPersonaId: (personaId) => set({ personaId }),
    }),
    {
      name: 'awkwardescape-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
