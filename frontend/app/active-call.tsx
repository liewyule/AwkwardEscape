import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { VOICES } from '@/constants/voices';
import { useCallStore } from '@/features/callLogic';
import { playScript, stopTTS } from '@/services/ttsEngine';
import { useSettingsStore } from '@/store/settingsStore';
import { Teleprompter } from '@/components/call/Teleprompter';
import { Keypad } from '@/components/call/Keypad';

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
    isMuted,
    isSpeakerOn,
    toggleMute,
    toggleSpeaker,
    activePersona,
  } = useCallStore();
  const { personas, selectedPersonaId, voiceId } = useSettingsStore();
  const [elapsed, setElapsed] = useState('00:00');
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [dialed, setDialed] = useState('');

  const persona = useMemo(
    () => activePersona ?? personas.find((item) => item.id === selectedPersonaId) ?? personas[0],
    [activePersona, personas, selectedPersonaId]
  );

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

    const voice = VOICES.find((item) => item.id === voiceId);
    playScript(scriptTurns, setActiveLineIndex, voice);

    return () => {
      stopTTS();
    };
  }, [status, scriptTurns, setActiveLineIndex, router, voiceId]);

  const handleEnd = async () => {
    stopTTS();
    await endCall();
    router.replace('/(tabs)');
  };

  useEffect(() => {
    return () => {
      stopTTS();
      void endCall();
    };
  }, [endCall]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#040509', '#0B1320', '#1E293B']} style={styles.background} />

      <View style={styles.header}>
        <Text style={styles.name}>{persona.displayName}</Text>
        <Text style={styles.timer}>{elapsed}</Text>
        <View style={styles.micMeter}>
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
        {dialed.length > 0 && (
          <Text style={styles.dialedText}>{dialed}</Text>
        )}
        <View style={styles.controlRow}>
          <Pressable
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}>
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
          </Pressable>
          <Pressable
            style={[styles.controlButton, keypadOpen && styles.controlButtonActive]}
            onPress={() => setKeypadOpen((prev) => !prev)}>
            <Ionicons name="keypad" size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>Keypad</Text>
          </Pressable>
          <Pressable
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}>
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={22} color="#CBD5F5" />
            <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.endButton} onPress={handleEnd}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.endLabel}>End</Text>
        </Pressable>
      </View>
      {keypadOpen && (
        <Keypad
          onKeyPress={(value) => setDialed((prev) => `${prev}${value}`)}
          onClose={() => setKeypadOpen(false)}
        />
      )}
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
  dialedText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
    letterSpacing: 2,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  controlButtonActive: {
    borderColor: 'rgba(253, 224, 71, 0.6)',
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
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
