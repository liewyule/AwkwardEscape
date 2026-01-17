import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { create } from 'zustand';

import { PERSONAS } from '@/constants/personas';
import { buildTeleprompterText, generateScript } from '@/services/scriptEngine';
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
  isMuted: boolean;
  isSpeakerOn: boolean;
  setCountdown: (value: number) => void;
  setActiveLineIndex: (index: number) => void;
  startRinging: (personaId: string) => Promise<void>;
  answerCall: (personaId: string) => Promise<void>;
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
      // Ignore ringtone teardown errors
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
      isMuted: false,
      isSpeakerOn: true,
    }),
  startRinging: async (personaId) => {
    const persona = PERSONAS.find((item) => item.id === personaId) ?? PERSONAS[0];

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
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
    });

    const scriptTurns = await generateScript(persona);
    const teleprompterText = buildTeleprompterText(scriptTurns);

    set({
      scriptTurns,
      teleprompterText,
    });
  },
  answerCall: async (personaId) => {
    await stopRingtone();

    const persona = PERSONAS.find((item) => item.id === personaId) ?? PERSONAS[0];
    let { scriptTurns, teleprompterText } = get();

    if (scriptTurns.length === 0) {
      scriptTurns = await generateScript(persona);
      teleprompterText = buildTeleprompterText(scriptTurns);
    }

    await startMicMetering((level) => get().setMicLevel(level));

    set({
      status: 'answered',
      scriptTurns,
      teleprompterText,
      callStartedAt: Date.now(),
      isMuted: false,
      isSpeakerOn: true,
    });
  },
  endCall: async () => {
    await stopRingtone();
    await stopMicMetering();

    set({
      status: 'ended',
      callStartedAt: null,
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
