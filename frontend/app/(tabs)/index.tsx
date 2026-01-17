import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useCallStore } from '@/features/callLogic';
import { scheduleFakeMessage } from '@/services/notificationEngine';
import { detectVoiceActivity } from '@/services/micMetering';
import { generateMessageText } from '@/services/scriptEngine';
import { useSettingsStore } from '@/store/settingsStore';

const HOLD_DURATION_MS = 2000;

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

  const triggerEscape = useCallback(async () => {
    if (!selectedPersona) {
      setStatus('Add a persona to continue.');
      resetProgress();
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedMode === 'silent_message') {
        const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const message = await generateMessageText(selectedPersona, seed);
        await scheduleFakeMessage(selectedPersona.displayName, message);
        setStatus('Silent message scheduled.');
        return;
      }

      if (selectedMode === 'instant_call') {
        await startRinging(selectedPersona, selectedMode);
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
        return;
      }

      if (result.voiceDetected) {
        setStatus('Voice detected. Call not started.');
        return;
      }

      setStatus('No voice detected. Starting call...');
      await startRinging(selectedPersona, selectedMode);
      router.push('/incoming-call');
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
    outputRange: [0, 220],
  });

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
        <Pressable
          onPressIn={beginHold}
          onPressOut={cancelHold}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.panicButton,
            pressed && !isProcessing && { transform: [{ scale: 0.98 }] },
            isProcessing && { opacity: 0.8 },
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
          <Text style={styles.panicText}>{isProcessing ? 'Working...' : 'Hold to Escape'}</Text>
          <Text style={styles.panicHint}>{isHolding ? 'Keep holding...' : 'Hold for 2 seconds'}</Text>
        </Pressable>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
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
