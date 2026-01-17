import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PERSONAS, type PersonaProfile } from '@/constants/personas';

type SettingsState = {
  personas: PersonaProfile[];
  selectedPersonaId: string;
  voiceId: string;
  voiceGuardWindowMinutes: number;
  addPersona: (persona: Omit<PersonaProfile, 'id'>) => void;
  deletePersona: (personaId: string) => void;
  selectPersona: (personaId: string) => void;
  setVoiceId: (voiceId: string) => void;
  setVoiceGuardWindowMinutes: (minutes: number) => void;
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
      voiceId: 'en-US-Standard-B',
      voiceGuardWindowMinutes: 30,

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
      setVoiceId: (voiceId) => set({ voiceId }),
      setVoiceGuardWindowMinutes: (minutes) => set({ voiceGuardWindowMinutes: minutes }),
    }),
    {
      name: 'awkwardescape-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const normalized = normalizeSelection(state.personas, state.selectedPersonaId);
        state.personas = normalized.personas;
        state.selectedPersonaId = normalized.selectedPersonaId;
        if (!state.voiceGuardWindowMinutes) {
          state.voiceGuardWindowMinutes = 30;
        }
      },
    }
  )
);
