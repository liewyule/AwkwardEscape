export type CallStatus = 'idle' | 'ringing' | 'answered' | 'ended';

export type CallMode = 'instant_call' | 'voice_guard';

export type ScriptSpeaker = 'Caller' | 'You';

export type ScriptTurn = {
  speaker: ScriptSpeaker;
  text: string;
  pauseMs?: number;
};
