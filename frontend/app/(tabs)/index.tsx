import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PERSONAS } from '@/constants/personas';
import { useCallStore } from '@/features/callLogic';
import { scheduleFakeMessage } from '@/services/notificationEngine';
import { useSettingsStore } from '@/store/settingsStore';

const COUNTDOWN_SECONDS = 5;

export default function HomeScreen() {
  const router = useRouter();
  const { setCountdown, startRinging } = useCallStore();
  const { mode, setMode, personaId, setPersonaId } = useSettingsStore();
  const [countdown, setCountdownState] = useState(0);
  const [messageQueued, setMessageQueued] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(0);

  const selectedPersona = useMemo(
    () => PERSONAS.find((item) => item.id === personaId) ?? PERSONAS[0],
    [personaId]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    if (countdown > 0) {
      return;
    }

    setCountdownState(COUNTDOWN_SECONDS);
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = COUNTDOWN_SECONDS;

    timerRef.current = setInterval(async () => {
      countdownRef.current -= 1;
      const next = countdownRef.current;
      setCountdownState(next);
      setCountdown(next);

      if (next <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = null;
        countdownRef.current = 0;

        if (mode === 'message') {
          scheduleFakeMessage(
            selectedPersona.name,
            'Urgent: can you step out for a minute? I need to talk.'
          );
          setMessageQueued(true);
          setTimeout(() => setMessageQueued(false), 2000);
          return;
        }

        startRinging(selectedPersona.id).then(() => {
          router.push('/incoming-call');
        });
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = null;
    setCountdownState(0);
    setCountdown(0);
    countdownRef.current = 0;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B0F1A', '#111927', '#1B2735']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glow} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AwkwardEscape</Text>
          <Text style={styles.subtitle}>Social Emergency Exit</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={22} color="#E2E8F0" />
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Mode</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.modeText}>Silent (Message)</Text>
          <Switch
            value={mode === 'call'}
            onValueChange={(value) => setMode(value ? 'call' : 'message')}
            trackColor={{ false: '#2B394A', true: '#F97316' }}
            thumbColor={mode === 'call' ? '#FDE68A' : '#E2E8F0'}
          />
          <Text style={styles.modeText}>Loud (Call)</Text>
        </View>
      </View>

      <View style={styles.personaPanel}>
        <Text style={styles.panelLabel}>Persona</Text>
        <View style={styles.personaRow}>
          {PERSONAS.map((persona) => {
            const active = persona.id === personaId;
            return (
              <Pressable
                key={persona.id}
                onPress={() => setPersonaId(persona.id)}
                style={[styles.personaChip, active && styles.personaChipActive]}>
                <Text style={[styles.personaName, active && styles.personaNameActive]}>
                  {persona.name}
                </Text>
                <Text style={styles.personaSummary}>{persona.summary}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.panicButton,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onLongPress={startCountdown}
          delayLongPress={2000}>
          <LinearGradient
            colors={['#F97316', '#FB7185', '#FDE68A']}
            style={styles.panicGlow}
          />
          <Text style={styles.panicText}>Hold to Escape</Text>
          <Text style={styles.panicHint}>Hold for 2 seconds</Text>
        </Pressable>
        {countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Pressable onPress={cancelCountdown} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      {messageQueued && (
        <Text style={styles.armedNote}>Fake message scheduled.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 140,
    backgroundColor: 'rgba(248, 113, 113, 0.35)',
    shadowColor: '#F97316',
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 14,
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
    borderColor: 'rgba(148, 163, 184, 0.3)',
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
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeText: {
    color: '#CBD5F5',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  personaPanel: {
    marginBottom: 24,
  },
  personaRow: {
    gap: 12,
  },
  personaChip: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  personaChipActive: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
  },
  personaName: {
    color: '#E2E8F0',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  personaNameActive: {
    color: '#FDE68A',
  },
  personaSummary: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  buttonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  panicButton: {
    width: 240,
    height: 240,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: 'rgba(253, 224, 71, 0.6)',
    shadowColor: '#F97316',
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  panicGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 140,
    opacity: 0.35,
  },
  panicText: {
    color: '#FDE68A',
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  panicHint: {
    marginTop: 8,
    color: '#CBD5F5',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  countdownOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(8, 11, 18, 0.75)',
    borderRadius: 140,
  },
  countdownText: {
    color: '#FDE68A',
    fontSize: 54,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  cancelButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  cancelText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  armedNote: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
