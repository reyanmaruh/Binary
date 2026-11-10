import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CONFIG } from '../data/curriculum';
import { Press3D, Tap } from '../motion';
import { C, R, T } from '../theme';
import type { Lesson } from '../types';
import { fmtCountdown } from '../utils';
import { Text } from './Text';
import { Btn, Chip } from './UI';

/** Bottom sheet with the web's spring rise and a fading backdrop. */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [rendered, setRendered] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 9, tension: 90 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 1, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, fade, rise]);

  if (!rendered) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, 520] }) }] },
          ]}
        >
          <View style={styles.grabber} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 4 }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function HeartTank({ state }: { state: 'full' | 'next' | 'empty' }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'next') {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, bob]);
  const filled = state === 'full';
  return (
    <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }) }] }}>
      <View
        style={[
          styles.tank,
          { backgroundColor: filled ? C.red : C.paper, borderColor: filled ? C.redDark : state === 'next' ? C.red : C.swan },
        ]}
      >
        <Ionicons name="heart" size={18} color={filled ? '#ffd7d7' : state === 'next' ? C.red : C.swan} />
      </View>
    </Animated.View>
  );
}

export function HeartsModal({
  visible,
  onClose,
  hearts,
  gems,
  nextIn,
  onRefill,
  onOpenShop,
}: {
  visible: boolean;
  onClose: () => void;
  hearts: number;
  gems: number;
  nextIn: number;
  onRefill: () => void;
  onOpenShop: () => void;
}) {
  const full = hearts >= CONFIG.heartsMax;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{hearts === 0 ? 'Out of hearts' : 'Hearts'}</Text>
      <View style={styles.tanks}>
        {Array.from({ length: CONFIG.heartsMax }).map((_, i) => (
          <HeartTank key={i} state={i < hearts ? 'full' : i === hearts ? 'next' : 'empty'} />
        ))}
      </View>
      <Text style={styles.timer}>{full ? 'Full' : fmtCountdown(nextIn)}</Text>
      <Text style={styles.timerLabel}>{full ? 'all hearts ready' : 'until your next heart'}</Text>
      <Text style={styles.note}>
        {hearts === 0
          ? `You have ${gems} gems. Refill now, or wait for the timer.`
          : `One heart every ${CONFIG.heartsRefillMinutes} minutes. You have ${gems} gems.`}
      </Text>
      <Text style={styles.always}>Practice never costs hearts.</Text>
      <View style={{ gap: 10, marginTop: 16 }}>
        <Btn label={full ? 'Hearts are full' : 'Refill · 50 gems'} disabled={full || gems < 50} onPress={onRefill} />
        <Btn label="Get gems" variant="secondary" onPress={onOpenShop} />
        <Btn label="Close" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function ShopModal({
  visible,
  onClose,
  gems,
  hearts,
  onBuy,
}: {
  visible: boolean;
  onClose: () => void;
  gems: number;
  hearts: number;
  onBuy: (kind: 'full' | 'one') => void;
}) {
  const full = hearts >= CONFIG.heartsMax;
  const rows: { kind: 'full' | 'one'; title: string; desc: string; price: number; disabled: boolean }[] = [
    {
      kind: 'full',
      title: 'Refill all hearts',
      desc: `Back to ${CONFIG.heartsMax} hearts right now`,
      price: 50,
      disabled: full || gems < 50,
    },
    { kind: 'one', title: 'One heart', desc: 'Skip the wait for a single heart', price: 20, disabled: full || gems < 20 },
  ];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Gem shop</Text>
      <View style={styles.balance}>
        <Ionicons name="diamond" size={18} color={C.beet} />
        <Text style={styles.balanceText}>{gems} gems</Text>
      </View>
      <View style={{ gap: 10 }}>
        {rows.map((row) => (
          <Press3D
            key={row.kind}
            disabled={row.disabled}
            onPress={() => onBuy(row.kind)}
            bg={C.paper}
            shadowColor={row.disabled ? 'transparent' : C.swan}
            radius={R.md}
            depth={3}
            accessibilityLabel={row.title}
            contentStyle={styles.shopItem}
          >
            <View style={styles.shopIco}>
              <Ionicons name="heart" size={18} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopTitle}>{row.title}</Text>
              <Text style={styles.shopDesc}>{row.desc}</Text>
            </View>
            <View style={styles.price}>
              <Ionicons name="diamond" size={14} color={C.beet} />
              <Text style={styles.priceText}>{row.price}</Text>
            </View>
          </Press3D>
        ))}
      </View>
      <Text style={styles.note}>
        Gems come from first clears and new personal bests. Hearts refill on their own every {CONFIG.heartsRefillMinutes}{' '}
        minutes.
      </Text>
      <View style={{ marginTop: 14 }}>
        <Btn label="Close" variant="secondary" onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function LessonSheet({
  lesson,
  visible,
  onClose,
  onStart,
  onPractice,
  stars,
  bestCpm,
  practiceBest,
  completed,
}: {
  lesson: Lesson | null;
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  onPractice: () => void;
  stars: number;
  bestCpm: number | null;
  practiceBest: number | null;
  completed: boolean;
}) {
  if (!lesson) return null;
  const missions = [
    { icon: 'flash' as const, label: 'Answer 5 in a row', hint: 'combo', done: false },
    { icon: 'speedometer' as const, label: 'Beat 10 CPM', hint: 'speed', done: bestCpm != null && bestCpm >= 10 },
    {
      icon: 'checkmark-circle' as const,
      label: `Pass practice ${Math.round(CONFIG.practiceGate * 100)}%`,
      hint: 'unlock',
      done: practiceBest != null && practiceBest >= CONFIG.practiceGate,
    },
  ];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.kicker}>
        Lesson {lesson.id}
        {completed ? ' · completed' : ''}
      </Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.sheetSub}>{lesson.subtitle}</Text>

      <View style={styles.missions}>
        {missions.map((m) => (
          <View key={m.label} style={[styles.mission, m.done ? styles.missionDone : null]}>
            <View style={[styles.missionIco, m.done ? styles.missionIcoDone : null]}>
              <Ionicons name={m.icon} size={17} color={m.done ? C.greenDark : C.ash} />
            </View>
            <Text style={styles.missionLabel}>{m.label}</Text>
            <Text style={[styles.missionHint, m.done ? { color: C.greenDark } : null]}>{m.hint}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chipRow}>
        <Chip icon="star" label={`${stars}/3`} tone="gold" />
        <Chip icon="speedometer" label={`${bestCpm == null ? '—' : bestCpm.toFixed(1)} CPM`} />
        <Chip
          icon="checkmark-circle"
          label={practiceBest == null ? 'Practice —' : `Practice ${Math.round(practiceBest * 100)}%`}
          tone={practiceBest != null && practiceBest >= CONFIG.practiceGate ? 'green' : 'neutral'}
        />
      </View>

      <Text style={styles.sheetConcept}>{lesson.newConcept}</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        <Btn label={completed ? 'Replay lesson' : 'Start lesson'} onPress={onStart} />
        {completed ? <Btn label="Practice" variant="secondary" onPress={onPractice} /> : null}
        <Btn label="Close" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function InfoModal({
  visible,
  title,
  body,
  icon = 'lock-closed',
  primaryLabel,
  onPrimary,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryLabel: string;
  onPrimary: () => void;
  onClose: () => void;
}) {
  const [rendered, setRendered] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 7, tension: 120 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(pop, { toValue: 0.94, duration: 150, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setRendered(false));
    }
  }, [visible, fade, pop]);

  if (!rendered) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.centerFill}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.dialog, { opacity: fade, transform: [{ scale: pop }] }]}>
          <View style={styles.dialogIcon}>
            <Ionicons name={icon} size={30} color={C.greenDark} />
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={{ gap: 10, width: '100%' }}>
            <Btn label={primaryLabel} onPress={onPrimary} />
            <Btn label="Close" variant="secondary" onPress={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  centerFill: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: C.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.swan, alignSelf: 'center', marginBottom: 16 },
  title: { ...T.h2, textAlign: 'center' },
  tanks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginTop: 18, marginBottom: 16 },
  tank: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: C.graphite, textAlign: 'center', fontVariant: ['tabular-nums'] },
  timerLabel: { ...T.label, textAlign: 'center', marginTop: 2 },
  note: { ...T.tiny, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  always: { fontSize: 12, fontWeight: '600', color: C.ash, textAlign: 'center', marginTop: 12 },
  balance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 12 },
  balanceText: { fontSize: 16, fontWeight: '700', color: C.beet },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.md,
    padding: 12,
    backgroundColor: C.paper,
  },
  shopIco: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.heartPale, alignItems: 'center', justifyContent: 'center' },
  shopTitle: { fontSize: 15, fontWeight: '700', color: C.graphite },
  shopDesc: { fontSize: 12.5, fontWeight: '500', color: C.ash, marginTop: 2 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 14, fontWeight: '700', color: C.beet, fontVariant: ['tabular-nums'] },
  kicker: { ...T.label, marginBottom: 4 },
  lessonTitle: { ...T.h1, fontSize: 24 },
  sheetSub: { ...T.body, marginTop: 2 },
  sheetConcept: { ...T.tiny, marginTop: 12, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  missions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  mission: {
    flex: 1,
    backgroundColor: C.polar,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  missionDone: { backgroundColor: '#f3fbea', borderColor: C.lime },
  missionIco: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  missionIcoDone: { backgroundColor: C.eelLight, borderColor: C.lime },
  missionLabel: { fontSize: 11.5, fontWeight: '700', color: C.graphite, textAlign: 'center', lineHeight: 14 },
  missionHint: { ...T.label, fontSize: 9, letterSpacing: 0.6, marginTop: 4 },
  dialog: {
    backgroundColor: C.paper,
    borderRadius: R.lg,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  dialogIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.eelLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dialogTitle: { ...T.h2, textAlign: 'center' },
  dialogBody: { ...T.body, textAlign: 'center', marginBottom: 16 },
});
