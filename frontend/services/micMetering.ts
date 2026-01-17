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

export async function startMicMetering(onLevel: (level: number) => void): Promise<boolean> {
  if (recording) {
    await stopMicMetering();
  }

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    return false;
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
  return true;
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

type VoiceDetectionResult = {
  voiceDetected: boolean;
  permissionGranted: boolean;
};

export async function detectVoiceActivity({
  timeoutMs = 7000,
  thresholdDb = -40,
  framesRequired = 4,
}: {
  timeoutMs?: number;
  thresholdDb?: number;
  framesRequired?: number;
}): Promise<VoiceDetectionResult> {
  let resolvePromise: (value: VoiceDetectionResult) => void = () => {};
  let resolved = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const levels: number[] = [];

  const finish = async (voiceDetected: boolean, permissionGranted: boolean) => {
    if (resolved) {
      return;
    }
    resolved = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await stopMicMetering();
    resolvePromise({ voiceDetected, permissionGranted });
  };

  const promise = new Promise<VoiceDetectionResult>((resolve) => {
    resolvePromise = resolve;
  });

  const started = await startMicMetering((level) => {
    levels.push(level);
    if (levels.length > framesRequired) {
      levels.shift();
    }
    if (levels.length === framesRequired) {
      const average = levels.reduce((sum, value) => sum + value, 0) / framesRequired;
      if (average >= thresholdDb) {
        void finish(true, true);
      }
    }
  });

  if (!started) {
    return { voiceDetected: false, permissionGranted: false };
  }

  timer = setTimeout(() => {
    void finish(false, true);
  }, timeoutMs);

  return promise;
}
