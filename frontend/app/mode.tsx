import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CallMode } from '@/types/call';
import { useSettingsStore } from '@/store/settingsStore';

const MODE_LABELS: Record<CallMode, string> = {
  silent_message: 'Silent message',
  instant_call: 'Instant loud call',
  voice_guard: 'Loud call after silence',
};

const MODE_DESCRIPTIONS: Record<CallMode, string> = {
  silent_message: 'Sends a local notification with a believable text.',
  instant_call: 'Triggers the fake incoming call immediately.',
  voice_guard: 'Listens for 7 seconds; calls only if no voice is detected.',
};

const MODE_ORDER: CallMode[] = ['silent_message', 'instant_call', 'voice_guard'];

export default function ModeScreen() {
  const router = useRouter();
  const { selectedMode, setMode } = useSettingsStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.title}>Modes</Text>
          <Text style={styles.subtitle}>Pick how the escape triggers</Text>
        </View>
      </View>

      {MODE_ORDER.map((mode) => {
        const active = mode === selectedMode;
        return (
          <Pressable
            key={mode}
            onPress={() => setMode(mode)}
            style={[styles.modeCard, active && styles.modeCardActive]}>
            <View>
              <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                {MODE_LABELS[mode]}
              </Text>
              <Text style={styles.modeDescription}>{MODE_DESCRIPTIONS[mode]}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={20} color="#0F172A" />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 68,
    paddingHorizontal: 22,
  },
  header: {
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
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
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  modeCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  modeTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  modeTitleActive: {
    color: '#0F172A',
  },
  modeDescription: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
