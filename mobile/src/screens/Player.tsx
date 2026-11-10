import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { HeartsModal } from '../components/Modals';
import { Text } from '../components/Text';
import { Btn, Chip, ProgressBar } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import type { Nav } from '../navigation';
import { FadeIn, Press3D, Tap, useBump, useFloat, usePop } from '../motion';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import type { AppState, Item, Mode } from '../types';
import { fmtCountdown, itemKey, toBin } from '../utils';
import { Question } from '../components/Question';

interface Params {
  lessonId?: string;
  mode: Mode;
}

function buildItems(lesson: (typeof LESSONS)[number], mode: Mode, state: AppState): Item[] {
  if (mode === 'boss') {
    const out: Item[] = [];
    for (let i = 0; i < 80; i++) {
      const value = Math.floor(Math.random() * 254) + 1;
      out.push(i % 2 === 0 ? { type: 'TAP', value } : { type: 'NUM', direction: 'bin2dec', bits: toBin(value), autoSubmit: false });
    }
    return out;
  }
  if (mode === 'weak') {
    const keys = Object.keys(state.srs).filter((k) => state.srs[k].errorCount > 0);
    const all = LESSONS.flatMap((l) => l.items).filter((it) => keys.includes(itemKey(it)));
    return all.slice(0, 15);
  }
  if (mode === 'flash') return lesson.items.slice(0, 15);
  return lesson.items;
}

function Segment({ done, now }: { done: boolean; now: boolean }) {
  const fill = useRef(new Animated.Value(done ? 1 : 0)).current;
  useEffect(() => {
    if (!done) {
      fill.setValue(0);
      return;
    }
    Animated.spring(fill, { toValue: 1, useNativeDriver: false, friction: 8, tension: 120 }).start();
  }, [done, fill]);
  return (
    <View style={[styles.segment, now ? styles.segmentNow : null]}>
      <Animated.View
        style={[
          styles.segmentFill,
          { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

function Feedback({
  correct,
  title,
  text,
  xp,
  label,
  onNext,
}: {
  correct: boolean;
  title: string;
  text: string;
  xp: number;
  label: string;
  onNext: () => void;
}) {
  const rise = useRef(new Animated.Value(1)).current;
  const xpScale = usePop(`${xp}-${title}`, 0.6);
  useEffect(() => {
    Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }).start();
  }, [rise]);
  return (
    <Animated.View
      style={[
        styles.feedback,
        correct ? styles.feedbackGood : styles.feedbackBad,
        { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }) }] },
      ]}
    >
      <View style={styles.feedbackHead}>
        <View style={styles.feedbackIcon}>
          <Ionicons name={correct ? 'checkmark' : 'close'} size={22} color={correct ? C.greenDark : C.redDark} />
        </View>
        <Text style={[styles.feedbackTitle, { color: correct ? C.greenDark : C.redDark }]}>{title}</Text>
        {xp > 0 ? (
          <Animated.View style={[styles.xpPill, xpScale]}>
            <Ionicons name="sparkles" size={15} color={C.goldDark} />
            <Text style={styles.xpPillText}>+{xp} XP</Text>
          </Animated.View>
        ) : null}
      </View>
      <Text style={[styles.feedbackText, { color: correct ? C.greenDark : C.redDark }]}>{text}</Text>
      <View style={{ marginTop: 18 }}>
        <Btn label={label} onPress={onNext} />
      </View>
    </Animated.View>
  );
}

export function PlayerScreen({ params, nav }: { params: Params; nav: Nav }) {
  const { state, finishSession, loseHeart, addMiss } = useStore();
  const lesson = LESSONS.find((l) => l.id === params.lessonId) || LESSONS[0];
  const mode = params.mode;
  const [items] = useState<Item[]>(() => buildItems(lesson, mode, state));

  const [phase, setPhase] = useState<'theory' | 'items'>(mode === 'lesson' ? 'theory' : 'items');
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [hearts, setHearts] = useState(state.hearts);
  const [xp, setXp] = useState(0);
  const [heartsModal, setHeartsModal] = useState(false);
  const [bossLeft, setBossLeft] = useState<number>(CONFIG.bossDurationSec);
  const [flashLeft, setFlashLeft] = useState<number>(CONFIG.flashItemMs);
  const [combo, setCombo] = useState(0);

  const answered = useRef(false);
  const done = useRef(false);
  const stats = useRef({
    attempts: 0,
    correct: 0,
    convCorrect: 0,
    convMs: 0,
    combo: 0,
    maxCombo: 0,
    xp: 0,
    qStart: Date.now(),
    startedAt: Date.now(),
  });

  const item = items[index];
  const total = items.length;
  const xpScale = useBump(xp, 1.14);
  const heartBob = useFloat(hearts === 0, 3, 800);
  const feedbackPop = useRef(new Animated.Value(1)).current;

  const finish = (failed = false) => {
    if (done.current) return;
    done.current = true;
    const s = stats.current;
    const res = finishSession({
      mode,
      lessonId: mode === 'lesson' || mode === 'practice' ? lesson.id : undefined,
      attempts: s.attempts,
      correct: s.correct,
      convCorrect: s.convCorrect,
      convMs: s.convMs,
      combo: s.maxCombo,
      answerXp: s.xp,
      failed,
    });
    nav.replace('results', res);
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if ((mode === 'lesson' || mode === 'boss' || mode === 'flash') && state.hearts <= 0) {
      Alert.alert('Out of hearts', `Hearts refill every ${CONFIG.heartsRefillMinutes} minutes.`, [
        { text: 'OK', onPress: () => nav.back() },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== 'boss' || phase !== 'items' || done.current) return;
    const id = setInterval(() => {
      setBossLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          finishRef.current(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mode, phase]);

  useEffect(() => {
    if (mode !== 'flash' || phase !== 'items' || feedback != null) return;
    setFlashLeft(CONFIG.flashItemMs);
    const id = setTimeout(() => {
      if (!answered.current) {
        handleAnswer(false, 'Time! 1.5 seconds per item — answer faster.');
      }
    }, CONFIG.flashItemMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, index, attemptKey]);

  const handleAnswer = (correct: boolean, explanation: string) => {
    if (answered.current || done.current) return;
    answered.current = true;
    const s = stats.current;
    const now = Date.now();
    s.attempts += 1;
    s.convMs += Math.min(now - s.qStart, 30000);
    if (correct) {
      s.correct += 1;
      s.convCorrect += 1;
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.xp += 1;
      setXp(s.xp);
      setCombo(s.combo);
      Animated.sequence([
        Animated.timing(feedbackPop, { toValue: 1.02, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(feedbackPop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 160 }),
      ]).start();
    } else {
      s.combo = 0;
      setCombo(0);
      addMiss(itemKey(item));
    }
    setFeedback({ correct, text: explanation });
    if (!correct) {
      const left = loseHeart();
      setHearts(left);
      if (left <= 0) setOutOfHearts(true);
    }
  };

  const advance = () => {
    if (outOfHearts) {
      finish(true);
      return;
    }
    if (index + 1 >= total) {
      finish(false);
      return;
    }
    setIndex(index + 1);
    setFeedback(null);
    answered.current = false;
    stats.current.qStart = Date.now();
    setAttemptKey((k) => k + 1);
  };

  const quit = () => {
    Alert.alert('Leave lesson?', 'Your progress in this session will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => nav.back() },
    ]);
  };

  const nextIn = Math.max(0, CONFIG.heartsRefillMinutes * 60000 - (Date.now() - state.heartsRefilledAt));
  const progress = total > 0 ? index / total : 0;
  const reduced = state.settings.reducedMotion;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={styles.emptyTitle}>Nothing to review yet</Text>
        <Text style={[T.body, { textAlign: 'center' }]}>
          Miss a few questions in a lesson first — those items show up here for spaced repetition.
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Btn label="Back" onPress={() => nav.back()} />
        </View>
      </View>
    );
  }

  if (phase === 'theory') {
    const t = lesson.theory[theoryIndex];
    const lastTheory = theoryIndex === lesson.theory.length - 1;
    return (
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        <View style={styles.theoryTop}>
          <Tap
            onPress={() => (theoryIndex > 0 ? setTheoryIndex(theoryIndex - 1) : quit())}
            accessibilityLabel="Back"
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={20} color={C.graphite} />
          </Tap>
          <View style={styles.dots}>
            {lesson.theory.map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  i === theoryIndex ? styles.dotOn : null,
                ]}
              />
            ))}
          </View>
          <Tap onPress={quit} accessibilityLabel="Quit lesson" style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={C.ash} />
          </Tap>
        </View>
        <ScrollView contentContainerStyle={styles.theoryBody}>
          <FadeIn key={`${theoryIndex}`} from={12} enabled={!reduced}>
            <View style={styles.theoryCard}>
              <Text style={styles.theoryKicker}>
                Lesson {lesson.id} · {lesson.title}
              </Text>
              <Text style={styles.theoryTitle}>{t.heading}</Text>
              <Text style={styles.theoryBodyText}>{t.body}</Text>
              <View style={styles.visual}>
                <Ionicons name="bulb" size={26} color={C.greenDark} />
                <Text style={styles.visualText}>{t.visual}</Text>
              </View>
              <View style={styles.takeaway}>
                <Ionicons name="bulb" size={15} color={C.greenDark} />
                <Text style={styles.takeawayText}>{t.takeaway}</Text>
              </View>
            </View>
          </FadeIn>
        </ScrollView>
        <View style={styles.foot}>
          <Btn
            label={lastTheory ? 'Start questions' : 'Continue'}
            onPress={() => {
              if (lastTheory) {
                setPhase('items');
                stats.current.qStart = Date.now();
              } else setTheoryIndex(theoryIndex + 1);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={styles.topWrap}>
        <View style={styles.top}>
          <Tap onPress={quit} accessibilityLabel="Quit session" style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={C.ash} />
          </Tap>
          <View style={{ flex: 1 }}>
            {mode === 'boss' ? (
              <View style={styles.bossRow}>
                <ProgressBar ratio={bossLeft / CONFIG.bossDurationSec} height={14} fill={bossLeft <= 10 ? C.red : C.green} />
                <Text style={styles.timerText}>{fmtCountdown(bossLeft * 1000)}</Text>
              </View>
            ) : (
              <View style={styles.segments}>
                {items.map((_, i) => (
                  <Segment key={i} done={i < index} now={i === index} />
                ))}
              </View>
            )}
          </View>
          <Animated.View style={hearts === 0 ? heartBob : undefined}>
            <Tap
              onPress={() => setHeartsModal(true)}
              accessibilityLabel={`${hearts} hearts. Open refill timer`}
              style={[styles.heartsChip, hearts === 0 ? styles.heartsLow : null]}
            >
              <Ionicons name={hearts > 0 ? 'heart' : 'heart-outline'} size={16} color={C.red} />
              <Text style={styles.heartsChipText}>{hearts}</Text>
            </Tap>
          </Animated.View>
        </View>

        <View style={styles.metaRow}>
          <Animated.View style={{ transform: [{ scale: xpScale }] }}>
            <Chip icon="sparkles" label={`${xp} XP`} tone="green" />
          </Animated.View>
          {reduced ? null : <Chip icon="flash" label={`${combo} combo`} tone={combo > 0 ? 'orange' : 'neutral'} />}
          {mode === 'flash' ? <Chip icon="timer" label="1.5s" tone="red" /> : null}
        </View>
      </View>

      <Animated.View style={{ flex: 1, transform: [{ scale: feedbackPop }] }}>
        <ScrollView contentContainerStyle={styles.questionBody} keyboardShouldPersistTaps="handled">
          {item ? <Question key={`${index}-${attemptKey}`} item={item} onSubmit={handleAnswer} /> : null}
          <View style={{ height: 160 }} />
        </ScrollView>
      </Animated.View>

      {mode === 'flash' && !feedback ? (
        <View style={styles.flashWrap}>
          <Chip icon="timer" label="Flash round" tone="orange" />
        </View>
      ) : null}

      {feedback ? (
        <Feedback
          key={`${index}-${attemptKey}`}
          correct={feedback.correct}
          title={feedback.correct ? 'Correct!' : outOfHearts ? 'Out of hearts' : 'Not quite'}
          text={outOfHearts ? 'Hearts refill over time. Practice never costs hearts.' : feedback.text}
          xp={feedback.correct ? 1 : 0}
          label={outOfHearts ? 'See results' : index + 1 >= total ? 'See results' : 'Continue'}
          onNext={advance}
        />
      ) : null}

      <HeartsModal
        visible={heartsModal}
        onClose={() => setHeartsModal(false)}
        hearts={hearts}
        gems={state.gems}
        nextIn={nextIn}
        onRefill={() => {
          Alert.alert('Refill hearts', 'Open the gem shop from the top bar to refill.');
        }}
        onOpenShop={() => {
          setHeartsModal(false);
          nav.tab('home');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  theoryTop: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, marginBottom: 4 },
  iconBtn: { padding: 8, borderRadius: R.md },
  dots: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.swan },
  dotOn: { backgroundColor: C.green, width: 10, height: 10, marginTop: -1 },
  theoryBody: { padding: 16, paddingBottom: 48 },
  theoryCard: {
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    padding: 24,
    shadowColor: C.swan,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
  theoryKicker: { ...T.label },
  emptyTitle: { ...T.h2, textAlign: 'center' },
  theoryTitle: { fontSize: 28, fontWeight: '700', color: C.graphite, letterSpacing: -0.9, lineHeight: 33, marginTop: 6, marginBottom: 12 },
  theoryBodyText: { fontSize: 16, fontWeight: '500', color: C.ash, lineHeight: 26 },
  visual: {
    minHeight: 154,
    borderRadius: R.md,
    backgroundColor: C.polar,
    borderWidth: 2,
    borderColor: C.swan,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    marginVertical: 20,
  },
  visualText: { fontSize: 13, fontWeight: '500', color: C.ash, textAlign: 'center', lineHeight: 19 },
  takeaway: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.eelLight,
    borderRadius: R.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  takeawayText: { fontSize: 13, fontWeight: '700', color: C.greenDark, flexShrink: 1, lineHeight: 18 },
  foot: { padding: 16, paddingBottom: 24, borderTopWidth: 2, borderTopColor: C.swan, backgroundColor: C.paper },
  topWrap: { paddingHorizontal: 16, paddingTop: 12 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.lg,
    backgroundColor: C.paper,
    shadowColor: C.swan,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: 2, height: 16, borderRadius: R.pill, overflow: 'hidden' },
  segment: { flex: 1, backgroundColor: C.swan, overflow: 'hidden' },
  segmentNow: { backgroundColor: '#cfcfcf' },
  segmentFill: { height: '100%', backgroundColor: C.green },
  bossRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { fontSize: 13, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
  heartsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heartsLow: { backgroundColor: C.heartPale },
  heartsChipText: { fontSize: 16, fontWeight: '700', color: C.red, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, minHeight: 28 },
  questionBody: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },
  flashWrap: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  feedback: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  feedbackGood: { backgroundColor: C.eelLight, borderTopColor: C.lime },
  feedbackBad: { backgroundColor: C.redPale, borderTopColor: C.red },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  feedbackIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, flexShrink: 1 },
  xpPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderColor: 'rgba(88,204,2,0.25)',
    borderRadius: R.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  xpPillText: { fontSize: 15, fontWeight: '700', color: C.greenDark, fontVariant: ['tabular-nums'] },
  feedbackText: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
});
