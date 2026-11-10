import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { C, R, T } from '../theme';
import type { Item } from '../types';
import { BITS, binToDec, shuffle, toBin } from '../utils';
import { Btn, Chip } from './UI';

interface Props {
  item: Item;
  onSubmit: (correct: boolean, explanation: string) => void;
}

export function Question({ item, onSubmit }: Props) {
  if (item.type === 'TAP') return <TapQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'NUM') return <NumQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'MCQ') return <McqQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'MATCH') return <MatchQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'ORDER') return <OrderQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'SPOT') return <SpotQuestion item={item} onSubmit={onSubmit} />;
  if (item.type === 'BLANK') return <BlankQuestion item={item} onSubmit={onSubmit} />;
  return <Text style={T.body}>Unsupported exercise.</Text>;
}

function Kicker({ text }: { text: string }) {
  return <Text style={styles.kicker}>{text}</Text>;
}

function TapQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const target = item.value ?? 0;
  const [on, setOn] = useState<boolean[]>(Array(8).fill(false));
  const sum = on.reduce((acc, v, i) => acc + (v ? BITS[i] : 0), 0);
  return (
    <View style={styles.wrap}>
      <Kicker text="Build the number" />
      <Text style={styles.prompt}>Make {target} in binary</Text>
      <View style={styles.bits}>
        {BITS.map((bit, i) => (
          <Pressable
            key={bit}
            onPress={() => setOn((prev) => prev.map((v, j) => (j === i ? !v : v)))}
            style={[styles.bitCell, on[i] ? styles.bitOn : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: on[i] }}
          >
            <Text style={[styles.place, on[i] ? { color: C.greenDark } : null]}>{bit}</Text>
            <Text style={[styles.bit, on[i] ? styles.bitTextOn : null]}>{on[i] ? '1' : '0'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>Sum</Text>
        <Text style={styles.sumValue}>{sum}</Text>
        <Text style={styles.sumOf}>/ {target}</Text>
      </View>
      <Btn label="Check" onPress={() => onSubmit(sum === target, `${target} = ${toBin(target).split('').join(' ')}`)} />
    </View>
  );
}

function NumQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const bin2dec = item.direction !== 'dec2bin';
  const expected = bin2dec ? String(binToDec(item.bits || '00000000')) : toBin(item.value ?? 0);
  const [value, setValue] = useState('');
  const submit = () => onSubmit(value.trim() === expected, bin2dec ? `${item.bits} = ${expected}` : `${item.value} = ${expected.split('').join(' ')}`);

  useEffect(() => {
    if (item.autoSubmit && value.length >= expected.length) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View style={styles.wrap}>
      <Kicker text={bin2dec ? 'Binary → decimal' : 'Decimal → binary'} />
      {bin2dec ? (
        <Text style={styles.bitsBig}>{(item.bits || '').split('').join(' ')}</Text>
      ) : (
        <Text style={styles.target}>{item.value}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={(t) => setValue(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder={bin2dec ? 'Type the decimal value' : 'Type the 8 bits'}
        placeholderTextColor={C.mute}
        maxLength={bin2dec ? 3 : 8}
        style={styles.input}
        autoFocus
      />
      <Btn label="Check" onPress={submit} disabled={!value.trim()} />
    </View>
  );
}

function McqQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <View style={styles.wrap}>
      <Kicker text="Question" />
      <Text style={styles.prompt}>{item.prompt}</Text>
      <View style={{ gap: 10, width: '100%' }}>
        {(item.options || []).map((opt, i) => (
          <Pressable
            key={`${opt}-${i}`}
            onPress={() => setSelected(i)}
            style={[styles.option, selected === i ? styles.optionOn : null]}
          >
            <View style={[styles.optionKey, selected === i ? { backgroundColor: C.green, borderColor: C.greenDark } : null]}>
              <Text style={[styles.optionKeyText, selected === i ? { color: C.paper } : null]}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>
      <Btn
        label="Check"
        disabled={selected == null}
        onPress={() => onSubmit(selected === item.answer, `Correct answer: ${(item.options || [])[Number(item.answer)]}`)}
      />
    </View>
  );
}

function MatchQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const pairs = item.pairs || [];
  const rights = useMemo(() => shuffle(pairs.map((p, i) => ({ label: p[1], i }))), [pairs]);
  const [matched, setMatched] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);

  const tapRight = (rightIndex: number) => {
    if (active == null) return;
    if (active === rightIndex) {
      const next = [...matched, rightIndex];
      setMatched(next);
      setActive(null);
      setWrong(null);
      if (next.length === pairs.length) onSubmit(true, 'Nice — every pair matched.');
    } else {
      setWrong(rightIndex);
      onSubmit(false, 'That pair does not match.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Kicker text="Match the pairs" />
      <Text style={styles.prompt}>Tap a left tile, then its match</Text>
      <View style={styles.matchRow}>
        <View style={{ flex: 1, gap: 8 }}>
          {pairs.map((p, i) => (
            <Pressable
              key={p[0]}
              disabled={matched.includes(i)}
              onPress={() => setActive(i)}
              style={[styles.matchTile, active === i ? styles.matchActive : null, matched.includes(i) ? styles.matchDone : null]}
            >
              <Text style={styles.matchText}>{p[0]}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {rights.map((r) => (
            <Pressable
              key={`${r.label}-${r.i}`}
              disabled={matched.includes(r.i)}
              onPress={() => tapRight(r.i)}
              style={[styles.matchTile, wrong === r.i ? styles.matchWrong : null, matched.includes(r.i) ? styles.matchDone : null]}
            >
              <Text style={styles.matchText}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function OrderQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const correct = item.correctOrder || [];
  const [pool] = useState<string[]>(() => shuffle(item.items || []));
  const [order, setOrder] = useState<string[]>([]);

  const pick = (value: string) => {
    if (order.includes(value)) return;
    const next = [...order, value];
    if (value !== correct[next.length - 1]) {
      onSubmit(false, `The order is ${correct.join(' → ')}`);
      return;
    }
    setOrder(next);
    if (next.length === correct.length) onSubmit(true, correct.join(' → '));
  };

  return (
    <View style={styles.wrap}>
      <Kicker text="Sort it" />
      <Text style={styles.prompt}>Tap the values in ascending order</Text>
      <View style={styles.orderPool}>
        {pool.map((v) => (
          <Pressable key={v} onPress={() => pick(v)} disabled={order.includes(v)} style={[styles.orderTile, order.includes(v) ? styles.matchDone : null]}>
            <Text style={styles.matchText}>{v}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.orderRow}>
        {correct.map((_, i) => (
          <View key={i} style={styles.orderSlot}>
            <Text style={styles.orderSlotText}>{order[i] ?? ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpotQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const shown = item.shown || '';
  return (
    <View style={styles.wrap}>
      <Kicker text="Spot the mistake" />
      <Text style={styles.prompt}>One bit is wrong. Tap it.</Text>
      <View style={styles.bits}>
        {shown.split('').map((bit, i) => (
          <Pressable
            key={i}
            onPress={() => onSubmit(i === item.wrongBitIndex, `The correct value is ${toBin(item.value ?? 0).split('').join(' ')}`)}
            style={styles.bitCell}
          >
            <Text style={styles.place}>{BITS[i]}</Text>
            <Text style={styles.bit}>{bit}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BlankQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const answer = String(item.answer ?? '');
  const [value, setValue] = useState('');
  return (
    <View style={styles.wrap}>
      <Kicker text="Fill the gap" />
      <Text style={styles.prompt}>{item.value} in binary, with the last bits missing</Text>
      <Text style={styles.blankBits}>{item.known}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => setValue(t.replace(/[^01]/g, '').slice(0, answer.length))}
        keyboardType="number-pad"
        placeholder="Missing bits"
        placeholderTextColor={C.mute}
        style={styles.input}
        autoFocus
      />
      <Btn label="Check" disabled={value.length !== answer.length} onPress={() => onSubmit(value === answer, `${item.value} = ${(item.known || '').replace(/_/g, '')}${answer}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, width: '100%', alignItems: 'center' },
  kicker: { ...T.label, color: C.blue, letterSpacing: 1.1 },
  prompt: { ...T.h2, textAlign: 'center' },
  target: { fontSize: 54, fontWeight: '800', color: C.graphite },
  bitsBig: { fontSize: 26, fontWeight: '800', letterSpacing: 2, color: C.graphite, fontVariant: ['tabular-nums'] },
  bits: { flexDirection: 'row', gap: 5, width: '100%', justifyContent: 'center' },
  bitCell: { flex: 1, maxWidth: 44, alignItems: 'center', gap: 6 },
  place: { fontSize: 9, fontWeight: '800', color: C.ash },
  bit: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: R.md,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.paper,
    color: C.ash,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },
  bitOn: {},
  bitTextOn: { backgroundColor: C.green, borderColor: C.greenDark, color: C.paper },
  sumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sumLabel: { ...T.label },
  sumValue: { fontSize: 24, fontWeight: '800', color: C.graphite },
  sumOf: { ...T.tiny },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    backgroundColor: C.paper,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: C.graphite,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    backgroundColor: C.paper,
    padding: 13,
  },
  optionOn: { borderColor: C.blue, backgroundColor: C.bluePale },
  optionKey: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.polar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionKeyText: { fontSize: 11, fontWeight: '800', color: C.ash },
  optionText: { fontSize: 16, fontWeight: '700', color: C.graphite },
  matchRow: { flexDirection: 'row', gap: 10, width: '100%' },
  matchTile: {
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: C.paper,
    minHeight: 42,
    justifyContent: 'center',
  },
  matchActive: { borderColor: C.blue, backgroundColor: C.bluePale },
  matchDone: { opacity: 0.4, borderColor: C.green, backgroundColor: C.eelLight },
  matchWrong: { borderColor: C.red, backgroundColor: C.redPale },
  matchText: { fontSize: 13, fontWeight: '800', color: C.graphite, textAlign: 'center' },
  orderPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  orderTile: { borderWidth: 2, borderColor: C.swan, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.paper },
  orderRow: { flexDirection: 'row', gap: 8 },
  orderSlot: { width: 44, height: 44, borderRadius: R.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: C.swan, alignItems: 'center', justifyContent: 'center' },
  orderSlotText: { fontSize: 15, fontWeight: '800', color: C.greenDark },
  blankBits: { fontSize: 30, fontWeight: '800', letterSpacing: 3, color: C.graphite, fontVariant: ['tabular-nums'] },
});
