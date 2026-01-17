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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background} />

      <Pressable style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={22} color="#F8FAFC" />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.subtext}>mobile</Text>
        <Text style={styles.name}>{personaName}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.actionColumns}>
          <View style={styles.actionColumn}>
            <View style={styles.shortcut}>
              <View style={styles.shortcutIcon}>
                <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.shortcutLabel}>Message</Text>
            </View>
             <Pressable onPress={handleDecline} style={styles.actionButton}>
              <View style={[styles.actionCircle, styles.decline]}>
                <Ionicons
                  name="call"
                  size={34}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: "137deg" }] }}
                />
              </View>
              <Text style={styles.actionLabel}>Decline</Text>
           </Pressable>
          </View>

          <View style={styles.actionColumn}>
            <View style={styles.shortcut}>
              <View style={styles.shortcutIcon}>
                <Ionicons name="alarm" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.shortcutLabel}>Remind Me</Text>
            </View>
            <Pressable onPress={handleAnswer} style={styles.actionButton}>
              <View style={[styles.actionCircle, styles.answer]}>
                <Ionicons
                  name="call"
                  size={34}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.actionLabel}>Accept</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomHandle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 72,
    paddingBottom: 16,
    backgroundColor: '#5A524A',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#5A524A',
  },
  infoButton: {
    position: 'absolute',
    top: 52,
    right: 22,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 56,
    gap: 6,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: 'System',
    fontWeight: '600',
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    letterSpacing: 0.6,
    fontFamily: 'System',
    fontWeight: '700',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    gap: 14,
  },
  actionColumns: {
    width: '84%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 24,
  },
  shortcut: {
    alignItems: 'center',
    gap: 10,
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  shortcutLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '500',
  },
  actionButton: {
    alignItems: 'center',
    gap: 10,
  },
  actionCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 41,
  },
  decline: {
    backgroundColor: '#EF4444',
  },
  answer: {
    backgroundColor: '#22C55E',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '500',
  },
  bottomHandle: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 6,
  },
});
