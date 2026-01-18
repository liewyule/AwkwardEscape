import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, FlatList, StyleSheet, Text, View } from 'react-native';

import type { ScriptTurn } from '@/types/call';

type TeleprompterProps = {
  turns: ScriptTurn[];
  activeIndex: number;
};

export function Teleprompter({ turns, activeIndex }: TeleprompterProps) {
  const listRef = useRef<FlatList<ScriptTurn>>(null);
  const progress = useRef(new Animated.Value(0)).current;

  const activeDurationMs = useMemo(() => {
    if (activeIndex < 0 || activeIndex >= turns.length) {
      return 0;
    }

    const turn = turns[activeIndex];
    const wordCount = turn.text.trim().split(/\s+/).filter(Boolean).length;
    const baseDuration = Math.max(800, wordCount * 350);
    const pause = turn.pauseMs ?? 500;
    return baseDuration + pause;
  }, [activeIndex, turns]);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0 || turns.length === 0) {
      return;
    }

    listRef.current.scrollToIndex({
      index: Math.min(activeIndex, Math.max(0, turns.length - 1)),
      animated: true,
      viewPosition: 0.2,
    });
  }, [activeIndex, turns.length]);

  useEffect(() => {
    if (activeDurationMs <= 0) {
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: activeDurationMs,
      useNativeDriver: false,
    }).start();
  }, [activeDurationMs, progress]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teleprompter</Text>
      <FlatList
        ref={listRef}
        data={turns}
        keyExtractor={(_, index) => `${index}`}
        renderItem={({ item, index }) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const progressWidth = progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          });
          return (
            <View style={styles.lineRow}>
              <Text style={[styles.line, isActive && styles.activeLine]}>
                {item.speaker}: {item.text}
              </Text>
              <View style={styles.progressTrack}>
                {isActive ? (
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                ) : (
                  <View
                    style={[
                      styles.progressFill,
                      isCompleted ? styles.progressFillDone : styles.progressFillIdle,
                    ]}
                  />
                )}
              </View>
            </View>
          );
        }}
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
  lineRow: {
    marginBottom: 12,
  },
  line: {
    color: '#A9B4C4',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  activeLine: {
    color: '#FDE68A',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    width: '100%',
  },
  progressFillDone: {
    width: '100%',
    backgroundColor: 'rgba(148, 163, 184, 0.55)',
  },
  progressFillIdle: {
    width: '0%',
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
});
