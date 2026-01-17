# AwkwardEscape (Expo + Expo Router)

AwkwardEscape is a "Social Emergency Exit" app that simulates incoming calls and texts with believable live scripts. It is built with Expo SDK (managed workflow) and Expo Router.

## Features

- High-fidelity incoming call UI with ringing, vibration, and answer/decline flow
- Live Teleprompter overlay synced with the caller TTS
- Persona Engine with LLM-driven scripts + reliable fallbacks
- Fake message mode using local notifications
- Supabase-ready Auth + cloud persona storage (no complex backend)

## Install dependencies

Run these once after cloning:

```bash
npm install

# Expo native modules
npx expo install expo-av expo-speech expo-notifications expo-linear-gradient expo-font

# Fonts
npm install @expo-google-fonts/space-grotesk

# State + storage
npm install zustand @react-native-async-storage/async-storage

# LLM + backend
npm install groq-sdk @supabase/supabase-js
```

## Environment variables

Create a `.env` file at `frontend/.env`:

```bash
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Run the app

```bash
npx expo start
```

Open with:

- iOS simulator
- Android emulator
- Expo Go (limited permissions for mic/notifications)

## Supabase setup (custom personas)

1. Create a Supabase project.
2. In SQL Editor, create a `personas` table:

```sql
create table personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  summary text,
  system_prompt text not null,
  created_at timestamp with time zone default now()
);
```

3. Enable Row Level Security (RLS):

```sql
alter table personas enable row level security;
```

4. Add policies (read + write per user):

```sql
create policy "Users can read their personas"
  on personas for select
  using (auth.uid() = user_id);

create policy "Users can insert their personas"
  on personas for insert
  with check (auth.uid() = user_id);
```

5. In the app, use `services/supabaseClient.ts` for auth and querying.

## Project structure (key files)

- `app/(tabs)/index.tsx` � Home screen with Panic trigger
- `app/incoming-call.tsx` � High-fidelity incoming call UI
- `app/active-call.tsx` � Active call UI + Teleprompter
- `features/callLogic.ts` � Call state machine and audio/vibration orchestration
- `services/scriptEngine.ts` � Groq SDK generation + fallback scripts
- `constants/personas.ts` � Built-in persona profiles

## How to run successfully (full guide)

1. Install dependencies and native modules (see above).
2. Add `.env` with Groq + Supabase keys.
3. Ensure `app.json` permissions are set (microphone + notifications).
4. Start Expo: `npx expo start`.
5. Use a real device for mic metering and notifications for best results.
6. On the Home screen, hold the Panic button for 2 seconds to arm a 5-second countdown.
7. The app auto-starts ringing. Tap Accept to begin the call and Teleprompter.
8. End the call to reset the state.

## Notes

- TTS starts only after the user answers the call.
- If Groq is offline or the key is missing, the app uses built-in fallback scripts.
- Settings persist locally via AsyncStorage.
