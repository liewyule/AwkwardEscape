import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

const recordingOptions: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.caf',
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
  isMeteringEnabled: true,
};

export async function startMicMetering(onLevel: (level: number) => void) {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(recordingOptions);
  recording.setOnRecordingStatusUpdate((status) => {
    if (status.isRecording && typeof status.metering === 'number') {
      onLevel(status.metering);
    }
  });
  recording.setProgressUpdateInterval(250);
  await recording.startAsync();
}

export async function stopMicMetering() {
  if (!recording) {
    return;
  }

  try {
    await recording.stopAndUnloadAsync();
  } catch {
    // Ignore teardown errors
  } finally {
    recording = null;
  }
}

type VoiceDetectOptions = {
  timeoutMs?: number;
  thresholdDb?: number;
  framesRequired?: number;
  sampleEveryMs?: number;
};

export async function detectVoiceActivity(options: VoiceDetectOptions = {}) {
  const {
    timeoutMs = 7000,
    thresholdDb = -40,
    framesRequired = 4,
    sampleEveryMs = 200,
  } = options;

  await stopMicMetering();

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    return { permissionGranted: false, voiceDetected: false };
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const detector = new Audio.Recording();
  let voiceDetected = false;
  let frames = 0;

  try {
    await detector.prepareToRecordAsync(recordingOptions);
    await detector.startAsync();

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs && !voiceDetected) {
      const status = await detector.getStatusAsync();
      if (status.isRecording && typeof status.metering === 'number') {
        if (status.metering > thresholdDb) {
          frames += 1;
          if (frames >= framesRequired) {
            voiceDetected = true;
            break;
          }
        } else {
          frames = 0;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, sampleEveryMs));
    }
  } catch {
    voiceDetected = false;
  } finally {
    try {
      await detector.stopAndUnloadAsync();
    } catch {
      // Ignore teardown errors
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {
      // Ignore audio mode reset errors
    }
  }

  return { permissionGranted: true, voiceDetected };
}
