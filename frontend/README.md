# AwkwardEscape (Expo + Expo Router)

AwkwardEscape is a "Social Emergency Exit" app that simulates incoming calls and texts with believable live scripts. It is built with Expo SDK (managed workflow) and Expo Router.

## Features

- Hold-to-escape Home flow (2s press-and-hold with progress)
- Persona manager (add/select/delete) with local persistence
- Three modes: silent message, instant call, voice-guard call
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

## New flow (Home -> Personas/Modes)

1. Home screen shows a single Hold-to-Escape button.
2. Tap the top-right menu to manage Personas or Modes.
3. Press and hold for 2 seconds to trigger the current mode:
   - Silent message: schedules a local notification.
   - Instant loud call: immediately shows the incoming call screen.
   - Voice guard: listens for 7 seconds and triggers a call only if no voice is detected.

## Permissions

- Microphone permission is required for the Voice Guard mode.
- Notification permission is required for Silent Message mode.

## Project structure (key files)

- `app/(tabs)/index.tsx` Home screen with Hold-to-Escape
- `app/persona.tsx` Personas CRUD + selection
- `app/mode.tsx` Mode selection
- `app/incoming-call.tsx` Incoming call UI
- `app/active-call.tsx` Active call + teleprompter
- `features/callLogic.ts` Call state + ringtone + mic metering
- `services/scriptEngine.ts` Script generation + offline templates
- `store/settingsStore.ts` Persona/mode persistence

## Notes

- Each escape trigger generates a fresh script with a unique seed.
- If Groq is offline or the key is missing, fallback templates rotate to avoid repeats.
- Settings persist locally via AsyncStorage.
