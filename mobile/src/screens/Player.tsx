import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound } from '../audio';
import { ConfirmModal, HeartsModal, InfoModal, ShopModal } from '../components/Modals';
import { StickyActionProvider, type StickyAction } from '../components/QuestionActions';
import { TheoryVisual } from '../components/TheoryVisual';
import { Text } from '../components/Text';
import { Btn, Chip, ProgressBar } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import type { Nav } from '../navigation';
import { FadeIn, Press3D, Tap, useBump, useFloat, usePop } from '../motion';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import type { AppState, Item, Mode } from '../types';
import { fmtCountdown, itemKey, shuffle, toBin } from '../utils';
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
  if (mode === 'practice') return shuffle(lesson.items).slice(0, Math.min(12, lesson.items.length));
  return lesson.items.slice(0, CONFIG.sessionItemCap);
}

function Segment({ done, now }: { done: boolean; now: boolean }) {
  const fill = useRef(new Animated.Value(done ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const was = useRef(done);
  useEffect(() => {
    if (!done) {
      fill.setValue(0);
      was.current = false;
      return;
    }
    Animated.spring(fill, { toValue: 1, useNativeDriver: false, friction: 8, tension: 120 }).start();
    if (!was.current) {
      was.current = true;
      pop.setValue(1);
      Animated.sequence([
        Animated.timing(pop, { toValue: 1.3, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 140 }),
      ]).start();
    }
  }, [done, fill, pop]);
  return (
    <Animated.View style={[styles.segment, now ? styles.segmentNow : null, { transform: [{ scaleY: pop }] }]}>
      <Animated.View
        style={[
          styles.segmentFill,
          { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </Animated.View>
  );
}

function FlashBar({ itemKey: key }: { itemKey: string }) {
  const w = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    w.setValue(1);
    Animated.timing(w, {
      toValue: 0,
      duration: CONFIG.flashItemMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [key, w]);
  return (
    <View style={styles.flashBar}>
      <Animated.View style={[styles.flashFill, { transform: [{ scaleX: w }] }]} />
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
  bottomInset = 0,
}: {
  correct: boolean;
  title: string;
  text: string;
  xp: number;
  label: string;
  onNext: () => void;
  bottomInset?: number;
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
        { paddingBottom: 28 + Math.max(bottomInset, 0) },
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
  const { state, finishSession, loseHeart, addMiss, refillWithGems, buyOneHeart } = useStore();
  const insets = useSafeAreaInsets();
  const lesson = LESSONS.find((l) => l.id === params.lessonId) || LESSONS[0];
  const mode = params.mode;
  const [items] = useState<Item[]>(() => buildItems(lesson, mode, state));

  const showsTheory = mode === 'lesson' || mode === 'ghost';
  const [phase, setPhase] = useState<'theory' | 'items'>(showsTheory ? 'theory' : 'items');
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [hearts, setHearts] = useState(state.hearts);
  const [xp, setXp] = useState(0);
  const [heartsModal, setHeartsModal] = useState(false);
  const [shopModal, setShopModal] = useState(false);
  const [bossLeft, setBossLeft] = useState<number>(CONFIG.bossDurationSec);
  const [elapsed, setElapsed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [ghostFrac, setGhostFrac] = useState(0);
  const [stickyAction, setStickyAction] = useState<StickyAction | null>(null);
  const [quitAsk, setQuitAsk] = useState(false);
  const [heartBlocked, setHeartBlocked] = useState(mode === 'lesson' && state.hearts <= 0);

  const answered = useRef(false);
  const done = useRef(false);
  const startedAt = useRef(Date.now());
  const stats = useRef({
    attempts: 0,
    correct: 0,
    convCorrect: 0,
    convMs: 0,
    combo: 0,
    maxCombo: 0,
    xp: 0,
    qStart: Date.now(),
  });

  const item = items[index];
  const total = items.length;
  const xpScale = useBump(xp, 1.14);
  const heartBob = useFloat(hearts === 0, 3, 800);
  const feedbackPop = useRef(new Animated.Value(1)).current;
  const ghostCpm = mode === 'ghost' ? state.lessons[lesson.id]?.bestCpm ?? null : null;
  const multiplier = combo >= 4 ? CONFIG.comboMaxMultiplier : combo === 3 ? 2 : combo === 2 ? 1.5 : 1;

  useEffect(() => {
    setHearts(state.hearts);
  }, [state.hearts]);

  const finish = (failed = false) => {
    if (done.current) return;
    done.current = true;
    const s = stats.current;
    const res = finishSession({
      mode,
      lessonId: mode === 'lesson' || mode === 'practice' || mode === 'ghost' ? lesson.id : undefined,
      attempts: s.attempts,
      correct: s.correct,
      convCorrect: s.convCorrect,
      convMs: s.convMs,
      combo: s.maxCombo,
      answerXp: s.xp,
      ghostCpm: mode === 'ghost' ? ghostCpm : null,
      failed,
    });
    nav.replace('results', res);
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (mode === 'boss' && phase === 'items') playSound('bossStart');
  }, [mode, phase]);

  useEffect(() => {
    if (mode === 'boss' && phase === 'items' && bossLeft > 0 && bossLeft <= 10) playSound('bossTick');
  }, [bossLeft, mode, phase]);

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
    if (phase !== 'items' || mode === 'boss') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, mode]);

  useEffect(() => {
    if (!ghostCpm || phase !== 'items' || done.current) return;
    const totalMs = (total / ghostCpm) * 60000;
    const id = setInterval(() => {
      const frac = Math.max(0, Math.min(1, (Date.now() - startedAt.current) / totalMs));
      setGhostFrac(frac);
    }, 250);
    return () => clearInterval(id);
  }, [ghostCpm, phase, total]);

  useEffect(() => {
    if (mode !== 'flash' || phase !== 'items' || feedback != null) return;
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
    const timeMs = now - s.qStart;
    s.attempts += 1;
    if (correct) {
      s.correct += 1;
      s.convCorrect += 1;
      s.convMs += Math.min(timeMs, 30000);
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.xp += 1;
      setXp(s.xp);
      setCombo(s.combo);
      playSound('correct');
      if (s.combo >= 2) playSound('comboUp');
      if (s.combo === 4) playSound('streakMilestone');
      Animated.sequence([
        Animated.timing(feedbackPop, { toValue: 1.02, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(feedbackPop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 160 }),
      ]).start();
    } else {
      s.combo = 0;
      setCombo(0);
      addMiss(itemKey(item));
      playSound('wrong');
    }
    setFeedback({ correct, text: explanation });
    if (!correct && mode === 'lesson') {
      const left = loseHeart();
      setHearts(left);
      playSound('heartLoss');
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

  const quit = () => setQuitAsk(true);

  const quitTitle =
    mode === 'lesson' ? 'Leave lesson?' : mode === 'practice' ? 'Leave practice?' : mode === 'ghost' ? 'Leave ghost race?' : 'Leave session?';
  const quitBody =
    mode === 'practice'
      ? 'Your progress in this practice run will be lost. Hearts are safe — practice never costs them.'
      : 'Your progress in this session will be lost. Hearts already spent stay spent.';

  const nextIn = Math.max(0, CONFIG.heartsRefillMinutes * 60000 - (Date.now() - state.heartsRefilledAt));
  const reduced = state.settings.reducedMotion;
  const showTimer = mode === 'boss' || mode === 'flash' || (mode === 'lesson' && !!lesson.scaffold.timer);
  const ghostAhead = items.length > 0 && index / items.length >= ghostFrac;

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
      <>
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
              <View key={i} style={[styles.dot, i === theoryIndex ? styles.dotOn : null]} />
            ))}
          </View>
          <Tap onPress={quit} accessibilityLabel="Quit lesson" style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={C.ash} />
          </Tap>
        </View>
        <ScrollView contentContainerStyle={[styles.theoryBody, { paddingBottom: 40 + Math.max(insets.bottom, 0) }]}>
          <FadeIn key={`${theoryIndex}`} from={12} enabled={!reduced}>
            <View style={styles.theoryCard}>
              <Text style={styles.theoryKicker}>
                Lesson {lesson.id} · {lesson.title}
              </Text>
              <Text style={styles.theoryTitle}>{t.heading}</Text>
              <Text style={styles.theoryBodyText}>{t.body}</Text>
              <View style={styles.visual}>
                <TheoryVisual hint={t.visual} reduced={reduced} />
              </View>
              <View style={styles.takeaway}>
                <Ionicons name="bulb" size={15} color={C.greenDark} />
                <Text style={styles.takeawayText}>{t.takeaway}</Text>
              </View>
            </View>
          </FadeIn>
        </ScrollView>
        <View style={[styles.foot, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}>
          <Btn
            label={lastTheory ? 'Start questions' : 'Continue'}
            onPress={() => {
              if (lastTheory) {
                setPhase('items');
                startedAt.current = Date.now();
                stats.current.qStart = Date.now();
              } else setTheoryIndex(theoryIndex + 1);
            }}
          />
        </View>
      </View>
      <ConfirmModal
        visible={quitAsk}
        title={quitTitle}
        body={quitBody}
        icon="exit-outline"
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setQuitAsk(false);
          nav.back();
        }}
        onCancel={() => setQuitAsk(false)}
        onClose={() => setQuitAsk(false)}
      />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topWrap}>
        <View style={styles.top}>
          <Tap onPress={quit} accessibilityLabel="Quit session" style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#b9b9b9" />
          </Tap>
          <View style={{ flex: 1 }} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
            {mode === 'boss' ? (
              <View style={{ height: 16 }}>
                <ProgressBar ratio={bossLeft / CONFIG.bossDurationSec} height={16} fill={bossLeft <= 10 ? C.red : C.green} />
              </View>
            ) : (
              <View style={styles.segments}>
                {items.map((_, i) => (
                  <Segment key={i} done={i < index} now={i === index} />
                ))}
              </View>
            )}
            {ghostCpm && barWidth > 0 ? (
              <View style={[styles.ghost, { left: ghostFrac * barWidth - 9 }]} pointerEvents="none">
                <MaterialCommunityIcons name="ghost" size={18} color={ghostAhead ? C.greenDark : C.orange} />
              </View>
            ) : null}
          </View>
          <Animated.View style={hearts === 0 ? heartBob : undefined}>
            <Tap
              onPress={() => setHeartsModal(true)}
              accessibilityLabel={`${hearts} of ${CONFIG.heartsMax} hearts. Open the refill timer`}
              style={[styles.heartsChip, hearts === 0 ? styles.heartsLow : null]}
            >
              <Ionicons name={hearts > 0 ? 'heart' : 'heart-outline'} size={16} color={C.red} />
              <Text style={styles.heartsChipText}>{hearts}</Text>
            </Tap>
          </Animated.View>
        </View>

        <View style={styles.metaRow}>
          {combo >= 2 ? (
            <Chip
              icon="flame"
              label={`${multiplier % 1 === 0 ? multiplier : multiplier.toFixed(1)}×`}
              tone="orange"
            />
          ) : null}
          {showTimer ? (
            <Chip
              icon="timer"
              label={mode === 'boss' ? `${bossLeft}s` : fmtCountdown(elapsed * 1000)}
              tone={mode === 'boss' && bossLeft <= 10 ? 'red' : 'neutral'}
            />
          ) : null}
          <Animated.View style={{ transform: [{ scale: xpScale }] }}>
            <Chip icon="sparkles" label={`${xp} XP`} tone="green" />
          </Animated.View>
          {ghostCpm ? (
            <View style={styles.ghostPill}>
              <MaterialCommunityIcons name="ghost" size={13} color={C.gemInk} />
              <Text style={styles.ghostPillText}>vs you · {ghostCpm.toFixed(1)} CPM</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Animated.View style={{ flex: 1, transform: [{ scale: feedbackPop }] }}>
        <ScrollView contentContainerStyle={styles.questionBody} keyboardShouldPersistTaps="handled">
          {mode === 'flash' && !feedback ? <FlashBar key={`${index}-${attemptKey}`} itemKey={`${index}-${attemptKey}`} /> : null}
          <StickyActionProvider setAction={setStickyAction}>
            {item ? <Question key={`${index}-${attemptKey}`} item={item} onSubmit={handleAnswer} /> : null}
          </StickyActionProvider>
          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>

      {!feedback && stickyAction ? (
        <View style={[styles.stickyFoot, { paddingBottom: 16 + Math.max(insets.bottom, 0) }]}>
          <Btn label={stickyAction.label} disabled={stickyAction.disabled} onPress={stickyAction.onPress} />
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
          bottomInset={insets.bottom}
        />
      ) : null}

      <HeartsModal
        visible={heartsModal}
        onClose={() => setHeartsModal(false)}
        hearts={hearts}
        gems={state.gems}
        nextIn={nextIn}
        onRefill={() => {
          if (refillWithGems()) playSound('levelUp');
        }}
        onOpenShop={() => {
          setHeartsModal(false);
          setShopModal(true);
        }}
      />

      <ShopModal
        visible={shopModal}
        onClose={() => setShopModal(false)}
        gems={state.gems}
        hearts={hearts}
        onBuy={(kind) => {
          const ok = kind === 'full' ? refillWithGems() : buyOneHeart();
          playSound(ok ? 'levelUp' : 'wrong');
        }}
      />

      <ConfirmModal
        visible={quitAsk}
        title={quitTitle}
        body={quitBody}
        icon="exit-outline"
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setQuitAsk(false);
          nav.back();
        }}
        onCancel={() => setQuitAsk(false)}
        onClose={() => setQuitAsk(false)}
      />

      <InfoModal
        visible={heartBlocked}
        title="Out of hearts"
        body={`Hearts refill every ${CONFIG.heartsRefillMinutes} minutes. Refill with gems now, or practice without spending hearts.`}
        icon="heart-dislike-outline"
        primaryLabel="Refill hearts"
        onPrimary={() => {
          setHeartBlocked(false);
          setHeartsModal(true);
        }}
        onClose={() => {
          setHeartBlocked(false);
          nav.back();
        }}
      />
    </KeyboardAvoidingView>
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
    paddingVertical: 10,
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
  segmentNow: { backgroundColor: '#f0f0f0' },
  segmentFill: { height: '100%', backgroundColor: C.green },
  ghost: { position: 'absolute', top: -22, width: 20, alignItems: 'center' },
  ghostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: R.pill,
    backgroundColor: C.gemBg,
    borderWidth: 2,
    borderColor: C.gemLine,
  },
  ghostPillText: { fontSize: 12, fontWeight: '700', color: C.gemInk, letterSpacing: 0.3 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingTop: 10, minHeight: 28 },
  questionBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  stickyFoot: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: C.paper,
    borderTopWidth: 2,
    borderTopColor: C.swan,
  },
  flashBar: { height: 6, borderRadius: 3, backgroundColor: C.swan, overflow: 'hidden', marginBottom: 12 },
  flashFill: { height: 6, borderRadius: 3, backgroundColor: C.orange, width: '100%' },
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
