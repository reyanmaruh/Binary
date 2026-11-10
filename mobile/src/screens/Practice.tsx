import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HUD } from '../components/HUD';
import { Sheet } from '../components/Modals';
import { Text } from '../components/Text';
import { Btn, Card, PageHead } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import { FadeIn, Press3D } from '../motion';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCpm } from '../utils';

export function PracticeScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const [picker, setPicker] = useState(false);
  const reduced = state.settings.reducedMotion;
  const due = Object.keys(state.srs).filter((k) => (state.srs[k]?.errorCount || 0) > 0).length;
  const weakLesson = LESSONS.find((l) => state.lessons[l.id]?.completed) || LESSONS[0];

  const cards = [
    {
      icon: <Ionicons name="locate" size={26} color={C.greenDark} />,
      bg: '#ECFDF5',
      title: 'Weak items',
      desc: 'Spaced repetition on the ones you missed',
      stat: `${due} due`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'weak' }),
    },
    {
      icon: <Ionicons name="flame" size={26} color={C.orangeDeep} />,
      bg: '#FEF3C7',
      title: 'Speed run',
      desc: '60 seconds, mixed directions, no hints',
      stat: state.bossBest == null ? '— CPM' : `${fmtCpm(state.bossBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'boss' }),
    },
    {
      icon: <Ionicons name="timer" size={26} color={C.blueDark} />,
      bg: '#ECFEFF',
      title: 'Flash round',
      desc: '1.5 seconds per item. No chart, no mercy.',
      stat: state.flashBest == null ? '— CPM' : `${fmtCpm(state.flashBest)} CPM`,
      onPress: () => nav.go('player', { lessonId: weakLesson.id, mode: 'flash' }),
    },
    {
      icon: <MaterialCommunityIcons name="ghost" size={26} color="#7b3fd1" />,
      bg: '#F5F3FF',
      title: 'Ghost race',
      desc: 'Race your own best on any lesson',
      stat: 'You vs. You',
      onPress: () => setPicker(true),
    },
  ];

  const ghostable = LESSONS.filter((l) => state.lessons[l.id]?.bestCpm != null);

  return (
    <>
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
              <FadeIn key={c.title} delay={i * 60} from={14} enabled={!reduced}>
                <Press3D
                  onPress={c.onPress}
                  bg={C.paper}
                  shadowColor={C.swan}
                  radius={R.lg}
                  depth={4}
                  contentStyle={styles.card}
                  accessibilityLabel={c.title}
                >
                  <View style={[styles.icon, { backgroundColor: c.bg }]}>{c.icon}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
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
            <Text style={[T.tiny, { marginTop: 4, lineHeight: 19 }]}>
              Stars unlock by CPM in dec→bin: 1 star to pass, 2 stars at {CONFIG.cpm.dec2bin[1]}, 3 stars at{' '}
              {CONFIG.cpm.dec2bin[2]}, crown at {CONFIG.cpm.dec2bin[3]}. The bin→dec ladder is higher.
            </Text>
            {[
              [CONFIG.cpm.dec2bin[0], '1 star', C.swan],
              [CONFIG.cpm.dec2bin[1], '2 stars', C.gold],
              [CONFIG.cpm.dec2bin[2], '3 stars', C.goldDark],
              [CONFIG.cpm.dec2bin[3], 'Crown', C.goldDark],
            ].map(([cpm, label, color], i) => (
              <View key={label} style={[styles.tier, i === 0 ? { borderTopWidth: 0, marginTop: 10, paddingTop: 0 } : null]}>
                {label === 'Crown' ? (
                  <MaterialCommunityIcons name="crown" size={16} color={color as string} />
                ) : (
                  <Ionicons name="star" size={16} color={color as string} />
                )}
                <Text style={styles.tierLabel}>{label}</Text>
                <Text style={styles.tierValue}>{cpm}+ CPM</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      <Sheet visible={picker} onClose={() => setPicker(false)}>
        <Text style={styles.pickerTitle}>Ghost race</Text>
        <Text style={[T.tiny, { textAlign: 'center', marginBottom: 14 }]}>
          Pick a lesson. The ghost runs at your personal best CPM.
        </Text>
        {ghostable.length === 0 ? (
          <Text style={[T.tiny, { textAlign: 'center', marginBottom: 10 }]}>
            Finish a lesson once to set a best pace.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {ghostable.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => {
                  setPicker(false);
                  setTimeout(() => nav.go('player', { lessonId: l.id, mode: 'ghost' }), 80);
                }}
                style={({ pressed }) => [styles.pickerRow, pressed ? { opacity: 0.75 } : null]}
                accessibilityRole="button"
                accessibilityLabel={`Ghost race lesson ${l.id}`}
              >
                <MaterialCommunityIcons name="ghost" size={18} color={C.beet} />
                <Text style={styles.pickerLabel} numberOfLines={1}>
                  {l.id} · {l.title}
                </Text>
                <Text style={styles.pickerCpm}>{fmtCpm(state.lessons[l.id]?.bestCpm ?? null)} CPM</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ marginTop: 14 }}>
          <Btn label="Close" variant="ghost" onPress={() => setPicker(false)} />
        </View>
      </Sheet>
    </>
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
  pickerTitle: { ...T.h2, textAlign: 'center', marginBottom: 4 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.paper,
  },
  pickerLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: C.graphite },
  pickerCpm: { fontSize: 12, fontWeight: '700', color: C.ash, fontVariant: ['tabular-nums'] },
});
