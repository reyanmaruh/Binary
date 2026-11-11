import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIG } from '../data/curriculum';
import { Press3D, Tap } from '../motion';
import { C, R, T } from '../theme';
import type { Lesson } from '../types';
import { fmtCountdown, pct } from '../utils';
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
  const insets = useSafeAreaInsets();
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
            { paddingBottom: 24 + Math.max(insets.bottom, 8) },
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
      <View style={styles.heartsCount}>
        <Ionicons name={hearts > 0 ? 'heart' : 'heart-outline'} size={13} color={C.red} />
        <Text style={styles.heartsCountText}>
          {hearts} of {CONFIG.heartsMax} hearts
        </Text>
      </View>
      <Text style={styles.timer}>{full ? 'Full' : fmtCountdown(nextIn)}</Text>
      <Text style={styles.timerLabel}>{full ? 'all hearts ready' : 'until your next heart'}</Text>
      <Text style={styles.note}>
        {full
          ? 'You are ready for a full lesson. Practice never costs hearts.'
          : hearts === 0
            ? `Refill now, or wait for the timer. You have ${gems} gems.`
            : `One heart every ${CONFIG.heartsRefillMinutes} minutes. You have ${gems} gems.`}
      </Text>
      {!full && gems < 50 ? (
        <Text style={styles.shortNote}>{50 - gems} more gems needed to refill.</Text>
      ) : null}
      <Text style={styles.always}>Practice never costs hearts.</Text>
      <View style={{ gap: 10, marginTop: 16 }}>
        <Btn label={full ? 'Hearts are full' : 'Refill · 50 gems'} disabled={full || gems < 50} onPress={onRefill} />
        <Btn label="Open gem shop" variant="secondary" onPress={onOpenShop} />
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
      <View style={styles.shopStatus}>
        <View style={styles.balance}>
          <Ionicons name="diamond" size={18} color={C.beet} />
          <Text style={styles.balanceText}>{gems} gems</Text>
        </View>
        <View style={styles.shopHeartLine}>
          <Ionicons name={hearts > 0 ? 'heart' : 'heart-outline'} size={13} color={C.red} />
          <Text style={styles.shopHeartText}>
            {hearts} / {CONFIG.heartsMax} hearts{full ? ' · full' : ''}
          </Text>
        </View>
      </View>
      <View style={{ gap: 10 }}>
        {rows.map((row) => {
          const short = !full && gems < row.price;
          return (
            <Press3D
              key={row.kind}
              disabled={row.disabled}
              onPress={() => onBuy(row.kind)}
              bg={C.paper}
              shadowColor={row.disabled ? 'transparent' : C.swan}
              radius={R.md}
              depth={3}
              accessibilityLabel={row.title}
              contentStyle={[styles.shopItem, row.disabled ? styles.shopItemOff : null]}
            >
              <View style={[styles.shopIco, row.disabled ? styles.shopIcoOff : null]}>
                <Ionicons name="heart" size={18} color={row.disabled ? C.mute : C.red} />
              </View>
              <View style={styles.shopTxt}>
                <Text style={styles.shopTitle} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={styles.shopDesc} numberOfLines={2}>
                  {full ? 'Your hearts are already full' : short ? `${row.price - gems} more gems needed` : row.desc}
                </Text>
              </View>
              <View style={[styles.price, row.disabled ? styles.priceOff : null]}>
                <Ionicons name="diamond" size={13} color={row.disabled ? C.mute : C.beet} />
                <Text style={[styles.priceText, row.disabled ? styles.priceTextOff : null]}>{row.price}</Text>
              </View>
            </Press3D>
          );
        })}
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
  onGhost,
  stars,
  bestCpm,
  bestAccuracy,
  completed,
  practicePassed,
  crown,
}: {
  lesson: Lesson | null;
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  onPractice: () => void;
  onGhost: () => void;
  stars: number;
  bestCpm: number | null;
  bestAccuracy: number | null;
  completed: boolean;
  practicePassed: boolean;
  crown: boolean;
}) {
  if (!lesson) return null;
  const accGate = lesson.passCriteria.accuracy;
  const cpmGate = lesson.passCriteria.cpm ?? CONFIG.cpm.dec2bin[1];

  const missions = [
    {
      icon: 'locate' as const,
      label: 'Accuracy',
      value: pct(accGate, 0),
      done: (bestAccuracy || 0) >= accGate,
    },
    {
      icon: 'speedometer' as const,
      label: 'Speed',
      value: `${cpmGate} CPM`,
      done: (bestCpm || 0) >= cpmGate,
    },
    {
      icon: 'checkmark' as const,
      label: 'Practice',
      value: practicePassed ? 'passed' : 'needed',
      done: practicePassed,
    },
  ];

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.sheetHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.kicker}>
            Lesson {lesson.id}
            {completed ? ' · completed' : ''}
          </Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.sheetSub}>{lesson.subtitle}</Text>
        </View>
        <Tap onPress={onClose} accessibilityLabel="Close lesson sheet" style={styles.sheetClose}>
          <Ionicons name="close" size={22} color={C.ash} />
        </Tap>
      </View>

      {lesson.newConcept ? <Text style={styles.sheetConcept}>{lesson.newConcept}</Text> : null}

      <View style={styles.chipRow}>
        <Chip icon="star" label={`${stars}/3`} tone="gold" />
        {crown ? (
          <View style={styles.crownChip}>
            <MaterialCommunityIcons name="crown" size={14} color={C.goldDark} />
          </View>
        ) : null}
        <Chip icon="speedometer" label={`Best ${bestCpm == null ? '—' : bestCpm.toFixed(1)} CPM`} />
        <Chip icon="locate" label={bestAccuracy == null ? '—' : pct(bestAccuracy, 0)} />
      </View>

      <View style={styles.missions}>
        {missions.map((m) => (
          <View key={m.label} style={[styles.mission, m.done ? styles.missionDone : null]}>
            <View style={[styles.missionIco, m.done ? styles.missionIcoDone : null]}>
              <Ionicons name={m.done ? 'checkmark' : m.icon} size={17} color={m.done ? C.greenDark : C.ash} />
            </View>
            <Text style={styles.missionLabel}>{m.label}</Text>
            <Text style={[styles.missionHint, m.done ? { color: C.greenDark } : null]}>{m.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Btn label={completed ? 'Replay lesson' : 'Start lesson'} onPress={onStart} />
        <Btn
          label={practicePassed ? 'Practice again · passed' : 'Practice · required'}
          variant="secondary"
          onPress={onPractice}
        />
        <Btn
          label={bestCpm == null ? 'Ghost race · set a best first' : 'Ghost race · You vs. You'}
          variant="neutral"
          disabled={bestCpm == null}
          onPress={onGhost}
        />
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

/**
 * In-app confirmation dialog. Replaces the platform Alert so quitting a
 * lesson, leaving practice and resetting progress all look like the rest of
 * the app.
 */
export function ConfirmModal({
  visible,
  title,
  body,
  icon = 'help-circle-outline',
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[styles.dialog, { opacity: fade, transform: [{ scale: pop }] }]}>
          <View style={[styles.dialogIcon, destructive ? styles.dialogIconDanger : null]}>
            <Ionicons name={icon} size={30} color={destructive ? C.redDark : C.greenDark} />
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={{ gap: 10, width: '100%' }}>
            <Btn label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            <Btn label={cancelLabel} variant="secondary" onPress={onCancel} />
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
  heartsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  heartsCountText: { fontSize: 12, fontWeight: '700', color: C.ash, letterSpacing: 0.2 },
  note: { ...T.tiny, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  shortNote: { fontSize: 12, fontWeight: '600', color: C.orangeDeep, textAlign: 'center', marginTop: 6 },
  always: { fontSize: 12, fontWeight: '600', color: C.ash, textAlign: 'center', marginTop: 12 },
  shopStatus: { alignItems: 'center', marginBottom: 16 },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: C.gemBg,
    borderWidth: 2,
    borderColor: C.gemLine,
  },
  balanceText: { fontSize: 16, fontWeight: '700', color: C.beet, fontVariant: ['tabular-nums'] },
  shopHeartLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  shopHeartText: { fontSize: 12, fontWeight: '600', color: C.ash },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: C.paper,
  },
  shopItemOff: { backgroundColor: C.polar, borderColor: '#ededed' },
  shopIco: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.heartPale,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shopIcoOff: { backgroundColor: C.polar },
  shopTxt: { flex: 1, minWidth: 0 },
  shopTitle: { fontSize: 15, fontWeight: '700', color: C.graphite, lineHeight: 19 },
  shopDesc: { fontSize: 12.5, fontWeight: '500', color: C.ash, marginTop: 2, lineHeight: 17 },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: C.gemBg,
    borderWidth: 2,
    borderColor: C.gemLine,
    flexShrink: 0,
  },
  priceOff: { backgroundColor: C.polar, borderColor: C.swan },
  priceText: { fontSize: 14, fontWeight: '700', color: C.beet, fontVariant: ['tabular-nums'] },
  priceTextOff: { color: C.mute },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.polar,
    marginTop: -2,
  },
  kicker: { fontSize: 12, fontWeight: '500', color: C.ash, marginBottom: 2 },
  lessonTitle: { ...T.h1, fontSize: 24 },
  sheetSub: { ...T.body, fontSize: 14, lineHeight: 20, marginTop: 2 },
  sheetConcept: { ...T.tiny, marginTop: 4, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 },
  crownChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.amberLine,
    backgroundColor: C.amberPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actions: { gap: 10, marginTop: 16 },
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
  dialogIconDanger: { backgroundColor: C.heartPale },
});
