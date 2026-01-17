import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type SilenceTriggerOptions = {
  silenceDbThreshold?: number;
  silenceMs?: number;
  sampleEveryMs?: number;
  onSilence: () => void;
};

const DEFAULT_SILENCE_DB = -20;
const DEFAULT_SILENCE_MS = 2500;
const DEFAULT_SAMPLE_MS = 200;

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

export function useSilenceTrigger(options: SilenceTriggerOptions) {
  const {
    silenceDbThreshold = DEFAULT_SILENCE_DB,
    silenceMs = DEFAULT_SILENCE_MS,
    sampleEveryMs = DEFAULT_SAMPLE_MS,
    onSilence,
  } = options;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const [meterDb, setMeterDb] = useState<number | null>(null);
  const [silenceElapsedMs, setSilenceElapsedMs] = useState(0);

  useEffect(() => {
    let isActive = true;

    const start = async () => {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted || !isActive) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      recordingRef.current = recording;
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      intervalRef.current = setInterval(async () => {
        if (!isActive || !recordingRef.current) {
          return;
        }

        const status = await recordingRef.current.getStatusAsync();
        if (!status.isRecording || typeof status.metering !== 'number') {
          return;
        }

        // Metering is negative dB; closer to 0 is louder.
        setMeterDb(status.metering);
        if (status.metering < silenceDbThreshold) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          }

          setSilenceElapsedMs(Date.now() - silenceStartRef.current);
          if (
            !triggeredRef.current &&
            Date.now() - silenceStartRef.current >= silenceMs
          ) {
            triggeredRef.current = true;
            onSilence();
          }
        } else {
          silenceStartRef.current = null;
          setSilenceElapsedMs(0);
        }
      }, sampleEveryMs);
    };

    start();

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      silenceStartRef.current = null;
      triggeredRef.current = false;
      setMeterDb(null);
      setSilenceElapsedMs(0);

      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) {
        recording
          .stopAndUnloadAsync()
          .catch(() => {
            // Ignore teardown errors.
          });
      }
    };
  }, [onSilence, sampleEveryMs, silenceDbThreshold, silenceMs]);

  return {
    meterDb,
    silenceElapsedMs,
    silenceMs,
    silenceDbThreshold,
  };
}
