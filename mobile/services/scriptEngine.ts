import 'groq-sdk/shims/web';
import Groq from 'groq-sdk';

import { PERSONAS, type Persona } from '@/constants/personas';
import type { ScriptTurn } from '@/types/call';

const MODEL = 'llama-3.1-8b-instant';

export const FALLBACK_SCRIPTS: Record<string, ScriptTurn[]> = PERSONAS.reduce(
  (acc, persona) => {
    acc[persona.id] = persona.fallbackScript;
    return acc;
  },
  {} as Record<string, ScriptTurn[]>
);

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const groqClient = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

const normalizeTurns = (turns: ScriptTurn[]): ScriptTurn[] =>
  turns
    .filter((turn) => turn.text && turn.text.trim().length > 0)
    .map((turn) => ({
      speaker: turn.speaker === 'Caller' ? 'Caller' : 'You',
      text: turn.text.trim(),
      pauseMs: turn.pauseMs,
    }));

export const fallbackForPersona = (persona: Persona): ScriptTurn[] =>
  normalizeTurns(FALLBACK_SCRIPTS[persona.id] ?? persona.fallbackScript);

export const buildTeleprompterText = (turns: ScriptTurn[]): string =>
  turns
    .map((turn) => `${turn.speaker}: ${turn.text}`)
    .join('\n\n');

export async function generateScript(persona: Persona): Promise<ScriptTurn[]> {
  if (!groqClient) {
    return fallbackForPersona(persona);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: persona.systemPrompt,
        },
        {
          role: 'user',
          content:
            'Generate a believable urgent excuse dialog. Keep each line under 140 characters. Return only JSON with a turns array.',
        },
      ],
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const cleaned = content.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned) as { turns?: ScriptTurn[] };

    if (!parsed.turns || !Array.isArray(parsed.turns)) {
      return fallbackForPersona(persona);
    }

    const normalized = normalizeTurns(parsed.turns);
    return normalized.length >= 2 ? normalized : fallbackForPersona(persona);
  } catch (error) {
    return fallbackForPersona(persona);
  }
}
