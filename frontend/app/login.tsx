import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/services/supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B0F1A', '#111927', '#1B2735']} style={styles.background} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0B0F1A" />
          ) : (
            <Text style={styles.primaryText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 28,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  primaryButton: {
    backgroundColor: '#FDE68A',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  primaryText: {
    color: '#0B0F1A',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  linkText: {
    color: '#CBD5F5',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
