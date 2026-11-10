import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HUD } from '../components/HUD';
import { Card, PageHead } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCpm } from '../utils';

export function PracticeScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const due = Object.keys(state.srs).filter((k) => (state.srs[k]?.errorCount || 0) > 0).length;
  const weakLesson = LESSONS.find((l) => state.lessons[l.id]?.completed) || LESSONS[0];

  const cards = [
    {
      icon: 'locate' as const,
      bg: '#ecfdf5',
      title: 'Weak items',
      desc: 'Spaced repetition on the ones you missed',
      stat: `${due} due`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'weak' }),
    },
    {
      icon: 'speedometer' as const,
      bg: '#fef3c7',
      title: 'Speed run',
      desc: '60 seconds, mixed directions, no hints',
      stat: state.bossBest == null ? '— CPM' : `${fmtCpm(state.bossBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'boss' }),
    },
    {
      icon: 'timer' as const,
      bg: '#ecfeff',
      title: 'Flash round',
      desc: '1.5 seconds per item. No chart, no mercy.',
      stat: state.flashBest == null ? '— CPM' : `${fmtCpm(state.flashBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'flash' }),
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }} stickyHeaderIndices={[0]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HUD onStats={() => nav.tab('stats')} />
      <PageHead title="Practice hub" subtitle="No leaderboard. Just you vs. your best." onBack={() => nav.tab('home')} />
      <View style={{ gap: 14 }}>
        {cards.map((c) => (
          <Pressable key={c.title} onPress={c.onPress} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon} size={24} color={C.greenDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{c.title}</Text>
              <Text style={styles.desc}>{c.desc}</Text>
            </View>
            <Text style={styles.stat}>{c.stat}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={T.h3}>Speed tiers</Text>
        <Text style={[T.tiny, { marginTop: 6, lineHeight: 17 }]}>
          Stars unlock by CPM in dec→bin: 1 star to pass, 2 stars at {CONFIG.cpm.dec2bin[1]}, 3 stars at{' '}
          {CONFIG.cpm.dec2bin[2]}. Practice sessions never cost hearts.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    padding: 14,
  },
  icon: { width: 52, height: 52, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  desc: { ...T.tiny, marginTop: 2, lineHeight: 17, paddingRight: 6 },
  stat: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: C.greenDark,
    backgroundColor: C.polar,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
});
