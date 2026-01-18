# AwkwardEscape (Expo + Expo Router)

AwkwardEscape is a "Social Emergency Exit" app that simulates incoming calls and texts with believable scripts. It helps you step away from a situation with a realistic incoming call flow, an active call screen, and a teleprompter.

## App details

- Hold-to-escape home flow with a 2-second press-and-hold
- Persona manager (add/select/delete) with per-persona voice selection
- Voice guard session that listens for silence and triggers a call
- Incoming call UI with answer/decline flow
- Active call UI with teleprompter and per-line progress
- Optional Groq (LLM) scripts and Google TTS caller audio

## Requirements

- Node.js 18+ (recommended)
- npm (or yarn/pnpm)
- Expo CLI (runs via `npx expo`)
- iOS Simulator / Android Emulator or Expo Go

## Setup

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Create a `.env` file at `mobile/.env` and add the environment variables you need:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_GCP_TTS_API_KEY=your_google_cloud_tts_key
```

3. Start the app:

```bash
npx expo start
```

Open with:

- iOS simulator
- Android emulator
- Expo Go (note: mic/notification permissions can be limited)

## How to use

1. Home screen shows the Instant Call button (hold 2 seconds).
2. Tap the top-right menu for Settings.
3. Create personas with a relationship, theme, and voice.
4. Start a session to listen for silence, or hold to trigger an instant call.
5. Answer the incoming call to see the active call UI and teleprompter.

## Permissions

- Microphone permission is required for the silence-session mode.

## Project structure (key files)

- `app/(tabs)/index.tsx` Home screen and session controls
- `app/settings.tsx` Settings (personas, session, silence tuning)
- `app/incoming-call.tsx` Incoming call UI
- `app/active-call.tsx` Active call UI + teleprompter
- `components/call/Teleprompter.tsx` Teleprompter with per-line progress
- `features/callLogic.ts` Call state, ringtone, mic handling
- `services/scriptEngine.ts` Script generation + offline templates
- `services/ttsEngine.ts` Google TTS playback
- `store/settingsStore.ts` Persisted settings and personas

## Notes

- Scripts fall back to offline templates if Groq is not configured.
- Google TTS requires `EXPO_PUBLIC_GCP_TTS_API_KEY`. Without it, caller audio will be silent.
- Settings persist locally via AsyncStorage.
