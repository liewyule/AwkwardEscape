import * as Speech from 'expo-speech';

import type { ScriptTurn } from '@/types/call';

let isCancelled = false;

const estimateDurationMs = (text: string) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(800, wordCount * 350);
};

const speakLine = (text: string) =>
  new Promise<void>((resolve) => {
    Speech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });

export const stopTTS = () => {
  isCancelled = true;
  Speech.stop();
};

export async function playScript(
  turns: ScriptTurn[],
  onLineChange?: (index: number) => void
) {
  isCancelled = false;

  for (let index = 0; index < turns.length; index += 1) {
    if (isCancelled) {
      break;
    }

    const turn = turns[index];
    onLineChange?.(index);

    if (turn.speaker === 'Caller') {
      await speakLine(turn.text);
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
