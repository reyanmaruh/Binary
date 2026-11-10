import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeartsModal } from '../components/Modals';
import { Btn, Chip, ProgressBar } from '../components/UI';
import { CONFIG, LESSONS } from '../data/curriculum';
import type { Nav } from '../navigation';
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
    if (mode === 'weak' && items.length === 0) {
      Alert.alert('Nothing to review yet', 'Miss a few questions in a lesson first.', [
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
    } else {
      s.combo = 0;
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

  if (phase === 'theory') {
    const t = lesson.theory[theoryIndex];
    const lastTheory = theoryIndex === lesson.theory.length - 1;
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.theoryTop}>
          <Pressable style={styles.iconBtn} onPress={() => (theoryIndex > 0 ? setTheoryIndex(theoryIndex - 1) : quit())} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={C.graphite} />
          </Pressable>
          <View style={styles.dots}>
            {lesson.theory.map((_, i) => (
              <View key={i} style={[styles.dot, i === theoryIndex ? styles.dotOn : null]} />
            ))}
          </View>
          <Pressable style={styles.iconBtn} onPress={quit} accessibilityLabel="Quit lesson">
            <Ionicons name="close" size={22} color={C.graphite} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.theoryBody}>
          <View style={styles.theoryCard}>
            <Text style={T.label}>Lesson {lesson.id} · {lesson.title}</Text>
            <Text style={[T.h1, { marginTop: 6 }]}>{t.heading}</Text>
            <Text style={[T.body, { marginTop: 10 }]}>{t.body}</Text>
            <View style={styles.visual}>
              <Ionicons name="sparkles" size={26} color={C.greenDark} />
              <Text style={styles.visualText}>{t.visual}</Text>
            </View>
            <View style={styles.takeaway}>
              <Ionicons name="bulb" size={14} color={C.greenDark} />
              <Text style={styles.takeawayText}>{t.takeaway}</Text>
            </View>
          </View>
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
    <View style={{ flex: 1 }}>
      <View style={styles.top}>
        <Pressable style={styles.iconBtn} onPress={quit} accessibilityLabel="Quit session">
          <Ionicons name="close" size={22} color={C.graphite} />
        </Pressable>
        <View style={{ flex: 1 }}>
          {mode === 'boss' ? (
            <View style={styles.bossRow}>
              <ProgressBar ratio={bossLeft / CONFIG.bossDurationSec} height={14} fill={bossLeft <= 10 ? C.red : C.green} />
              <Text style={styles.timerText}>{fmtCountdown(bossLeft * 1000)}</Text>
            </View>
          ) : (
            <View style={styles.segments}>
              {items.map((_, i) => (
                <View key={i} style={[styles.segment, i < index ? styles.segmentDone : null, i === index ? styles.segmentNow : null]} />
              ))}
            </View>
          )}
        </View>
        <Pressable style={styles.heartsChip} onPress={() => setHeartsModal(true)} accessibilityLabel={`${hearts} hearts. Open refill timer`}>
          <Ionicons name={hearts > 0 ? 'heart' : 'heart-outline'} size={16} color={C.red} />
          <Text style={styles.heartsChipText}>{hearts}</Text>
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Chip icon="sparkles" label={`${xp} XP`} tone="green" />
        {state.settings.reducedMotion ? null : <Chip icon="flash" label={`${stats.current.maxCombo} combo`} />}
        {mode === 'flash' ? <Chip icon="timer" label="1.5s" tone="red" /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.questionBody} keyboardShouldPersistTaps="handled">
        {item ? (
          <Question key={`${index}-${attemptKey}`} item={item} onSubmit={handleAnswer} />
        ) : (
          <Text style={T.body}>No items in this session.</Text>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {feedback ? (
        <View style={[styles.feedback, feedback.correct ? styles.feedbackGood : styles.feedbackBad]}>
          <View style={styles.feedbackHead}>
            <Ionicons name={feedback.correct ? 'checkmark-circle' : 'close-circle'} size={24} color={feedback.correct ? C.greenDark : C.red} />
            <Text style={[styles.feedbackTitle, { color: feedback.correct ? C.greenDark : C.red }]}>
              {feedback.correct ? 'Correct!' : outOfHearts ? 'Out of hearts' : 'Not quite'}
            </Text>
          </View>
          <Text style={styles.feedbackText}>{outOfHearts ? 'Hearts refill over time. Practice never costs hearts.' : feedback.text}</Text>
          <Btn label={outOfHearts ? 'See results' : index + 1 >= total ? 'See results' : 'Continue'} onPress={advance} />
        </View>
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
  theoryTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.swan },
  dotOn: { backgroundColor: C.green, width: 18 },
  theoryBody: { padding: 16, paddingBottom: 40 },
  theoryCard: { borderWidth: 2, borderColor: C.swan, borderRadius: R.lg, backgroundColor: C.paper, padding: 22 },
  visual: { minHeight: 130, borderRadius: R.md, backgroundColor: C.polar, borderWidth: 2, borderColor: C.swan, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 16 },
  visualText: { ...T.tiny, textAlign: 'center', lineHeight: 17 },
  takeaway: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.eelLight, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 16 },
  takeawayText: { fontSize: 12.5, fontWeight: '800', color: C.greenDark, flexShrink: 1 },
  foot: { padding: 16, borderTopWidth: 2, borderTopColor: C.swan, backgroundColor: C.paper },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 12, borderRadius: 6, backgroundColor: C.swan },
  segmentDone: { backgroundColor: C.green },
  segmentNow: { backgroundColor: '#cfe9b8' },
  bossRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { fontSize: 12, fontWeight: '800', color: C.graphite, fontVariant: ['tabular-nums'] },
  heartsChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 2, borderColor: C.swan, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  heartsChipText: { fontSize: 14, fontWeight: '800', color: C.red },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  questionBody: { padding: 16, paddingTop: 18 },
  feedback: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 2, padding: 18, paddingBottom: 26, gap: 10 },
  feedbackGood: { backgroundColor: '#effbe3', borderTopColor: '#cdeab3' },
  feedbackBad: { backgroundColor: '#fff0f0', borderTopColor: '#ffd1d1' },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackTitle: { fontSize: 19, fontWeight: '800' },
  feedbackText: { ...T.body, fontSize: 14 },
});
