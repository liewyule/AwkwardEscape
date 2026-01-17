import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useCallStore } from '@/features/callLogic';
import { useSettingsStore } from '@/store/settingsStore';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { status, answerCall, endCall, activePersona } = useCallStore();
  const { personas, selectedPersonaId } = useSettingsStore();
  const statusRef = useRef(status);

  const fallbackPersona = useMemo(
    () => personas.find((item) => item.id === selectedPersonaId) ?? personas[0],
    [personas, selectedPersonaId]
  );
  const persona = activePersona ?? fallbackPersona;

  useEffect(() => {
    if (status === 'idle' || status === 'ended') {
      router.replace('/(tabs)');
    }
  }, [status, router]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      if (statusRef.current === 'ringing') {
        void endCall();
      }
    };
  }, [endCall]);

  const handleDecline = async () => {
    await endCall();
    router.replace('/(tabs)');
  };

  const handleAnswer = async () => {
    await answerCall(persona);
    router.replace('/active-call');
  };

  const personaName = persona?.displayName ?? 'Unknown';
  const avatarInitial = personaName ? personaName.slice(0, 1) : '?';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#020617', '#0F172A', '#1E293B']} style={styles.background} />
      <View style={styles.fauxBlur} />

      <View style={styles.header}>
        <Text style={styles.incoming}>Incoming Call</Text>
        <Text style={styles.name}>{personaName}</Text>
        <Text style={styles.subtext}>mobile</Text>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarInitial}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.decline]} onPress={handleDecline}>
          <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.actionLabel}>Decline</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.answer]} onPress={handleAnswer}>
          <Ionicons name="call" size={26} color="#fff" />
          <Text style={styles.actionLabel}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 90,
    paddingBottom: 70,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  fauxBlur: {
    position: 'absolute',
    top: 120,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  incoming: {
    color: '#CBD5F5',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  name: {
    color: '#F8FAFC',
    fontSize: 32,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  subtext: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(248, 250, 252, 0.5)',
  },
  avatarText: {
    color: '#FDE68A',
    fontSize: 56,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    gap: 8,
  },
  decline: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  answer: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
