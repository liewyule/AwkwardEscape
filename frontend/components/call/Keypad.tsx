import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

type KeypadProps = {
  onKeyPress: (value: string) => void;
  onClose: () => void;
};

export function Keypad({ onKeyPress, onClose }: KeypadProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Keypad</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {KEYS.map((key) => (
            <Pressable
              key={key}
              style={styles.key}
              onPress={() => {
                Haptics.selectionAsync();
                onKeyPress(key);
              }}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 10, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  close: {
    color: '#FDE68A',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  keyText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
