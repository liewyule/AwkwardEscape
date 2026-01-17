import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const HOLD_DURATION_MS = 2000;

const MODE_LABELS: Record<CallMode, string> = {
  silent_message: 'Silent message',
  instant_call: 'Instant call',
  voice_guard: 'Voice guard',
};

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

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const setStatus = (message: string | null, durationMs = 2200) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatusNote(message);
    if (message && durationMs > 0) {
      statusTimerRef.current = setTimeout(() => setStatusNote(null), durationMs);
    }
  };

  const resetProgress = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const triggerEscape = async () => {
    if (!selectedPersona) {
      setStatus('Add a persona to continue.');
      resetProgress();
      return;
    }

    setIsProcessing(true);

    if (selectedMode === 'silent_message') {
      const message = await generateMessageText(selectedPersona);
      await scheduleFakeMessage(selectedPersona.displayName, message);
      setStatus('Silent message scheduled.');
      setIsProcessing(false);
      resetProgress();
      return;
    }

    if (selectedMode === 'instant_call') {
      await startRinging(selectedPersona);
      setIsProcessing(false);
      resetProgress();
      router.push('/incoming-call');
      return;
    }

    setStatus('Listening for voice for 7 seconds...', 0);
    const result = await detectVoiceActivity({
      timeoutMs: 7000,
      thresholdDb: -40,
      framesRequired: 4,
    });

    if (!result.permissionGranted) {
      setStatus('Mic permission is required for voice detection.');
      setIsProcessing(false);
      resetProgress();
      return;
    }

    if (result.voiceDetected) {
      setStatus('Voice detected. Call not started.');
      setIsProcessing(false);
      resetProgress();
      return;
    }

    setStatus('No voice detected. Starting call...');
    await startRinging(selectedPersona);
    setIsProcessing(false);
    resetProgress();
    router.push('/incoming-call');
  };

  const beginHold = () => {
    if (isProcessing) {
      return;
    }
    if (isHolding) {
      return;
    }
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
  };

  const cancelHold = () => {
    if (holdCompletedRef.current) {
      return;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    resetProgress();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.container}>
      <View style={styles.background} pointerEvents="none">
        <LinearGradient
          colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.topBlob} />
        <View style={styles.bottomBlob} />
        <View style={styles.sideGlow} />
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Awkward Escape</Text>
          <Text style={styles.subtitle}>Social Emergency Exit</Text>
        </View>
        <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
        </Pressable>
      </View>

      <View style={styles.centerContent}>
        <Pressable
          onPressIn={beginHold}
          onPressOut={cancelHold}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.panicButton,
            pressed && !isProcessing && { transform: [{ scale: 0.98 }] },
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
          <Text style={styles.panicText}>Hold to Escape</Text>
          <Text style={styles.panicHint}>
            {isHolding ? 'Keep holding...' : 'Hold for 2 seconds'}
          </Text>
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
                router.push('/persona');
              }}>
              <Text style={styles.menuText}>Personas</Text>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/mode');
              }}>
              <Text style={styles.menuText}>Modes</Text>
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
  },
  topBlob: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: 'rgba(125, 211, 252, 0.35)',
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 140,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  sideGlow: {
    position: 'absolute',
    top: 120,
    left: -80,
    width: 160,
    height: 380,
    borderRadius: 120,
    backgroundColor: 'rgba(186, 230, 253, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: '#0F172A',
    fontSize: 30,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 0.4,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  panicFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(125, 211, 252, 0.35)',
  },
  panicText: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  panicHint: {
    marginTop: 8,
    color: '#475569',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  progressTrack: {
    width: 200,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
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
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
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
