# AwkwardEscape (Expo + Expo Router)

AwkwardEscape is a "Social Emergency Exit" app that simulates incoming calls and texts with believable live scripts. It is built with Expo SDK (managed workflow) and Expo Router.

## Features

- Hold-to-escape Home flow (2s press-and-hold with progress)
- Persona manager (add/select/delete) with local persistence
- Instant call button + silence-session mode (auto-calls after 7s of silence)
- Incoming call UI with ringing, vibration, and answer/decline flow
- Teleprompter + TTS during active calls
- Offline-friendly script generation with optional Groq/LLM support

## Run the app

```bash
npx expo start
```

Open with:

- iOS simulator
- Android emulator
- Expo Go (limited permissions for mic/notifications)

## Environment variables (optional)

Create a `.env` file at `frontend/.env` if you want LLM or Google TTS:

```bash
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_GCP_TTS_API_KEY=your_google_cloud_tts_key
```

The app works without any external keys by using offline templates + Expo Speech.

## New flow (Home -> Settings)

1. Home screen shows a single Hold-to-Escape button.
2. Tap the top-right menu to manage Settings (personas + session length).
3. Press and hold for 2 seconds to trigger the instant call.
4. Use Start Session to listen for 7 seconds of silence during the session window (End Session stops it).

## Permissions

- Microphone permission is required for the silence-session mode.

## Project structure (key files)

- `app/(tabs)/index.tsx` Home screen with Hold-to-Escape
- `app/settings.tsx` Settings (personas + session length)
- `app/incoming-call.tsx` Incoming call UI
- `app/active-call.tsx` Active call + teleprompter
- `features/callLogic.ts` Call state + ringtone + mic metering
- `services/scriptEngine.ts` Script generation + offline templates
- `store/settingsStore.ts` Persona/mode persistence

## Notes

- Each escape trigger generates a fresh script with a unique seed.
- If Groq is offline or the key is missing, fallback templates rotate to avoid repeats.
- Settings persist locally via AsyncStorage.
