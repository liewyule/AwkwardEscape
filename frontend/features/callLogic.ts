import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { create } from 'zustand';

import type { PersonaProfile } from '@/constants/personas';
import { buildTeleprompterText, generateCallScript } from '@/services/scriptEngine';
import { startMicMetering, stopMicMetering } from '@/services/micMetering';
import type { CallStatus, ScriptTurn } from '@/types/call';

const ringtoneAsset = require('@/assets/audio/ringtone.wav');

let ringtoneSound: Audio.Sound | null = null;

type CallState = {
  status: CallStatus;
  countdown: number;
  scriptTurns: ScriptTurn[];
  teleprompterText: string;
  activeLineIndex: number;
  callStartedAt: number | null;
  micLevel: number;

  activePersona: PersonaProfile | null;
  isMuted: boolean;
  isSpeakerOn: boolean;

  setCountdown: (value: number) => void;
  setActiveLineIndex: (index: number) => void;

  startRinging: (persona: PersonaProfile) => Promise<void>;
  answerCall: (persona?: PersonaProfile) => Promise<void>;
  endCall: () => Promise<void>;
  resetCall: () => void;

  setMicLevel: (level: number) => void;
  toggleMute: () => Promise<void>;
  toggleSpeaker: () => Promise<void>;
};

const stopRingtone = async () => {
  Vibration.cancel();

  if (ringtoneSound) {
    try {
      await ringtoneSound.stopAsync();
      await ringtoneSound.unloadAsync();
    } catch {
      // ignore
    } finally {
      ringtoneSound = null;
    }
  }
};

export const useCallStore = create<CallState>((set, get) => ({
  status: 'idle',
  countdown: 0,
  scriptTurns: [],
  teleprompterText: '',
  activeLineIndex: 0,
  callStartedAt: null,
  micLevel: -80,

  activePersona: null,
  isMuted: false,
  isSpeakerOn: true,

  setCountdown: (value) => set({ countdown: value }),
  setActiveLineIndex: (index) => set({ activeLineIndex: index }),
  setMicLevel: (level) => set({ micLevel: level }),

  resetCall: () =>
    set({
      status: 'idle',
      countdown: 0,
      scriptTurns: [],
      teleprompterText: '',
      activeLineIndex: 0,
      callStartedAt: null,
      micLevel: -80,
      activePersona: null,
      isMuted: false,
      isSpeakerOn: true,
    }),

  startRinging: async (persona) => {
    // ensure ringtone can play even if device is silent (iOS)
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(ringtoneAsset, {
      shouldPlay: true,
      isLooping: true,
      volume: 1.0,
    });

    ringtoneSound = sound;
    Vibration.vibrate([0, 800, 600], true);

    set({
      status: 'ringing',
      activeLineIndex: 0,
      callStartedAt: null,
      scriptTurns: [],
      teleprompterText: '',
      activePersona: persona,
      isMuted: false,
      isSpeakerOn: true,
      micLevel: -80,
    });

    // generate script asynchronously, then fill store
    const scriptTurns = await generateCallScript(persona);
    const teleprompterText = buildTeleprompterText(scriptTurns);

    set({ scriptTurns, teleprompterText });
  },

  answerCall: async (personaOverride) => {
    await stopRingtone();

    const persona = personaOverride ?? get().activePersona;

    if (!persona) {
      set({
        status: 'idle',
        scriptTurns: [],
        teleprompterText: '',
        activeLineIndex: 0,
        callStartedAt: null,
        micLevel: -80,
        activePersona: null,
        isMuted: false,
        isSpeakerOn: true,
      });
      return;
    }

    let { scriptTurns, teleprompterText } = get();

    if (scriptTurns.length === 0) {
      scriptTurns = await generateCallScript(persona);
      teleprompterText = buildTeleprompterText(scriptTurns);
    }

    // entering the call: allow recording + default speaker on
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false, // speaker by default
    });

    await startMicMetering((level) => get().setMicLevel(level));

    set({
      status: 'answered',
      scriptTurns,
      teleprompterText,
      activeLineIndex: 0,
      callStartedAt: Date.now(),
      activePersona: persona,
      isMuted: false,
      isSpeakerOn: true,
    });
  },

  endCall: async () => {
    await stopRingtone();
    await stopMicMetering();

    set({
      status: 'ended',
      countdown: 0,
      scriptTurns: [],
      teleprompterText: '',
      activeLineIndex: 0,
      callStartedAt: null,
      micLevel: -80,
      activePersona: null,
      isMuted: false,
      isSpeakerOn: true,
    });
  },

  toggleMute: async () => {
    const next = !get().isMuted;

    if (next) {
      await stopMicMetering();
      set({ isMuted: true, micLevel: -80 });
      return;
    }

    await startMicMetering((level) => get().setMicLevel(level));
    set({ isMuted: false });
  },

  toggleSpeaker: async () => {
    const next = !get().isSpeakerOn;

    // speaker ON => playThroughEarpieceAndroid false
    // speaker OFF => route to earpiece on Android
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: !next,
    });

    set({ isSpeakerOn: next });
  },
}));

export const stopCallSideEffects = async () => {
  await stopRingtone();
  await stopMicMetering();
};
