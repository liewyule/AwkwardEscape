import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useSilenceTrigger } from '@/components/useSilenceTrigger';
import { useCallStore } from '@/features/callLogic';
import { useSettingsStore } from '@/store/settingsStore';

const HOLD_DURATION_MS = 2000;
const VOICE_GUARD_SILENCE_MS = 7000;
const VOICE_GUARD_DB_THRESHOLD = -40;
const VOICE_GUARD_SAMPLE_MS = 200;
const VOICE_GUARD_TIMER_TICK_MS = 250;

const formatCountdown = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const { startRinging } = useCallStore();
  const { personas, selectedPersonaId, voiceGuardWindowMinutes } = useSettingsStore();

  const [menuVisible, setMenuVisible] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isCallProcessing, setIsCallProcessing] = useState(false);
  const [isSessionProcessing, setIsSessionProcessing] = useState(false);
  const [voiceGuardActive, setVoiceGuardActive] = useState(false);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);
  const [sessionTotalMs, setSessionTotalMs] = useState(
    () => voiceGuardWindowMinutes * 60 * 1000
  );

  const progress = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCompletedRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceGuardActiveRef = useRef(false);

  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0],
    [personas, selectedPersonaId]
  );
  const voiceGuardWindowMs = useMemo(
    () => voiceGuardWindowMinutes * 60 * 1000,
    [voiceGuardWindowMinutes]
  );

  const setStatus = useCallback((message: string | null, durationMs = 2200) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatusNote(message);
    if (message && durationMs > 0) {
      statusTimerRef.current = setTimeout(() => setStatusNote(null), durationMs);
    }
  }, []);

  const startVoiceGuardSession = useCallback(() => {
    voiceGuardActiveRef.current = true;
    setVoiceGuardActive(true);
    setSessionTotalMs(voiceGuardWindowMs);
    setSessionElapsedMs(0);
  }, [voiceGuardWindowMs]);

  const endVoiceGuardSession = useCallback(
    (options?: { message?: string | null; durationMs?: number }) => {
      voiceGuardActiveRef.current = false;
      setVoiceGuardActive(false);
      setSessionElapsedMs(0);
      if (options && Object.prototype.hasOwnProperty.call(options, 'message')) {
        setStatus(options.message ?? null, options.durationMs);
      }
    },
    [setStatus]
  );

  const handleVoiceGuardSilence = useCallback(async () => {
    if (!voiceGuardActiveRef.current) {
      return;
    }

    endVoiceGuardSession({ message: null });

    if (!selectedPersona) {
      setStatus('Add a persona to continue.');
      return;
    }

    setStatus('Silence detected. Starting call...');
    setIsCallProcessing(true);
    try {
      await startRinging(selectedPersona, 'voice_guard');
      router.push('/incoming-call');
    } finally {
      setIsCallProcessing(false);
    }
  }, [endVoiceGuardSession, router, selectedPersona, setStatus, startRinging]);

  const { meterDb, silenceElapsedMs } = useSilenceTrigger({
    enabled: voiceGuardActive,
    silenceDbThreshold: VOICE_GUARD_DB_THRESHOLD,
    silenceMs: VOICE_GUARD_SILENCE_MS,
    sampleEveryMs: VOICE_GUARD_SAMPLE_MS,
    onSilence: handleVoiceGuardSilence,
  });

  useEffect(() => {
    voiceGuardActiveRef.current = voiceGuardActive;
  }, [voiceGuardActive]);

  useEffect(() => {
    if (!voiceGuardActive) {
      setSessionTotalMs(voiceGuardWindowMs);
    }
  }, [voiceGuardActive, voiceGuardWindowMs]);

  useEffect(() => {
    if (!voiceGuardActive) {
      return;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (!voiceGuardActiveRef.current) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed >= sessionTotalMs) {
        endVoiceGuardSession({
          message: 'No silence detected. Start a new session to listen again.',
        });
        return;
      }

      setSessionElapsedMs(elapsed);
    }, VOICE_GUARD_TIMER_TICK_MS);

    return () => clearInterval(interval);
  }, [endVoiceGuardSession, sessionTotalMs, voiceGuardActive]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const resetProgress = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const triggerInstantCall = useCallback(async () => {
    if (!selectedPersona) {
      setStatus('Add a persona to continue.');
      resetProgress();
      return;
    }

    setIsCallProcessing(true);
    try {
      if (voiceGuardActiveRef.current) {
        endVoiceGuardSession({ message: null });
      }
      await startRinging(selectedPersona, 'instant_call');
      router.push('/incoming-call');
    } finally {
      setIsCallProcessing(false);
      resetProgress();
    }
  }, [endVoiceGuardSession, resetProgress, router, selectedPersona, setStatus, startRinging]);

  const handleStartSession = useCallback(async () => {
    if (voiceGuardActiveRef.current || isSessionProcessing || isCallProcessing) {
      return;
    }

    setIsSessionProcessing(true);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('Mic permission is required for voice detection.');
        return;
      }

      startVoiceGuardSession();
      setStatus(`Session started (${voiceGuardWindowMinutes} min).`, 2200);
    } finally {
      setIsSessionProcessing(false);
    }
  }, [
    isCallProcessing,
    isSessionProcessing,
    setStatus,
    startVoiceGuardSession,
    voiceGuardWindowMinutes,
  ]);

  const handleEndSession = useCallback(() => {
    if (!voiceGuardActiveRef.current) {
      return;
    }
    endVoiceGuardSession({ message: 'Session ended.' });
  }, [endVoiceGuardSession]);

  const beginHold = useCallback(() => {
    if (isCallProcessing || isHolding) return;

    holdCompletedRef.current = false;
    setIsHolding(true);

    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();

    holdTimerRef.current = setTimeout(() => {
      holdCompletedRef.current = true;
      setIsHolding(false);
      holdTimerRef.current = null;
      void triggerInstantCall();
    }, HOLD_DURATION_MS);
  }, [isCallProcessing, isHolding, progress, triggerInstantCall]);

  const cancelHold = useCallback(() => {
    if (holdCompletedRef.current) return;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setIsHolding(false);
    resetProgress();
  }, [resetProgress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });
  const silenceRemainingMs = voiceGuardActive
    ? Math.max(VOICE_GUARD_SILENCE_MS - silenceElapsedMs, 0)
    : VOICE_GUARD_SILENCE_MS;
  const sessionRemainingMs = voiceGuardActive
    ? Math.max(sessionTotalMs - sessionElapsedMs, 0)
    : voiceGuardWindowMs;
  const meterLabel =
    voiceGuardActive && meterDb !== null ? `${Math.round(meterDb)} dB` : '-- dB';
  const buttonLabel = isCallProcessing ? 'Calling...' : 'Instant Call';
  const buttonHint = isHolding ? 'Keep holding...' : 'Hold for 2 seconds';
  const startSessionLabel = isSessionProcessing
    ? 'Starting...'
    : voiceGuardActive
      ? 'Session Active'
      : 'Start Session';
  const endSessionLabel = isSessionProcessing ? 'Stopping...' : 'End Session';
  const startSessionDisabled =
    voiceGuardActive || isSessionProcessing || isCallProcessing;
  const endSessionDisabled =
    !voiceGuardActive || isSessionProcessing || isCallProcessing;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.background} />
      <LinearGradient
        colors={['rgba(125, 211, 252, 0.35)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.edgeGlow}
      />
      <View style={styles.skyBlobTop} />
      <View style={styles.skyBlobBottom} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Awkward Escape</Text>
          <Text style={styles.subtitle}>Social Emergency Exit</Text>
        </View>

        <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
        </Pressable>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.sessionControls}>
          <Pressable
            onPress={handleStartSession}
            disabled={startSessionDisabled}
            style={({ pressed }) => [
              styles.sessionButton,
              styles.sessionButtonPrimary,
              pressed && !startSessionDisabled && styles.sessionButtonPressed,
              startSessionDisabled && styles.sessionButtonDisabled,
            ]}>
            <Text style={styles.sessionButtonText}>{startSessionLabel}</Text>
          </Pressable>
          <Pressable
            onPress={handleEndSession}
            disabled={endSessionDisabled}
            style={({ pressed }) => [
              styles.sessionButton,
              styles.sessionButtonSecondary,
              pressed && !endSessionDisabled && styles.sessionButtonPressed,
              endSessionDisabled && styles.sessionButtonDisabled,
            ]}>
            <Text style={styles.sessionButtonTextSecondary}>{endSessionLabel}</Text>
          </Pressable>
        </View>

        <Pressable
          onPressIn={beginHold}
          onPressOut={cancelHold}
          disabled={isCallProcessing}
          style={({ pressed }) => [
            styles.panicButton,
            pressed && !isCallProcessing && { transform: [{ scale: 0.98 }] },
            isCallProcessing && { opacity: 0.8 },
          ]}>
          <Animated.View
            style={[
              styles.panicFill,
              {
                height: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 220],
                }),
              },
            ]}
          />
          <Text style={styles.panicText}>{buttonLabel}</Text>
          <Text style={styles.panicHint}>{buttonHint}</Text>
        </Pressable>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.voiceGuardPanel}>
          <View style={styles.voiceGuardRow}>
            <Text style={styles.voiceGuardLabel}>Silence window</Text>
            <Text style={styles.voiceGuardValue}>
              {formatCountdown(silenceRemainingMs)}
            </Text>
          </View>
          <View style={styles.voiceGuardRow}>
            <Text style={styles.voiceGuardLabel}>Session window</Text>
            <Text style={styles.voiceGuardValue}>
              {formatCountdown(sessionRemainingMs)}
            </Text>
          </View>
          <View style={styles.voiceGuardRow}>
            <Text style={styles.voiceGuardLabel}>Mic level</Text>
            <Text style={styles.voiceGuardValue}>{meterLabel}</Text>
          </View>
        </View>

        {selectedPersona && (
          <Text style={styles.activeMeta}>
            Active: {selectedPersona.displayName}
          </Text>
        )}

        {statusNote && <Text style={styles.statusNote}>{statusNote}</Text>}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuSheet} onPress={() => {}}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/settings');
              }}>
              <Text style={styles.menuText}>Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/voices');
              }}>
              <Text style={styles.menuText}>Voices</Text>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 68,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  edgeGlow: {
    position: 'absolute',
    top: -60,
    left: -40,
    right: -40,
    height: 220,
    opacity: 0.6,
  },
  skyBlobTop: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 140,
    backgroundColor: 'rgba(125, 211, 252, 0.25)',
  },
  skyBlobBottom: {
    position: 'absolute',
    bottom: -140,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: 'rgba(186, 230, 253, 0.3)',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: '#0F172A',
    fontSize: 30,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  sessionControls: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  sessionButton: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sessionButtonPrimary: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  sessionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(15, 23, 42, 0.2)',
  },
  sessionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  sessionButtonDisabled: {
    opacity: 0.5,
  },
  sessionButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  sessionButtonTextSecondary: {
    color: '#0F172A',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  panicButton: {
    width: 220,
    height: 220,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  panicFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
  },
  panicText: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  panicHint: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  progressTrack: {
    width: 220,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.8)',
  },
  voiceGuardPanel: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  voiceGuardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voiceGuardLabel: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  voiceGuardValue: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  activeMeta: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  statusNote: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    justifyContent: 'flex-start',
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  menuSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});
