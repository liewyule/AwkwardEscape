import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { VOICES } from '@/constants/voices';
import { useSettingsStore } from '@/store/settingsStore';
import { supabase } from '@/services/supabaseClient';

export default function SettingsScreen() {
  const router = useRouter();
  const { voiceId, setVoiceId } = useSettingsStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B0F1A', '#111927', '#1B2735']} style={styles.background} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#E2E8F0" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 64 }} />
      </View>

      <Text style={styles.sectionTitle}>Caller Voice</Text>
      <Text style={styles.sectionHint}>
        Select which Google Cloud TTS voice is used for the caller.
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
              {active && <Ionicons name="checkmark-circle" size={22} color="#FDE68A" />}
            </Pressable>
          );
        })}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#F8FAFC" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 22,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  list: {
    paddingBottom: 30,
    gap: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  voiceCardActive: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  voiceLabel: {
    color: '#E2E8F0',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  voiceLabelActive: {
    color: '#FDE68A',
  },
  voiceMeta: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  logoutButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  logoutText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
