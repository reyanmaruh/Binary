import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { HUD } from '../components/HUD';
import { Text } from '../components/Text';
import { Card, PageHead } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import { FadeIn, Press3D } from '../motion';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCpm } from '../utils';

export function PracticeScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;
  const due = Object.keys(state.srs).filter((k) => (state.srs[k]?.errorCount || 0) > 0).length;
  const weakLesson = LESSONS.find((l) => state.lessons[l.id]?.completed) || LESSONS[0];

  const cards = [
    {
      icon: 'locate' as const,
      bg: C.eelLight,
      title: 'Weak items',
      desc: 'Spaced repetition on the ones you missed',
      stat: `${due} due`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'weak' }),
    },
    {
      icon: 'speedometer' as const,
      bg: C.amberPale,
      title: 'Speed run',
      desc: '60 seconds, mixed directions, no hints',
      stat: state.bossBest == null ? '— CPM' : `${fmtCpm(state.bossBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'boss' }),
    },
    {
      icon: 'timer' as const,
      bg: C.bluePale,
      title: 'Flash round',
      desc: '1.5 seconds per item. No chart, no mercy.',
      stat: state.flashBest == null ? '— CPM' : `${fmtCpm(state.flashBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'flash' }),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      stickyHeaderIndices={[0]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <HUD onStats={() => nav.tab('stats')} />
      <View style={styles.inner}>
        <PageHead title="Practice hub" subtitle="No leaderboard. Just you vs. your best." onBack={() => nav.tab('home')} />
        <View style={{ gap: 16 }}>
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={i * 70} from={14} enabled={!reduced}>
              <Press3D
                onPress={c.onPress}
                bg={C.paper}
                shadowColor={C.swan}
                radius={R.lg}
                depth={4}
                contentStyle={styles.card}
                accessibilityLabel={c.title}
              >
                <View style={[styles.icon, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon} size={26} color={C.greenDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.desc}>{c.desc}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statText}>{c.stat}</Text>
                </View>
              </Press3D>
            </FadeIn>
          ))}
        </View>

        <Card style={{ marginTop: 20 }}>
          <Text style={T.h3}>Speed tiers</Text>
          <Text style={[T.tiny, { marginTop: 4 }]}>Stars are earned by conversions per minute.</Text>
          {[
            [CONFIG.cpm.dec2bin[0], '1 star', C.swan],
            [CONFIG.cpm.dec2bin[1], '2 stars', C.gold],
            [CONFIG.cpm.dec2bin[2], '3 stars', C.goldDark],
          ].map(([cpm, label, color], i) => (
            <View key={label} style={[styles.tier, i === 0 ? { borderTopWidth: 0, marginTop: 10, paddingTop: 0 } : null]}>
              <Ionicons name="star" size={16} color={color as string} />
              <Text style={styles.tierLabel}>{label}</Text>
              <Text style={styles.tierValue}>{cpm}+ CPM</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  inner: { paddingHorizontal: 16, paddingTop: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.lg,
    backgroundColor: C.paper,
  },
  icon: { width: 56, height: 56, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...T.h3, fontSize: 18 },
  desc: { fontSize: 14, fontWeight: '500', color: C.ash, marginTop: 2, lineHeight: 19 },
  stat: {
    backgroundColor: C.polar,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.greenDark },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  tierLabel: { fontSize: 15, fontWeight: '500', color: C.ash, flex: 1 },
  tierValue: { fontSize: 15, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
});
