import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { VOICES } from '@/constants/voices';
import { useSettingsStore } from '@/store/settingsStore';

export default function VoicesScreen() {
  const router = useRouter();
  const { voiceId, setVoiceId } = useSettingsStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.title}>Voices</Text>
          <Text style={styles.subtitle}>Google Cloud TTS</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Caller Voice</Text>
      <Text style={styles.sectionHint}>
        Choose the Google TTS voice used for the caller audio.
      </Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {VOICES.map((voice) => {
          const active = voice.id === voiceId;
          return (
            <Pressable
              key={voice.id}
              onPress={() => setVoiceId(voice.id)}
              style={[styles.voiceCard, active && styles.voiceCardActive]}>
              <View>
                <Text style={[styles.voiceLabel, active && styles.voiceLabelActive]}>
                  {voice.label}
                </Text>
                <Text style={styles.voiceMeta}>{voice.name}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color="#0F172A" />}
            </Pressable>
          );
        })}
      </ScrollView>
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
  sectionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  list: {
    paddingBottom: 40,
    gap: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  voiceCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  voiceLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  voiceLabelActive: {
    color: '#0F172A',
  },
  voiceMeta: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
