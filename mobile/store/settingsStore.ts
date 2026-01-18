import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PERSONAS, type PersonaProfile } from '@/constants/personas';

type SettingsState = {
  personas: PersonaProfile[];
  selectedPersonaId: string;
  voiceId: string;
  voiceGuardWindowMinutes: number;
  voiceGuardSilenceMs: number;
  voiceGuardDbThreshold: number;
  addPersona: (persona: Omit<PersonaProfile, 'id'>) => void;
  deletePersona: (personaId: string) => void;
  selectPersona: (personaId: string) => void;
  setPersonaVoice: (personaId: string, voiceId: string) => void;
  setVoiceId: (voiceId: string) => void;
  setVoiceGuardWindowMinutes: (minutes: number) => void;
  setVoiceGuardSilenceMs: (ms: number) => void;
  setVoiceGuardDbThreshold: (db: number) => void;
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
      voiceGuardSilenceMs: 7000,
      voiceGuardDbThreshold: -40,

      addPersona: (persona) =>
        set((state) => {
          const nextPersona: PersonaProfile = {
            id: createPersonaId(),
            displayName: persona.displayName.trim(),
            relationshipType: persona.relationshipType,
            defaultTheme: persona.defaultTheme?.trim() || undefined,
            voiceId: persona.voiceId ?? state.voiceId,
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
      setPersonaVoice: (personaId, voiceId) =>
        set((state) => ({
          personas: state.personas.map((persona) =>
            persona.id === personaId ? { ...persona, voiceId } : persona
          ),
        })),
      setVoiceId: (voiceId) => set({ voiceId }),
      setVoiceGuardWindowMinutes: (minutes) => set({ voiceGuardWindowMinutes: minutes }),
      setVoiceGuardSilenceMs: (ms) => set({ voiceGuardSilenceMs: ms }),
      setVoiceGuardDbThreshold: (db) => set({ voiceGuardDbThreshold: db }),
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
        if (!state.voiceGuardSilenceMs) {
          state.voiceGuardSilenceMs = 7000;
        }
        if (state.voiceGuardDbThreshold === undefined || state.voiceGuardDbThreshold === null) {
          state.voiceGuardDbThreshold = -40;
        }
        if (!state.voiceId) {
          state.voiceId = 'en-US-Standard-B';
        }
        state.personas = state.personas.map((persona) => ({
          ...persona,
          voiceId: persona.voiceId ?? state.voiceId,
        }));
      },
    }
  )
);
