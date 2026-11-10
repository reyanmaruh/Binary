import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Byte } from '../components/Byte';
import { Btn } from '../components/UI';
import { LESSONS } from '../data/curriculum';
import type { Nav, ResultsParams } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCpm, isUnlocked, pct } from '../utils';

export function ResultsScreen({ result, nav }: { result: ResultsParams; nav: Nav }) {
  const { state } = useStore();
  const lesson = LESSONS.find((l) => l.id === result.lessonId);
  const lessonIndex = lesson ? LESSONS.findIndex((l) => l.id === lesson.id) : -1;
  const nextLesson = lessonIndex >= 0 ? LESSONS[lessonIndex + 1] : undefined;

  let title = 'Session complete';
  let sub = 'Nice work.';
  if (result.failed) {
    title = 'Out of hearts.';
    sub = 'Take a breath, then go again.';
  } else if (result.mode === 'boss') {
    title = 'Boss run complete';
    sub = '60 seconds of pure conversion.';
  } else if (result.mode === 'flash') {
    title = 'Flash round done';
    sub = 'Fast hands, fast brain.';
  } else if (result.mode === 'weak') {
    title = 'Weak spots worked';
    sub = 'Those items will resurface later.';
  } else if (result.mode === 'practice') {
    title = result.passed ? 'Practice passed!' : 'Practice not passed';
    sub = result.passed
      ? nextLesson
        ? `Lesson ${nextLesson.id} is unlocked.`
        : 'Every lesson is open.'
      : `You answered ${pct(result.accuracy)}.`;
  } else if (lesson) {
    title = result.passed ? 'Lesson complete!' : 'Not passed yet';
    sub = result.passed ? lesson.title : `You answered ${pct(result.accuracy)}.`;
  }

  const canNext = !!nextLesson && isUnlocked(state, LESSONS, lessonIndex + 1);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Byte size={92} reduced={state.settings.reducedMotion} />
        <Text style={[T.h1, { textAlign: 'center' }]}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>

        {result.mode === 'lesson' ? (
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => (
              <Ionicons key={i} name={i < result.stars ? 'star' : 'star-outline'} size={40} color={i < result.stars ? C.gold : C.swan} />
            ))}
          </View>
        ) : null}

        <View style={styles.grid}>
          <Stat value={pct(result.accuracy)} label="Accuracy" tone={result.accuracy >= 0.9 ? C.greenDark : C.goldDark} />
          <Stat value={result.cpm == null ? '—' : fmtCpm(result.cpm)} label="CPM" tone={C.blueDark} />
          <Stat value={`+${result.xpEarned}`} label="XP earned" tone={C.greenDark} />
          <Stat
            value={String(result.mode === 'boss' ? result.bossCorrect : result.bestCombo)}
            label={result.mode === 'boss' ? 'Correct' : 'Best combo'}
            tone={C.graphite}
          />
        </View>

        {result.gemsEarned > 0 ? (
          <View style={styles.gem}>
            <Ionicons name="diamond" size={18} color={C.beet} />
            <Text style={styles.gemText}>+{result.gemsEarned} gems</Text>
          </View>
        ) : null}

        {result.cappedXp > 0 ? <Text style={styles.cap}>Daily cap hit — {result.cappedXp} XP not counted.</Text> : null}

        <View style={{ width: '100%', gap: 10, marginTop: 18 }}>
          {result.failed ? (
            <Btn label="Try again" onPress={() => nav.go('player', { lessonId: lesson?.id, mode: result.mode })} />
          ) : result.mode === 'lesson' && result.passed && nextLesson && !canNext ? (
            <Btn
              label={`Practice to unlock · ${nextLesson.id}`}
              onPress={() => nav.go('player', { lessonId: lesson?.id, mode: 'practice' })}
            />
          ) : result.passed && nextLesson ? (
            <Btn
              label={`Next lesson · ${nextLesson.id}`}
              onPress={() => {
                nav.go('player', { lessonId: nextLesson.id, mode: 'lesson' });
              }}
            />
          ) : (
            <Btn label="Practice hub" onPress={() => nav.tab('practice')} />
          )}

          {result.passed && result.mode !== 'practice' && lesson ? (
            <Btn label="Practice again" variant="secondary" onPress={() => nav.go('player', { lessonId: lesson.id, mode: 'practice' })} />
          ) : null}
          <Btn label="Home" variant="ghost" onPress={() => nav.tab('home')} />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, alignItems: 'center', paddingTop: 28 },
  sub: { ...T.body, textAlign: 'center', marginTop: 6 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', marginTop: 20 },
  stat: {
    width: '47%',
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    padding: 14,
    backgroundColor: C.paper,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { ...T.label, marginTop: 3, fontSize: 10 },
  gem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5edff',
    borderWidth: 2,
    borderColor: '#e4d4ff',
    borderRadius: R.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 14,
  },
  gemText: { fontSize: 18, fontWeight: '800', color: '#7b3fd1' },
  cap: { ...T.tiny, marginTop: 8, textAlign: 'center' },
});
