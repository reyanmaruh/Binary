import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Byte } from '../components/Byte';
import { Text } from '../components/Text';
import { Btn } from '../components/UI';
import { InfoModal } from '../components/Modals';
import { LESSONS } from '../data/curriculum';
import { FadeIn, useFloat, usePop } from '../motion';
import type { Nav, ResultsParams } from '../navigation';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCpm, isUnlocked, pct, xpProgress } from '../utils';

export function ResultsScreen({ result, nav }: { result: ResultsParams; nav: Nav }) {
  const { state, refillHeartsFree } = useStore();
  const lesson = LESSONS.find((l) => l.id === result.lessonId);
  const lessonIndex = lesson ? LESSONS.findIndex((l) => l.id === lesson.id) : -1;
  const nextLesson = lessonIndex >= 0 ? LESSONS[lessonIndex + 1] : undefined;
  const reduced = state.settings.reducedMotion;
  const [levelUp, setLevelUp] = useState(!!result.levelUp);
  const xpNow = xpProgress(state.xp);
  const gemPop = usePop(result.gemsEarned, 0.7);
  const gemWiggle = useFloat(!reduced, 0, 900, 0);

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
    sub = result.passed
      ? lesson.title
      : result.gateNote === 'cpm'
        ? 'Too slow this time.'
        : `You answered ${pct(result.accuracy)}.`;
  }

  const canNext = !!nextLesson && isUnlocked(state, LESSONS, lessonIndex + 1);
  const mood = result.failed ? 'worried' : result.passed ? 'celebrate' : 'idle';

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Byte size={96} reduced={reduced} mood={mood as 'idle' | 'worried' | 'celebrate'} />
        <FadeIn from={14} enabled={!reduced}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </FadeIn>

        {result.mode === 'lesson' || result.mode === 'ghost' ? (
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => (
              <Star key={i} filled={i < result.stars} delay={i * 130} enabled={!reduced} />
            ))}
            {result.crown ? (
              <MaterialCommunityIcons name="crown" size={32} color={C.goldDark} style={{ marginLeft: 4 }} />
            ) : null}
          </View>
        ) : null}

        {result.gemsEarned > 0 ? (
          <Animated.View style={[styles.gem, gemPop]}>
            <Animated.View style={reduced ? undefined : gemWiggle}>
              <Ionicons name="diamond" size={20} color={C.beet} />
            </Animated.View>
            <Text style={styles.gemText}>+{result.gemsEarned} gems</Text>
          </Animated.View>
        ) : null}

        <View style={styles.grid}>
          <Stat delay={0} value={pct(result.accuracy)} label="Accuracy" tone={result.accuracy >= 0.9 ? C.greenDark : C.goldDark} enabled={!reduced} />
          <Stat delay={70} value={result.cpm == null ? '—' : fmtCpm(result.cpm)} label="CPM" tone={C.blueDark} enabled={!reduced} />
          <Stat delay={140} value={`+${result.xpEarned}`} label="XP earned" tone={C.greenDark} enabled={!reduced} />
          <Stat
            delay={210}
            value={String(result.mode === 'boss' ? result.bossCorrect : result.bestCombo)}
            label={result.mode === 'boss' ? 'Correct' : 'Best combo'}
            tone={C.graphite}
            enabled={!reduced}
          />
        </View>

        {result.cappedXp > 0 ? <Text style={styles.cap}>Daily cap hit — {result.cappedXp} XP not counted.</Text> : null}

        <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
          {result.failed ? (
            <Btn
              label="Retry (hearts refilled)"
              onPress={() => {
                refillHeartsFree();
                nav.go('player', { lessonId: lesson?.id, mode: result.mode === 'ghost' ? 'ghost' : 'lesson' });
              }}
            />
          ) : result.mode === 'practice' && !result.passed ? (
            <Btn label="Practice again" onPress={() => nav.go('player', { lessonId: lesson?.id, mode: 'practice' })} />
          ) : (result.mode === 'lesson' || result.mode === 'ghost') && result.passed && nextLesson && !canNext ? (
            <Btn
              label={`Practice to unlock · ${nextLesson.id}`}
              onPress={() => nav.go('player', { lessonId: lesson?.id, mode: 'practice' })}
            />
          ) : result.mode === 'boss' || result.mode === 'flash' || result.mode === 'weak' ? (
            <Btn label="Go again" onPress={() => nav.go('player', { mode: result.mode })} />
          ) : result.passed && nextLesson ? (
            <Btn
              label={`Next lesson · ${nextLesson.id}`}
              onPress={() => nav.go('player', { lessonId: nextLesson.id, mode: 'lesson' })}
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

      <InfoModal
        visible={levelUp}
        icon="sparkles"
        title={`Level ${xpNow.lv}!`}
        body={`You reached level ${xpNow.lv}. ${Math.max(0, xpNow.need - xpNow.into)} XP to level ${xpNow.lv + 1}.`}
        primaryLabel="Nice"
        onPrimary={() => setLevelUp(false)}
        onClose={() => setLevelUp(false)}
      />
    </View>
  );
}

function Star({ filled, delay, enabled }: { filled: boolean; delay: number; enabled: boolean }) {
  const anim = usePop(`${filled}-${delay}`, 0.4, enabled);
  return (
    <Animated.View style={anim}>
      <Ionicons name={filled ? 'star' : 'star-outline'} size={44} color={filled ? C.gold : C.swan} />
    </Animated.View>
  );
}

function Stat({
  value,
  label,
  tone,
  delay,
  enabled,
}: {
  value: string;
  label: string;
  tone: string;
  delay: number;
  enabled: boolean;
}) {
  return (
    <FadeIn delay={delay} from={16} enabled={enabled} style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, alignItems: 'center', paddingTop: 28, paddingBottom: 40 },
  title: { ...T.h1, fontSize: 28, textAlign: 'center', marginTop: 10 },
  sub: { ...T.body, textAlign: 'center', marginTop: 6, maxWidth: 340 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', marginTop: 20 },
  stat: {
    width: '47.7%',
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    padding: 16,
    backgroundColor: C.paper,
    shadowColor: C.swan,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  statValue: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  statLabel: { ...T.label, marginTop: 4 },
  gem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.gemBg,
    borderWidth: 2,
    borderColor: C.gemLine,
    borderRadius: R.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 16,
  },
  gemText: { fontSize: 19, fontWeight: '700', color: C.gemInk, fontVariant: ['tabular-nums'] },
  cap: { ...T.tiny, marginTop: 10, textAlign: 'center' },
});
