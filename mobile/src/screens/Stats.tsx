import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Byte } from '../components/Byte';
import { HUD } from '../components/HUD';
import { Card, PageHead, ProgressBar } from '../components/UI';
import { LESSONS } from '../data/curriculum';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { dayKey, daysPractised, fmtCpm, pct, xpProgress } from '../utils';

export function StatsScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const xp = xpProgress(state.xp);
  const name = state.profile.name.trim();
  const totalAttempts = state.stats.attempts;
  const accuracy = totalAttempts ? state.stats.correct / totalAttempts : 0;
  const cleared = Object.keys(state.lessons).filter((id) => state.lessons[id]?.completed).length;

  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = dayKey(d);
    const cpm = state.history
      .filter((h) => h.day === key && h.cpm != null)
      .reduce((m, h) => Math.max(m, h.cpm || 0), 0);
    return { key, cpm };
  });
  const maxCpm = Math.max(10, ...days.map((d) => d.cpm));

  const lines: [string, string][] = [
    ['Days practised', String(daysPractised(state))],
    ['Total conversions', String(state.stats.conversions)],
    ['All-time accuracy', totalAttempts ? pct(accuracy) : '—'],
    ['Lessons cleared', `${cleared} / ${LESSONS.length}`],
    ['PB dec→bin', `${fmtCpm(state.lessons[LESSONS[0].id]?.bestCpm ?? null)} CPM`],
    ['Boss best', state.bossBest == null ? '—' : `${fmtCpm(state.bossBest)} CPM`],
    ['Flash best', state.flashBest == null ? '—' : `${fmtCpm(state.flashBest)} CPM`],
  ];

  return (
    <ScrollView style={{ flex: 1 }} stickyHeaderIndices={[0]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HUD onStats={() => {}} />
      <PageHead title="Stats" subtitle="Your numbers. No leaderboard, no noise." onBack={() => nav.tab('home')} />

      <Card>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Byte size={54} float={false} reduced={state.settings.reducedMotion} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.h2}>{name || `Level ${xp.lv}`}</Text>
            <Text style={styles.meta}>
              {state.profile.age ? `Age ${state.profile.age} · ` : ''}Level {xp.lv} · {xp.into} / {xp.need} XP
            </Text>
            <View style={{ marginTop: 8 }}>
              <ProgressBar ratio={xp.ratio} height={12} />
            </View>
            <Text style={[T.tiny, { marginTop: 6 }]}>{xp.need - xp.into} XP to level {xp.lv + 1}</Text>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          {lines.map(([k, v], i) => (
            <View key={k} style={[styles.line, i === lines.length - 1 ? { borderBottomWidth: 0 } : null]}>
              <Text style={styles.lineKey}>{k}</Text>
              <Text style={styles.lineValue}>{v}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <View style={styles.chartHead}>
          <Text style={T.h3}>CPM · last 30 days</Text>
          <View style={styles.trophy}>
            <Text style={styles.trophyText}>🏆 best {fmtCpm(maxCpm === 10 ? null : maxCpm)}</Text>
          </View>
        </View>
        <View style={styles.chart}>
          {days.map((d) => (
            <View key={d.key} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(3, (d.cpm / maxCpm) * 100), backgroundColor: d.cpm > 0 ? C.green : C.polar },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.chartLabels}>
          <Text style={T.tiny}>30 days ago</Text>
          <Text style={T.tiny}>today</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.eelLight,
    borderWidth: 2,
    borderColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  meta: { ...T.tiny, marginTop: 3 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  lineKey: { fontSize: 15, color: C.ash },
  lineValue: { fontSize: 15, fontWeight: '800', color: C.graphite, fontVariant: ['tabular-nums'] },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  trophy: { backgroundColor: C.amberPale, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  trophyText: { fontSize: 11, fontWeight: '800', color: C.goldDark },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120, marginTop: 14 },
  barWrap: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 4, minHeight: 3 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
