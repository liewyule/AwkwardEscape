import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PERSONAS, type PersonaProfile } from '@/constants/personas';
import type { CallMode } from '@/types/call';

type SettingsState = {
  
  personas: PersonaProfile[];
  selectedMode: CallMode;
  selectedPersonaId: string;


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

const LEGACY_PERSONA_ID_MAP: Record<string, string> = {
  'panicked-roommate':
    DEFAULT_PERSONAS.find((persona) => persona.displayName === 'Panicked Roommate')?.id ??
    DEFAULT_PERSONAS[0].id,
  'strict-boss':
    DEFAULT_PERSONAS.find((persona) => persona.displayName === 'Strict Boss')?.id ??
    DEFAULT_PERSONAS[0].id,
  landlord:
    DEFAULT_PERSONAS.find((persona) => persona.displayName === 'The Landlord')?.id ??
    DEFAULT_PERSONAS[0].id,
  childcare:
    DEFAULT_PERSONAS.find((persona) => persona.displayName === 'School Admin')?.id ??
    DEFAULT_PERSONAS[0].id,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      personas: DEFAULT_PERSONAS,
      selectedMode: 'instant_call',
      selectedPersonaId: DEFAULT_PERSONAS[0].id,

      // keep main’s voice setting
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

        // ---- Legacy migrations from the "main" branch ----
        // legacy: mode = 'message' | 'call'
        const legacyMode = (state as unknown as { mode?: string }).mode;
        if (!state.selectedMode && legacyMode) {
          state.selectedMode = legacyMode === 'message' ? 'silent_message' : 'instant_call';
        }

        // legacy: personaId (string key) -> selectedPersonaId (real uuid-like id)
        const legacyPersonaId = (state as unknown as { personaId?: string }).personaId;
        if (!state.selectedPersonaId && legacyPersonaId) {
          state.selectedPersonaId =
            LEGACY_PERSONA_ID_MAP[legacyPersonaId] ?? DEFAULT_PERSONAS[0].id;
        }

        // optional: legacy voiceId (keep if it existed)
        const legacyVoiceId = (state as unknown as { voiceId?: string }).voiceId;
        if (!state.voiceId && legacyVoiceId) {
          state.voiceId = legacyVoiceId;
        }

        // normalize personas + selection
        const personas = Array.isArray(state.personas) ? state.personas : DEFAULT_PERSONAS;
        const normalized = normalizeSelection(personas, state.selectedPersonaId);
        state.personas = normalized.personas;
        state.selectedPersonaId = normalized.selectedPersonaId;

        // (optional) cleanup: you can delete old keys from the persisted object
        // but zustand persist doesn’t guarantee mutation persists back immediately.
      },
    }
  )
);
