import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PERSONAS, type PersonaProfile } from '@/constants/personas';
import type { CallMode } from '@/types/call';

type SettingsState = {
  personas: PersonaProfile[];
  selectedPersonaId: string;
  selectedMode: CallMode;
  voiceId: string;
  addPersona: (persona: Omit<PersonaProfile, 'id'>) => void;
  deletePersona: (personaId: string) => void;
  selectPersona: (personaId: string) => void;
  setMode: (mode: CallMode) => void;
  setVoiceId: (voiceId: string) => void;
};

const createPersonaId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeSelection = (personas: PersonaProfile[], selectedId?: string) => {
  if (personas.length === 0) {
    return { personas: DEFAULT_PERSONAS, selectedPersonaId: DEFAULT_PERSONAS[0].id };
  }

  if (!selectedId || !personas.some((persona) => persona.id === selectedId)) {
    return { personas, selectedPersonaId: personas[0].id };
  }

  return { personas, selectedPersonaId: selectedId };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      personas: DEFAULT_PERSONAS,
      selectedPersonaId: DEFAULT_PERSONAS[0].id,
      selectedMode: 'instant_call',
      voiceId: 'en-US-Standard-B',

      addPersona: (persona) =>
        set((state) => {
          const nextPersona: PersonaProfile = {
            id: createPersonaId(),
            displayName: persona.displayName.trim(),
            relationshipType: persona.relationshipType,
            defaultTheme: persona.defaultTheme?.trim() || undefined,
          };
          const personas = [nextPersona, ...state.personas];
          return { personas, selectedPersonaId: nextPersona.id };
        }),

      deletePersona: (personaId) =>
        set((state) => {
          if (state.personas.length <= 1) return {};

          const personas = state.personas.filter((p) => p.id !== personaId);
          const selectedPersonaId =
            state.selectedPersonaId === personaId
              ? personas[0]?.id ?? state.selectedPersonaId
              : state.selectedPersonaId;

          return { personas, selectedPersonaId };
        }),

      selectPersona: (personaId) => set({ selectedPersonaId: personaId }),
      setMode: (mode) => set({ selectedMode: mode }),
      setVoiceId: (voiceId) => set({ voiceId }),
    }),
    {
      name: 'awkwardescape-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const normalized = normalizeSelection(state.personas, state.selectedPersonaId);
        state.personas = normalized.personas;
        state.selectedPersonaId = normalized.selectedPersonaId;
        if (!state.selectedMode) {
          state.selectedMode = 'instant_call';
        }
      },
    }
  )
);
