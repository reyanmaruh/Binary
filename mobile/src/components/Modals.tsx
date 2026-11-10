import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../data/curriculum';
import { C, R, T } from '../theme';
import type { Lesson } from '../types';
import { fmtCountdown } from '../utils';
import { Btn, Chip } from './UI';

export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
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
      <Text style={[T.h2, { textAlign: 'center' }]}>{hearts === 0 ? 'Out of hearts' : 'Hearts'}</Text>
      <View style={styles.heartsRow}>
        {Array.from({ length: CONFIG.heartsMax }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < hearts ? 'heart' : 'heart-outline'}
            size={30}
            color={i < hearts ? C.red : C.swan}
          />
        ))}
      </View>
      <Text style={styles.timer}>{full ? 'Full' : fmtCountdown(nextIn)}</Text>
      <Text style={styles.timerLabel}>{full ? 'all hearts ready' : 'until your next heart'}</Text>
      <Text style={styles.note}>
        {hearts === 0
          ? `You have ${gems} gems. Refill now, or wait for the timer.`
          : `One heart every ${CONFIG.heartsRefillMinutes} minutes. You have ${gems} gems.`}
      </Text>
      <View style={{ gap: 10 }}>
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
      <Text style={[T.h2, { textAlign: 'center' }]}>Gem shop</Text>
      <View style={styles.balance}>
        <Ionicons name="diamond" size={18} color={C.beet} />
        <Text style={styles.balanceText}>{gems} gems</Text>
      </View>
      <View style={{ gap: 10 }}>
        {rows.map((row) => (
          <Pressable
            key={row.kind}
            disabled={row.disabled}
            onPress={() => onBuy(row.kind)}
            style={[styles.shopItem, row.disabled ? { opacity: 0.5 } : null]}
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
          </Pressable>
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
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetKicker}>Lesson {lesson.id}{completed ? ' · completed' : ''}</Text>
      <Text style={T.h1}>{lesson.title}</Text>
      <Text style={styles.sheetSub}>{lesson.subtitle}</Text>
      <Text style={styles.sheetConcept}>{lesson.newConcept}</Text>
      <View style={styles.chipRow}>
        <Chip icon="star" label={`${stars}/3`} tone="gold" />
        <Chip icon="speedometer" label={`${bestCpm == null ? '—' : bestCpm.toFixed(1)} CPM`} />
        <Chip icon="checkmark-circle" label={practiceBest == null ? 'Practice —' : `Practice ${Math.round(practiceBest * 100)}%`} tone={practiceBest != null && practiceBest >= CONFIG.practiceGate ? 'green' : 'neutral'} />
      </View>
      <View style={{ gap: 10, marginTop: 6 }}>
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.centerFill}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.dialogIcon}>
            <Ionicons name={icon} size={30} color={C.greenDark} />
          </View>
          <Text style={[T.h2, { textAlign: 'center' }]}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={{ gap: 10, width: '100%' }}>
            <Btn label={primaryLabel} onPress={onPrimary} />
            <Btn label="Close" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  centerFill: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: C.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '88%',
    gap: 4,
  },
  heartsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 18 },
  timer: { fontSize: 34, fontWeight: '800', color: C.graphite, textAlign: 'center', marginTop: 12 },
  timerLabel: { ...T.tiny, textAlign: 'center' },
  note: { ...T.tiny, lineHeight: 17, marginTop: 12, textAlign: 'center' },
  balance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 12 },
  balanceText: { fontSize: 16, fontWeight: '800', color: C.beet },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    padding: 12,
    backgroundColor: C.paper,
  },
  shopIco: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.redPale, alignItems: 'center', justifyContent: 'center' },
  shopTitle: { fontSize: 15, fontWeight: '800', color: C.graphite },
  shopDesc: { fontSize: 12.5, color: C.ash, marginTop: 2 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 14, fontWeight: '800', color: C.beet },
  sheetKicker: { ...T.label, marginBottom: 4 },
  sheetSub: { ...T.body, marginTop: 2 },
  sheetConcept: { ...T.tiny, marginTop: 10, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 14 },
  dialog: {
    backgroundColor: C.paper,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  dialogIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.eelLight, alignItems: 'center', justifyContent: 'center' },
  dialogBody: { ...T.body, textAlign: 'center', marginBottom: 6 },
});
