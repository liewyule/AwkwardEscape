import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

import type { ScriptTurn } from '@/types/call';
import type { VoiceOption } from '@/constants/voices';

let isCancelled = false;
let activeSound: Audio.Sound | null = null;

const googleTtsApiKey = process.env.EXPO_PUBLIC_GCP_TTS_API_KEY;

const estimateDurationMs = (text: string) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(800, wordCount * 350);
};

const stopSound = async () => {
  if (!activeSound) {
    return;
  }

  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    // Ignore teardown errors
  } finally {
    activeSound = null;
  }
};

const playAudioBase64 = async (audioContent: string) => {
  await stopSound();
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

  const { sound } = await Audio.Sound.createAsync(
    { uri: `data:audio/mp3;base64,${audioContent}` },
    { shouldPlay: true }
  );

  activeSound = sound;

  await new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        resolve();
        return;
      }

      if (status.didJustFinish || !status.isPlaying) {
        resolve();
      }
    });
  });
};

const synthesizeWithGoogle = async (text: string, voice?: VoiceOption) => {
  if (!googleTtsApiKey || !voice) {
    return null;
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: voice.ssmlGender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as { audioContent?: string };
  return json.audioContent ?? null;
};

const speakLine = async (text: string, voice?: VoiceOption) => {
  const audioContent = await synthesizeWithGoogle(text, voice);

  if (audioContent) {
    await playAudioBase64(audioContent);
    return;
  }

  await new Promise<void>((resolve) => {
    Speech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
};

export const stopTTS = () => {
  isCancelled = true;
  Speech.stop();
  stopSound();
};

export async function playScript(
  turns: ScriptTurn[],
  onLineChange?: (index: number) => void,
  voice?: VoiceOption
) {
  isCancelled = false;

  for (let index = 0; index < turns.length; index += 1) {
    if (isCancelled) {
      break;
    }

    const turn = turns[index];
    onLineChange?.(index);

    if (turn.speaker === 'Caller') {
      await speakLine(turn.text, voice);
    } else {
      await new Promise((resolve) => setTimeout(resolve, estimateDurationMs(turn.text)));
    }

    if (isCancelled) {
      break;
    }

    const pause = turn.pauseMs ?? 500;
    await new Promise((resolve) => setTimeout(resolve, pause));
  }
}
