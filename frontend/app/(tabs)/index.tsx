import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { CallMode } from '@/types/call';
import { useCallStore } from '@/features/callLogic';
import { scheduleFakeMessage } from '@/services/notificationEngine';
import { detectVoiceActivity } from '@/services/micMetering';
import { generateMessageText } from '@/services/scriptEngine';
import { useSettingsStore } from '@/store/settingsStore';
import { useSilenceTrigger } from '@/components/useSilenceTrigger';

const HOLD_DURATION_MS = 2000;

const MODE_LABELS: Record<CallMode, string> = {
  silent_message: 'Silent message',
  instant_call: 'Instant call',
  voice_guard: 'Voice guard',
};

function SilenceTriggerListener({ onSilence }: { onSilence: () => void }) {
  const { meterDb, silenceElapsedMs, silenceMs, silenceDbThreshold } = useSilenceTrigger({
    onSilence,
    silenceMs: 5000,
  });

  const elapsedSeconds = (silenceElapsedMs / 1000).toFixed(1);
  const targetSeconds = (silenceMs / 1000).toFixed(1);
  const meterLabel = meterDb === null ? '—' : `${meterDb.toFixed(0)} dB`;

  return (
    <View style={styles.silenceStatus}>
      <Text style={styles.silenceText}>
        Silence: {elapsedSeconds}s / {targetSeconds}s
      </Text>
      <Text style={styles.silenceText}>
        Level: {meterLabel} (trigger below {silenceDbThreshold} dB)
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const { startRinging } = useCallStore();
  const { personas, selectedPersonaId, selectedMode } = useSettingsStore();

  const [menuVisible, setMenuVisible] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const [isHolding, setIsHolding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCompletedRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0],
    [personas, selectedPersonaId]
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

  const handleSilenceTrigger = useCallback(() => {
    if (!selectedPersona) return;

    // Start the call flow when silence triggers.
    // NOTE: If your startRinging expects a persona object instead of an id,
    // change to: startRinging(selectedPersona)
    startRinging(selectedPersona.id).then(() => {
      router.push('/call/incoming');
    });
  }, [router, selectedPersona, startRinging]);

  const triggerEscape = useCallback(async () => {
    if (!selectedPersona) {
      setStatus('Add a persona to continue.');
      resetProgress();
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedMode === 'silent_message') {
        const message = await generateMessageText(selectedPersona);
        await scheduleFakeMessage(selectedPersona.displayName, message);
        setStatus('Silent message scheduled.');
        return;
      }

      if (selectedMode === 'instant_call') {
        // NOTE: If your startRinging expects a persona object instead of an id,
        // change to: await startRinging(selectedPersona)
        await startRinging(selectedPersona.id);
        router.push('/call/incoming');
        return;
      }

      // voice_guard
      setStatus('Listening for voice for 7 seconds...', 0);
      const result = await detectVoiceActivity({
        timeoutMs: 7000,
        thresholdDb: -40,
        framesRequired: 4,
      });

      if (!result.permissionGranted) {
        setStatus('Mic permission is required for voice detection.');
        return;
      }

      if (result.voiceDetected) {
        setStatus('Voice detected. Call not started.');
        return;
      }

      setStatus('No voice detected. Starting call...');
      await startRinging(selectedPersona.id);
      router.push('/call/incoming');
    } finally {
      setIsProcessing(false);
      resetProgress();
    }
  }, [resetProgress, router, selectedMode, selectedPersona, setStatus, startRinging]);

  const beginHold = useCallback(() => {
    if (isProcessing || isHolding) return;

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
      void triggerEscape();
    }, HOLD_DURATION_MS);
  }, [isHolding, isProcessing, progress, triggerEscape]);

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
    outputRange: [0, 200],
  });

  return (
    <View style={styles.container}>
      {/* Dark “main” UI background */}
      <LinearGradient
        colors={['#0B0F1A', '#111927', '#1B2735']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glow} pointerEvents="none" />

      {/* Header (dark UI) + MH menu button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AwkwardEscape</Text>
          <Text style={styles.subtitle}>Social Emergency Exit</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(tabs)/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={22} color="#E2E8F0" />
          </Pressable>

          <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#E2E8F0" />
          </Pressable>
        </View>
      </View>

      {/* Optional: show silence trigger debug/status while keeping MH logic */}
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Silence Trigger</Text>
        <Text style={styles.panelHint}>
          If enabled in your settings, the app will auto-trigger when quiet.
        </Text>

        {/* This listener is purely UI + hook wiring; your actual enable/disable can live in settingsStore */}
        <SilenceTriggerListener onSilence={handleSilenceTrigger} />
      </View>

      {/* Center: MH hold-to-escape logic with upgraded dark UI styling */}
      <View style={styles.centerContent}>
        <Pressable
          onPressIn={beginHold}
          onPressOut={cancelHold}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.panicButton,
            pressed && !isProcessing && { transform: [{ scale: 0.98 }] },
            isProcessing && { opacity: 0.8 },
          ]}
        >
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
          <Text style={styles.panicText}>{isProcessing ? 'Processing…' : 'Hold to Escape'}</Text>
          <Text style={styles.panicHint}>{isHolding ? 'Keep holding…' : 'Hold for 2 seconds'}</Text>
        </Pressable>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {selectedPersona && (
          <Text style={styles.activeMeta}>
            Active: {selectedPersona.displayName} • {MODE_LABELS[selectedMode]}
          </Text>
        )}

        {statusNote && <Text style={styles.statusNote}>{statusNote}</Text>}
      </View>

      {/* MH menu modal, kept */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuSheet} onPress={() => {}}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/persona');
              }}
            >
              <Text style={styles.menuText}>Personas</Text>
              <Ionicons name="chevron-forward" size={18} color="#E2E8F0" />
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/mode');
              }}
            >
              <Text style={styles.menuText}>Modes</Text>
              <Ionicons name="chevron-forward" size={18} color="#E2E8F0" />
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
  },

  glow: {
    position: 'absolute',
    top: 90,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 180,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    transform: [{ rotate: '12deg' }],
  },

  header: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  title: {
    color: '#E2E8F0',
    fontSize: 30,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 0.4,
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },

  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },

  panel: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  panelLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  panelHint: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 8,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  panicButton: {
    width: 220,
    height: 220,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  panicFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(249, 115, 22, 0.22)',
  },
  panicText: {
    color: '#E2E8F0',
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  panicHint: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },

  progressTrack: {
    width: 200,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(249, 115, 22, 0.85)',
  },

  activeMeta: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  statusNote: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    justifyContent: 'flex-start',
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  menuSheet: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  silenceStatus: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.18)',
  },
  silenceText: {
    color: '#CBD5F5',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
