import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound } from '../audio';
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
  const insets = useSafeAreaInsets();
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
  const celebrated = useRef(false);

  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    if (result.failed) {
      playSound('wrong');
      return;
    }
    if (result.passed) playSound(result.mode === 'lesson' || result.mode === 'ghost' ? 'lessonComplete' : 'xpGain');
  }, [result.failed, result.mode, result.passed]);

  useEffect(() => {
    if (!result.levelUp) return;
    const id = setTimeout(() => playSound('levelUp'), 700);
    return () => clearTimeout(id);
  }, [result.levelUp]);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Confetti active={!!result.passed && !reduced} pieces={result.mode === 'lesson' || result.mode === 'ghost' ? 64 : 40} />
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: 40 + Math.max(insets.bottom, 0) }]}
        showsVerticalScrollIndicator={false}
      >
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

        {result.mode === 'ghost' && result.ghostCpm != null && result.cpm != null ? (
          <GhostCompare cpm={result.cpm} ghost={result.ghostCpm} stars={result.stars} />
        ) : null}

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

function GhostCompare({ cpm, ghost, stars }: { cpm: number; ghost: number; stars: number }) {
  const max = Math.max(cpm, ghost, 1);
  const beat = cpm > ghost;
  const delta = Math.abs(cpm - ghost);
  return (
    <FadeIn from={12} enabled style={styles.ghostCard}>
      <View style={styles.ghostHead}>
        <View style={styles.ghostIcon}>
          <MaterialCommunityIcons name="ghost" size={18} color={C.gemInk} />
        </View>
        <Text style={styles.ghostTitle}>You vs. your ghost</Text>
        <View style={[styles.ghostBadge, beat ? styles.ghostBadgeWin : null]}>
          <Text style={[styles.ghostBadgeText, beat ? styles.ghostBadgeTextWin : null]}>{beat ? 'NEW BEST' : stars > 0 ? 'CHASE IT' : 'GHOST WON'}</Text>
        </View>
      </View>
      <GhostBar label="You" value={cpm} max={max} color={C.green} />
      <GhostBar label="Ghost" value={ghost} max={max} color={C.beet} />
      <Text style={styles.ghostNote}>
        {beat
          ? `You were ${fmtCpm(delta)} CPM faster than the pace you set last time.`
          : delta === 0
            ? 'Dead even with your best pace. Same pace, same score.'
            : `Your ghost was ${fmtCpm(delta)} CPM faster this time.`}
      </Text>
    </FadeIn>
  );
}

function GhostBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.max(8, Math.round((Math.max(0, value) / max) * 100));
  return (
    <View style={styles.ghostRow}>
      <Text style={styles.ghostLabel}>{label}</Text>
      <View style={styles.ghostTrack}>
        <View style={[styles.ghostFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.ghostValue, { color }]}>{fmtCpm(value)}</Text>
    </View>
  );
}

/** Native confetti for passed runs; skipped entirely under reduced motion. */
function Confetti({ active, pieces }: { active: boolean; pieces: number }) {
  const { width, height } = useWindowDimensions();
  const [done, setDone] = useState(false);
  const values = useRef(Array.from({ length: pieces }, () => new Animated.Value(0))).current;
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: ((i * 47) % 100) / 100,
        drift: ((i * 29) % 70) - 35,
        spin: (i % 2 ? 1 : -1) * (200 + ((i * 37) % 400)),
        color: [C.green, C.gold, C.blue, C.beet, C.red, C.orange][i % 6],
        delay: (i % 13) * 30,
        fall: 0.72 + ((i * 11) % 35) / 100,
        size: 6 + (i % 3) * 2,
      })),
    [pieces],
  );

  useEffect(() => {
    if (!active) {
      setDone(true);
      return;
    }
    setDone(false);
    values.forEach((v) => v.setValue(0));
    const anim = Animated.parallel(
      values.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 1500,
          delay: 160 + bits[i].delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    anim.start(({ finished }) => finished && setDone(true));
    return () => anim.stop();
  }, [active, bits, values]);

  if (!active || done) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bits.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -16,
            left: b.left * width,
            width: b.size,
            height: b.size * 1.6,
            borderRadius: 2,
            backgroundColor: b.color,
            opacity: values[i].interpolate({ inputRange: [0, 0.04, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: values[i].interpolate({ inputRange: [0, 1], outputRange: [0, height * b.fall] }) },
              { translateX: values[i].interpolate({ inputRange: [0, 1], outputRange: [0, b.drift] }) },
              { rotate: values[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${b.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
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
    width: '47%',
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
  ghostCard: {
    width: '100%',
    marginTop: 20,
    padding: 16,
    borderRadius: R.lg,
    borderWidth: 2,
    borderColor: C.gemLine,
    backgroundColor: C.gemBg,
    gap: 10,
  },
  ghostHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  ghostIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  ghostTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.graphite },
  ghostBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, backgroundColor: C.paper },
  ghostBadgeWin: { backgroundColor: C.green },
  ghostBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7, color: C.gemInk },
  ghostBadgeTextWin: { color: C.paper },
  ghostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ghostLabel: { width: 42, fontSize: 12, fontWeight: '700', color: C.ash },
  ghostTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(123,63,209,0.12)', overflow: 'hidden' },
  ghostFill: { height: 10, borderRadius: 5 },
  ghostValue: { width: 46, textAlign: 'right', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  ghostNote: { ...T.tiny, fontSize: 12, lineHeight: 17, marginTop: 2 },
});
