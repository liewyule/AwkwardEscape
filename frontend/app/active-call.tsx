import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useCallStore } from '@/features/callLogic';
import { playScript, stopTTS } from '@/services/ttsEngine';
import { useSettingsStore } from '@/store/settingsStore';
import { Teleprompter } from '@/components/call/Teleprompter';

const formatElapsed = (startAt: number | null) => {
  if (!startAt) return '00:00';
  const total = Math.floor((Date.now() - startAt) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function ActiveCallScreen() {
  const router = useRouter();
  const {
    status,
    scriptTurns,
    activeLineIndex,
    setActiveLineIndex,
    callStartedAt,
    endCall,
    micLevel,
    activePersona,
  } = useCallStore();
  const { personas, selectedPersonaId } = useSettingsStore();
  const [elapsed, setElapsed] = useState('00:00');

  const fallbackPersona = useMemo(
    () => personas.find((item) => item.id === selectedPersonaId) ?? personas[0],
    [personas, selectedPersonaId]
  );
  const persona = activePersona ?? fallbackPersona;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(formatElapsed(callStartedAt)), 1000);
    return () => clearInterval(timer);
  }, [callStartedAt]);

  useEffect(() => {
    if (status !== 'answered') {
      router.replace('/(tabs)');
      return;
    }

    if (scriptTurns.length === 0) {
      return;
    }

    playScript(scriptTurns, setActiveLineIndex);

    return () => {
      stopTTS();
    };
  }, [status, scriptTurns, setActiveLineIndex, router]);

  useEffect(() => {
    return () => {
      if (status === 'answered') {
        void endCall();
      }
    };
  }, [status, endCall]);

  const handleEnd = async () => {
    stopTTS();
    await endCall();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#040509', '#0B1320', '#1E293B']} style={styles.background} />

      <View style={styles.header}>
        <Text style={styles.name}>{persona.displayName}</Text>
        <Text style={styles.timer}>{elapsed}</Text>
        <View style={styles.micMeter}
          >
          <View
            style={[
              styles.micFill,
              {
                width: `${Math.min(100, Math.max(10, (micLevel + 80) * 1.2))}%`,
              },
            ]}
          />
        </View>
      </View>

      <Teleprompter turns={scriptTurns} activeIndex={activeLineIndex} />

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <View style={styles.controlButton}>
            <Ionicons name="mic-off" size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>Mute</Text>
          </View>
          <View style={styles.controlButton}>
            <Ionicons name="keypad" size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>Keypad</Text>
          </View>
          <View style={styles.controlButton}>
            <Ionicons name="volume-high" size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </View>
        </View>
        <Pressable style={styles.endButton} onPress={handleEnd}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.endLabel}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 22,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 26,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  timer: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  micMeter: {
    width: '70%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  micFill: {
    height: '100%',
    backgroundColor: '#F97316',
  },
  controls: {
    gap: 24,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    width: '30%',
  },
  controlLabel: {
    color: '#CBD5F5',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  endLabel: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
