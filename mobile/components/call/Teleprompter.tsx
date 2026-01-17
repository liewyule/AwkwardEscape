import React, { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { ScriptTurn } from '@/types/call';

type TeleprompterProps = {
  turns: ScriptTurn[];
  activeIndex: number;
};

export function Teleprompter({ turns, activeIndex }: TeleprompterProps) {
  const listRef = useRef<FlatList<ScriptTurn>>(null);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) {
      return;
    }

    listRef.current.scrollToIndex({
      index: Math.min(activeIndex, Math.max(0, turns.length - 1)),
      animated: true,
      viewPosition: 0.2,
    });
  }, [activeIndex, turns.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teleprompter</Text>
      <FlatList
        ref={listRef}
        data={turns}
        keyExtractor={(_, index) => `${index}`}
        renderItem={({ item, index }) => (
          <Text style={[styles.line, index === activeIndex && styles.activeLine]}>
            {item.speaker}: {item.text}
          </Text>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 16, 22, 0.92)',
    borderRadius: 24,
    padding: 16,
    maxHeight: 260,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    color: '#EAF2FF',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  content: {
    paddingBottom: 12,
  },
  line: {
    color: '#A9B4C4',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  activeLine: {
    color: '#FDE68A',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
