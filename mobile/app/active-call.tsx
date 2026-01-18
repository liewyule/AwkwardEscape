import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Teleprompter } from '@/components/call/Teleprompter';
import { VOICES } from '@/constants/voices';
import { useCallStore } from '@/features/callLogic';
import { playScript, stopTTS } from '@/services/ttsEngine';
import { useSettingsStore } from '@/store/settingsStore';


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

    const activeVoiceId = persona?.voiceId ?? voiceId;
    const voice = VOICES.find((item) => item.id === activeVoiceId);
    playScript(scriptTurns, setActiveLineIndex, voice);

    return () => {
      stopTTS();
    };
  }, [status, scriptTurns, setActiveLineIndex, router, voiceId, persona]);

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
      <LinearGradient colors={['#5A5148', '#4A423A', '#3C352F']} style={styles.background} />

      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.callPill}>
            <Ionicons name="link" size={16} color="#E7F5EC" />
          </View>
          <View style={styles.miniMeter}>
            <View
              style={[
                styles.miniMeterFill,
                {
                  width: `${Math.min(100, Math.max(12, (micLevel + 80) * 1.2))}%`,
                },
              ]}
            />
          </View>
        </View>
        <Pressable style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={22} color="#F8FAFC" />
        </Pressable>
      </View>

      <View style={styles.centerInfo}>
        <Text style={styles.timer}>{elapsed}</Text>
        <Text style={styles.name}>{persona.displayName}</Text>
      </View>
      <Teleprompter turns={scriptTurns} activeIndex={activeLineIndex} />
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Pressable
            style={[styles.controlCircle, isSpeakerOn && styles.controlCircleActive]}
            onPress={toggleSpeaker}>
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={26} color="#F8FAFC" />
          </Pressable>
          <Pressable style={[styles.controlCircle, styles.controlCircleDisabled]}>
            <Ionicons name="videocam" size={26} color="rgba(248, 250, 252, 0.6)" />
          </Pressable>
          <Pressable
            style={[styles.controlCircle, isMuted && styles.controlCircleActive]}
            onPress={toggleMute}>
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color="#F8FAFC" />
          </Pressable>
        </View>
        <View style={styles.controlLabels}>
          <Text style={styles.controlLabel}>Audio</Text>
          <Text style={styles.controlLabel}>FaceTime</Text>
          <Text style={styles.controlLabel}>Mute</Text>
        </View>
        <View style={styles.controlRow}>
          <Pressable style={styles.controlCircle}>
            <Ionicons name="person-add" size={26} color="#F8FAFC" />
          </Pressable>
          <Pressable style={styles.endButton} onPress={handleEnd}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Pressable style={styles.controlCircle}>
            <Ionicons name="keypad" size={26} color="#F8FAFC" />
          </Pressable>
        </View>

        <View style={styles.controlLabels}>
          <Text style={styles.controlLabel}>Add</Text>
          <Text style={styles.controlLabel}>End</Text>
          <Text style={styles.controlLabel}>Keypad</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callPill: {
    height: 28,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMeter: {
    width: 60,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  miniMeterFill: {
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInfo: {
    alignItems: 'center',
    gap: 8,
    marginTop:-10,
  },
  timer: {
    color: 'rgba(248, 250, 252, 0.7)',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
    letterSpacing: 2,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 28,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textAlign: 'center',
  },
  controls: {
    gap: 18,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.08)',
  },
  controlCircleActive: {
    backgroundColor: 'rgba(248, 250, 252, 0.28)',
    borderColor: 'rgba(248, 250, 252, 0.45)',
  },
  controlCircleDisabled: {
    backgroundColor: 'rgba(248, 250, 252, 0.1)',
  },
  endButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  controlLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -6,
  },
  controlLabel: {
    width: 78,
    textAlign: 'center',
    color: 'rgba(248, 250, 252, 0.8)',
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
