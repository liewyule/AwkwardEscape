import 'groq-sdk/shims/web';
import Groq from 'groq-sdk';

import type { PersonaProfile, RelationshipType } from '@/constants/personas';
import type { ScriptTurn } from '@/types/call';

const MODEL = 'llama-3.1-8b-instant';

type ScriptMode = 'call' | 'message';

type OfflineScenario = {
  callerOpen: string;
  callerFollow: string;
  message: string;
};

const YOU_REPLY_TEMPLATES = [
  "I'm in a meeting, but I can step out and handle it.",
  "I'm tied up, but I can step out for a minute.",
  "Give me a moment, I'll step out now.",
  "I can't talk long, but I'll step out right away.",
  "I'm occupied, but I'll handle it now.",
];

const YOU_CLOSE_TEMPLATES = [
  "I'm stepping out now. I'll call you right back.",
  "Give me two minutes, I'm on my way.",
  "I'll step out and take care of it immediately.",
  "I'm heading out now, talk soon.",
  "I'll handle it and update you shortly.",
];

const OFFLINE_SCENARIOS: Record<RelationshipType, OfflineScenario[]> = {
  boss: [
    {
      callerOpen:
        "It's {{displayName}}. I need the update on {{themeTopic}} right now. Can you step out?",
      callerFollow: 'The client is waiting. Please send it in five.',
      message: "It's {{displayName}}. Need the update on {{themeTopic}} now. Can you step out?",
    },
    {
      callerOpen:
        "It's {{displayName}}. We have a call in 10 and need your input on {{themeTopic}}.",
      callerFollow: 'Please step out and join. I need you on this.',
      message: 'Call in 10. Need your input on {{themeTopic}}. Can you step out?',
    },
    {
      callerOpen:
        "It's {{displayName}}. The review on {{themeTopic}} just came back with issues.",
      callerFollow: 'I need you to address it ASAP and send me the fix.',
      message: 'Review on {{themeTopic}} has issues. I need you to step out and handle it.',
    },
    {
      callerOpen: "It's {{displayName}}. Can you approve the update for {{themeTopic}} right now?",
      callerFollow: "I'm blocked until you sign off. Please step away for a minute.",
      message: 'Need your approval on {{themeTopic}}. Please step out for a minute.',
    },
    {
      callerOpen:
        "It's {{displayName}}. I'm getting urgent questions about {{themeTopic}}.",
      callerFollow: 'Please call me back immediately. I need you on this.',
      message: 'Urgent questions on {{themeTopic}}. Call me back now.',
    },
  ],
  parent: [
    {
      callerOpen: "Hi, it's {{displayName}}. We need you right away for {{themeTopic}}.",
      callerFollow: 'Can you come now? They asked for immediate pickup.',
      message: "It's {{displayName}}. We need you right away for {{themeTopic}}. Please step out.",
    },
    {
      callerOpen: "Hi, it's {{displayName}}. The nurse called about {{themeTopic}}.",
      callerFollow: 'Please step out and call us back as soon as you can.',
      message: 'Nurse called about {{themeTopic}}. Please step out and call us.',
    },
    {
      callerOpen: "It's {{displayName}}. We need a quick signature for {{themeTopic}}.",
      callerFollow: 'Can you step away to confirm? It cannot wait.',
      message: 'Need your signature for {{themeTopic}}. Please step out.',
    },
    {
      callerOpen: "Hi, it's {{displayName}}. There is an issue with {{themeTopic}}.",
      callerFollow: 'We need you to handle it now. Please step out.',
      message: 'Issue with {{themeTopic}}. We need you to step out now.',
    },
    {
      callerOpen: "It's {{displayName}}. Pickup time moved up because of {{themeReason}}.",
      callerFollow: 'Can you head over? They are waiting.',
      message: 'Pickup moved up due to {{themeReason}}. Can you step out now?',
    },
  ],
  sibling: [
    {
      callerOpen:
        "Hey, it's {{displayName}}. My car won't start and I'm stuck with {{themeTopic}}.",
      callerFollow: 'Can you step out and call me? I need help now.',
      message: "I'm stuck and my car won't start. Can you step out and call me?",
    },
    {
      callerOpen:
        "It's {{displayName}}. I lost my keys and the {{themeNoun}} is getting worse.",
      callerFollow: 'Please step out and help me sort this.',
      message: 'Lost my keys and the {{themeNoun}} is getting worse. Please step out.',
    },
    {
      callerOpen: "Hey, it's {{displayName}}. The pet situation with {{themeTopic}} is urgent.",
      callerFollow: 'I need you to step out and help me.',
      message: 'Pet situation with {{themeTopic}} is urgent. I need help.',
    },
    {
      callerOpen: "It's {{displayName}}. I'm at the clinic for {{themeReason}}.",
      callerFollow: 'Can you step out and call me back?',
      message: "I'm at the clinic for {{themeReason}}. Please call me back.",
    },
    {
      callerOpen:
        "Hey, it's {{displayName}}. I need a quick pickup because of {{themeReason}}.",
      callerFollow: 'Please step out and call me so we can coordinate.',
      message: 'Need a quick pickup because of {{themeReason}}. Call me back.',
    },
  ],
  friend: [
    {
      callerOpen:
        "Hey, it's {{displayName}}. I'm locked out and need help with {{themeReason}}.",
      callerFollow: "Can you step out for a minute? I'm stuck outside.",
      message:
        "I'm locked out and need help with {{themeReason}}. Can you step out for a minute?",
    },
    {
      callerOpen: "It's {{displayName}}. I need a favor about {{themeTopic}} right now.",
      callerFollow: 'Can you step out and call me back?',
      message: 'Need a quick favor about {{themeTopic}}. Can you step out and call me?',
    },
    {
      callerOpen: "Hey, it's {{displayName}}. I'm in a bind because of {{themeReason}}.",
      callerFollow: 'Please step out. I need you for a minute.',
      message: "I'm in a bind because of {{themeReason}}. Please call me.",
    },
    {
      callerOpen: "It's {{displayName}}. I'm waiting outside and the {{themeNoun}} is urgent.",
      callerFollow: 'Can you step out for just a minute?',
      message: "I'm outside and the {{themeNoun}} is urgent. Can you step out?",
    },
    {
      callerOpen: "Hey, it's {{displayName}}. My delivery for {{themeTopic}} just went wrong.",
      callerFollow: 'Please step out and call me.',
      message: 'Delivery for {{themeTopic}} went wrong. Please step out and call me.',
    },
  ],
  landlord: [
    {
      callerOpen: "Hello, it's {{displayName}}. There's an issue at your place: {{themeTopic}}.",
      callerFollow: 'We need your approval right now. Please step out.',
      message: "There's an issue at your place: {{themeTopic}}. Need your approval now.",
    },
    {
      callerOpen:
        "Hi, it's {{displayName}}. The alarm was triggered because of {{themeReason}}.",
      callerFollow: 'Can you step out and confirm? I need your decision.',
      message: 'Alarm triggered due to {{themeReason}}. Can you step out and confirm?',
    },
    {
      callerOpen:
        "It's {{displayName}}. We have maintenance for {{themeTopic}} scheduled now.",
      callerFollow: 'Please step out and call me to confirm access.',
      message: 'Maintenance for {{themeTopic}} is happening now. Need confirmation.',
    },
    {
      callerOpen: "Hi, it's {{displayName}}. There's a plumbing issue tied to {{themeTopic}}.",
      callerFollow: 'We need you to approve a repair immediately.',
      message: 'Plumbing issue with {{themeTopic}}. Need repair approval now.',
    },
    {
      callerOpen: "It's {{displayName}}. Utility access is needed for {{themeTopic}}.",
      callerFollow: 'Please step out so we can proceed.',
      message: 'Utility access needed for {{themeTopic}}. Please step out.',
    },
  ],
  partner: [
    {
      callerOpen: "Hey, it's {{displayName}}. I'm stuck with {{themeReason}} and need you.",
      callerFollow: 'Can you step out and call me right away?',
      message: "I'm stuck with {{themeReason}}. Can you step out and call me?",
    },
    {
      callerOpen: "It's {{displayName}}. The car situation with {{themeTopic}} is urgent.",
      callerFollow: 'Please step out and help me figure this out.',
      message: 'Car situation with {{themeTopic}} is urgent. Please call me.',
    },
    {
      callerOpen:
        "Hey, it's {{displayName}}. I need a quick pickup because of {{themeReason}}.",
      callerFollow: 'Can you step out and call me?',
      message: 'Need a quick pickup because of {{themeReason}}. Please call me.',
    },
    {
      callerOpen: "It's {{displayName}}. There's a problem with {{themeTopic}} at home.",
      callerFollow: 'I need you to step out and help me handle it.',
      message: 'Problem with {{themeTopic}} at home. Need your help.',
    },
    {
      callerOpen:
        "Hey, it's {{displayName}}. I forgot something important about {{themeTopic}}.",
      callerFollow: 'Can you step out and call me back?',
      message: 'Forgot something important about {{themeTopic}}. Please call me back.',
    },
  ],
  other: [
    {
      callerOpen: "Hello, it's {{displayName}}. This is about {{themeTopic}} and it's urgent.",
      callerFollow: 'Can you step out and call me back?',
      message: "It's {{displayName}}. Urgent issue about {{themeTopic}}. Please step out.",
    },
    {
      callerOpen: "It's {{displayName}}. I need an immediate answer on {{themeTopic}}.",
      callerFollow: 'Please step out for a minute. I need your response.',
      message: 'Need an immediate answer on {{themeTopic}}. Please call me.',
    },
    {
      callerOpen: "Hi, it's {{displayName}}. There is an urgent matter: {{themeReason}}.",
      callerFollow: 'Please step out and call me now.',
      message: 'Urgent matter: {{themeReason}}. Please call me now.',
    },
    {
      callerOpen: "It's {{displayName}}. I'm calling about the {{themeNoun}}.",
      callerFollow: 'Can you step out and handle this?',
      message: 'Calling about the {{themeNoun}}. Please step out.',
    },
    {
      callerOpen: "Hello, it's {{displayName}}. I need your help with {{themeTopic}}.",
      callerFollow: 'Please step out and call me back.',
      message: 'Need your help with {{themeTopic}}. Please call me back.',
    },
  ],
};

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

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const hashSeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const pickIndex = (seed: string, count: number) => hashSeed(seed) % count;

const getThemeTokens = (persona: PersonaProfile) => {
  const theme = persona.defaultTheme?.trim();
  return {
    themeTopic: theme || 'this',
    themeNoun: theme || 'issue',
    themeReason: theme || 'this issue',
  };
};

const formatTemplate = (text: string, persona: PersonaProfile) => {
  const { themeTopic, themeNoun, themeReason } = getThemeTokens(persona);
  return text
    .replace(/{{displayName}}/g, persona.displayName)
    .replace(/{{themeTopic}}/g, themeTopic)
    .replace(/{{themeNoun}}/g, themeNoun)
    .replace(/{{themeReason}}/g, themeReason)
    .replace(/\s+/g, ' ')
    .trim();
};

const selectScenario = (persona: PersonaProfile, seed: string, mode: ScriptMode) => {
  const themeKey = persona.defaultTheme?.trim().toLowerCase() || 'none';
  const seedKey = `${seed}|${persona.relationshipType}|${persona.displayName}|${themeKey}|${mode}`;
  const scenarios = OFFLINE_SCENARIOS[persona.relationshipType] ?? OFFLINE_SCENARIOS.other;
  return scenarios[pickIndex(seedKey, scenarios.length)];
};

const buildOfflineCallScript = (persona: PersonaProfile, seed: string): ScriptTurn[] => {
  const scenario = selectScenario(persona, seed, 'call');
  const replyIndex = pickIndex(`${seed}|reply`, YOU_REPLY_TEMPLATES.length);
  const closeIndex = pickIndex(`${seed}|close`, YOU_CLOSE_TEMPLATES.length);

  const turns: ScriptTurn[] = [
    {
      speaker: 'Caller',
      text: formatTemplate(scenario.callerOpen, persona),
      pauseMs: 300,
    },
    {
      speaker: 'You',
      text: YOU_REPLY_TEMPLATES[replyIndex],
      pauseMs: 350,
    },
    {
      speaker: 'Caller',
      text: formatTemplate(scenario.callerFollow, persona),
      pauseMs: 300,
    },
    {
      speaker: 'You',
      text: YOU_CLOSE_TEMPLATES[closeIndex],
      pauseMs: 350,
    },
  ];

  return normalizeTurns(turns);
};

const buildOfflineMessage = (persona: PersonaProfile, seed: string) => {
  const scenario = selectScenario(persona, seed, 'message');
  return formatTemplate(scenario.message, persona);
};

const buildSystemPrompt = (persona: PersonaProfile, mode: ScriptMode, seed: string) => {
  const theme = persona.defaultTheme?.trim() || 'not specified';
  const base = [
    `Caller name: ${persona.displayName}`,
    `Relationship: ${persona.relationshipType}`,
    `Theme: ${theme}`,
    `Seed: ${seed}`,
  ].join('\n');

  if (mode === 'message') {
    return [
      'You are writing a single urgent text message for a social exit.',
      base,
      'Use the seed to vary wording and avoid repeating past phrases.',
      'Return JSON only: {"message":"..."}',
    ].join('\n');
  }

  return [
    'You are writing a short phone call script for a social exit.',
    base,
    'Use the seed to vary wording and avoid repeating past phrases.',
    'Create 3-4 short dialogue turns alternating between Caller and You.',
    'Return JSON only: {"turns":[{"speaker":"Caller|You","text":"...","pauseMs":300}]}',
  ].join('\n');
};

export const buildTeleprompterText = (turns: ScriptTurn[]): string =>
  turns.map((turn) => `${turn.speaker}: ${turn.text}`).join('\n\n');

export async function generateCallScript(
  persona: PersonaProfile,
  seed?: string
): Promise<ScriptTurn[]> {
  const seedValue = seed ?? createSeed();
  if (!groqClient) {
    return buildOfflineCallScript(persona, seedValue);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(persona, 'call', seedValue),
        },
        {
          role: 'user',
          content:
            'Make it sound believable and urgent. Keep each line under 140 characters.',
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const cleaned = content.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned) as { turns?: ScriptTurn[] };

    if (!parsed.turns || !Array.isArray(parsed.turns)) {
      return buildOfflineCallScript(persona, seedValue);
    }

    const normalized = normalizeTurns(parsed.turns);
    return normalized.length >= 2 ? normalized : buildOfflineCallScript(persona, seedValue);
  } catch {
    return buildOfflineCallScript(persona, seedValue);
  }
}

export async function generateMessageText(
  persona: PersonaProfile,
  seed?: string
): Promise<string> {
  const seedValue = seed ?? createSeed();
  if (!groqClient) {
    return buildOfflineMessage(persona, seedValue);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(persona, 'message', seedValue),
        },
        {
          role: 'user',
          content:
            'Make it concise, urgent, and realistic. Keep it under 160 characters.',
        },
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const cleaned = content.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned) as { message?: string };
    if (!parsed.message || !parsed.message.trim()) {
      return buildOfflineMessage(persona, seedValue);
    }
    return parsed.message.trim();
  } catch {
    return buildOfflineMessage(persona, seedValue);
  }
}
