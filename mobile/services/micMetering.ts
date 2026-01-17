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
