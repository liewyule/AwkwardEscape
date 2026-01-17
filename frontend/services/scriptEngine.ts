import 'groq-sdk/shims/web';
import Groq from 'groq-sdk';

import type { PersonaProfile, RelationshipType } from '@/constants/personas';
import type { CallMode, ScriptSpeaker, ScriptTurn } from '@/types/call';

const MODEL = 'llama-3.1-8b-instant';

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const groqClient = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

type TemplateTurn = { speaker: ScriptSpeaker; text: string };

const ROLE_LABELS: Record<RelationshipType, string> = {
  boss: 'your boss',
  parent: 'your parent',
  sibling: 'your sibling',
  friend: 'your friend',
  landlord: 'the landlord',
  partner: 'your partner',
  other: 'someone close',
};

const CALL_TEMPLATES: TemplateTurn[][] = [
  [
    { speaker: 'Caller', text: "Hey, it's {name} ({role}). I need you on {theme} right now." },
    { speaker: 'You', text: 'I can step out for a moment.' },
    { speaker: 'Caller', text: 'Please call me back immediately.' },
    { speaker: 'You', text: 'Understood. I am stepping out.' },
  ],
  [
    { speaker: 'Caller', text: '{name} here. Quick update needed on {theme}. Can you take this now?' },
    { speaker: 'You', text: 'I have to step away for a call.' },
    { speaker: 'Caller', text: 'It is urgent. Please do not delay.' },
    { speaker: 'You', text: 'I will handle it right away.' },
  ],
  [
    { speaker: 'Caller', text: 'Hi, {name} here. There is an issue about {theme}.' },
    { speaker: 'You', text: 'I can step out and take this.' },
    { speaker: 'Caller', text: 'Thank you, it is time sensitive.' },
    { speaker: 'You', text: 'I will call you now.' },
  ],
  [
    { speaker: 'Caller', text: '{name} calling. I need your input on {theme} right now.' },
    { speaker: 'You', text: 'I will step outside to talk.' },
    { speaker: 'Caller', text: 'Please make it quick.' },
    { speaker: 'You', text: 'On my way.' },
  ],
  [
    { speaker: 'Caller', text: '{name} here. We have a situation with {theme}.' },
    { speaker: 'You', text: 'I can step away and take the call.' },
    { speaker: 'Caller', text: 'Thanks. Call me as soon as possible.' },
    { speaker: 'You', text: 'I am stepping out now.' },
  ],
];

const MESSAGE_TEMPLATES: string[] = [
  'Hey, it is {name}. Need you for {theme} right now. Please step out and call me.',
  'Urgent: {name} here. Can you call me about {theme}? It cannot wait.',
  'Please step out and call me. This is {name} about {theme}.',
  'Hey, quick check-in on {theme}. It is {name} - I need you now.',
  'It is urgent about {theme}. Please call me right away. - {name}',
];

const normalizeTurns = (turns: ScriptTurn[]): ScriptTurn[] =>
  turns
    .filter((turn) => turn.text && turn.text.trim().length > 0)
    .map((turn) => ({
      speaker: turn.speaker === 'Caller' ? 'Caller' : 'You',
      text: turn.text.trim(),
      pauseMs: turn.pauseMs,
    }));

const buildSeedNumber = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
};

const pickIndex = (seed: string, length: number, offset = 0) =>
  (buildSeedNumber(seed) + offset) % length;

const applyTemplate = (text: string, persona: PersonaProfile) => {
  const theme = persona.defaultTheme?.trim() || 'something urgent';
  return text
    .replace('{role}', ROLE_LABELS[persona.relationshipType])
    .replace('{theme}', theme)
    .replace('{name}', persona.displayName);
};

const offlineCallScript = (persona: PersonaProfile, seed: string): ScriptTurn[] => {
  const template = CALL_TEMPLATES[pickIndex(seed, CALL_TEMPLATES.length)];
  return template.map((turn) => ({
    ...turn,
    text: applyTemplate(turn.text, persona),
  }));
};

const offlineMessage = (persona: PersonaProfile, seed: string) =>
  applyTemplate(MESSAGE_TEMPLATES[pickIndex(seed, MESSAGE_TEMPLATES.length)], persona);

export const buildTeleprompterText = (turns: ScriptTurn[]): string =>
  turns
    .map((turn) => `${turn.speaker}: ${turn.text}`)
    .join('\n\n');

export async function generateCallScript(
  persona: PersonaProfile,
  mode: CallMode,
  seed: string
): Promise<ScriptTurn[]> {
  if (!groqClient) {
    return offlineCallScript(persona, seed);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You generate short, believable phone call dialog for an urgent excuse. Output JSON only.',
        },
        {
          role: 'user',
          content: [
            `Persona: ${persona.displayName} (${persona.relationshipType})`,
            `Theme: ${persona.defaultTheme ?? 'something urgent'}`,
            `Mode: ${mode}`,
            `Seed: ${seed} (use it to vary wording)`,
            'Return JSON: {"turns":[{"speaker":"Caller|You","text":"...","pauseMs":300}]}.',
            '3-5 turns, each line under 140 characters, urgent but believable.',
          ].join('\n'),
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const cleaned = content.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned) as { turns?: ScriptTurn[] };

    if (!parsed.turns || !Array.isArray(parsed.turns)) {
      return offlineCallScript(persona, seed);
    }

    const normalized = normalizeTurns(parsed.turns);
    return normalized.length >= 2 ? normalized : offlineCallScript(persona, seed);
  } catch {
    return offlineCallScript(persona, seed);
  }
}

export async function generateMessageText(
  persona: PersonaProfile,
  seed: string
): Promise<string> {
  if (!groqClient) {
    return offlineMessage(persona, seed);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You generate a single urgent text message to excuse someone from a situation.',
        },
        {
          role: 'user',
          content: [
            `Persona: ${persona.displayName} (${persona.relationshipType})`,
            `Theme: ${persona.defaultTheme ?? 'something urgent'}`,
            `Seed: ${seed} (use it to vary wording)`,
            'Return a single sentence under 180 characters.',
          ].join('\n'),
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const cleaned = content.replace(/```|\"/g, '').trim();
    return cleaned.length > 0 ? cleaned : offlineMessage(persona, seed);
  } catch {
    return offlineMessage(persona, seed);
  }
}
