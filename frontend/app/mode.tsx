import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CallMode } from '@/types/call';
import { useSettingsStore } from '@/store/settingsStore';

const MODES: Array<{
  value: CallMode;
  title: string;
  description: string;
  detail: string;
}> = [
  {
    value: 'silent_message',
    title: 'Silent message',
    description: 'Send a discreet local notification.',
    detail: 'Uses your selected persona to craft an urgent text.',
  },
  {
    value: 'instant_call',
    title: 'Instant loud call',
    description: 'Fake incoming call immediately.',
    detail: 'Triggers ringing, then TTS once you answer.',
  },
  {
    value: 'voice_guard',
    title: 'Loud call after silence',
    description: 'Listen for voice for 7 seconds.',
    detail: 'If no voice is detected, a call starts.',
  },
];

export default function ModeScreen() {
  const router = useRouter();
  const { selectedMode, setMode } = useSettingsStore();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.title}>Modes</Text>
          <Text style={styles.subtitle}>Choose how the escape triggers.</Text>
        </View>
      </View>

      <View style={styles.list}>
        {MODES.map((mode) => {
          const active = selectedMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => setMode(mode.value)}
              style={[styles.card, active && styles.cardActive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{mode.title}</Text>
                {active ? (
                  <Ionicons name="checkmark-circle" size={18} color="#0EA5E9" />
                ) : (
                  <Ionicons name="ellipse-outline" size={18} color="#94A3B8" />
                )}
              </View>
              <Text style={styles.cardDescription}>{mode.description}</Text>
              <Text style={styles.cardDetail}>{mode.detail}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 2,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  cardDescription: {
    color: '#475569',
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  cardDetail: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
