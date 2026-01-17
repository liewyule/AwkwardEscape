export type CallStatus = 'idle' | 'ringing' | 'answered' | 'ended';

export type CallMode = 'call' | 'message';

export type ScriptSpeaker = 'Caller' | 'You';

export type ScriptTurn = {
  speaker: ScriptSpeaker;
  text: string;
  pauseMs?: number;
};
