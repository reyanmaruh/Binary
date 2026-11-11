import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Press3D, Tap, useBump, useMount, usePop } from '../motion';
import { C, MONO, R, T } from '../theme';
import type { Item } from '../types';
import { BITS, binToDec, greedyText, shuffle, toBin } from '../utils';
import { Text, TextInput } from './Text';
import { Btn } from './UI';
import { useStickyAction } from './QuestionActions';

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

/** One bit switch: springs on toggle and pops its label out of the way. */
function BitCell({
  place,
  bit,
  on,
  onPress,
  wrong,
  dimPlace,
}: {
  place: number;
  bit: string;
  on: boolean;
  onPress: () => void;
  wrong?: boolean;
  dimPlace?: boolean;
}) {
  const bounce = useRef(new Animated.Value(1)).current;
  const previous = useRef(on);
  useEffect(() => {
    if (previous.current === on) return;
    previous.current = on;
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.12, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0.97, duration: 90, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 5, tension: 180 }),
    ]).start();
  }, [on, bounce]);

  return (
    <View style={styles.bitCell}>
      <Text style={[styles.place, on ? { color: C.greenDark, transform: [{ translateY: -1 }] } : null, dimPlace ? { opacity: 0.22 } : null]}>{place}</Text>
      <Press3D
        onPress={onPress}
        bg={on ? C.green : C.paper}
        shadowColor={on ? C.greenDark : wrong ? C.redDark : C.swan}
        radius={R.md}
        depth={4}
        style={{ alignSelf: 'stretch' }}
        contentStyle={[styles.bitFace, on ? styles.bitFaceOn : null, wrong ? styles.bitFaceWrong : null]}
        accessibilityLabel={`${place} bit ${on ? 'on' : 'off'}`}
        accessibilityState={{ selected: on }}
      >
        <Animated.Text
          style={[
            styles.bitText,
            on ? { color: C.paper } : null,
            wrong ? { color: C.redDark } : null,
            { transform: [{ scale: bounce }] },
          ]}
        >
          {bit}
        </Animated.Text>
      </Press3D>
    </View>
  );
}

function TapQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const target = item.value ?? 0;
  const [on, setOn] = useState<boolean[]>(Array(8).fill(false));
  const [showPlaces, setShowPlaces] = useState(item.showChart !== false);
  const [hint, setHint] = useState('');
  const sum = on.reduce((acc, v, i) => acc + (v ? BITS[i] : 0), 0);
  const sumScale = useBump(sum, 1.14);
  const targetAnim = usePop(target);

  useStickyAction({
    label: 'Check',
    onPress: () => onSubmit(sum === target, `${target} = ${toBin(target).split('').join(' ')}`),
  });

  return (
    <View style={styles.wrap}>
      <Kicker text="Decimal → Binary" />
      <Animated.Text style={[styles.target, targetAnim]}>Make {target}</Animated.Text>
      <Text style={styles.sub}>Flip the switches so they add up to {target}.</Text>
      <View style={styles.bits}>
        {BITS.map((bit, i) => (
          <BitCell
            key={bit}
            place={bit}
            bit={on[i] ? '1' : '0'}
            on={on[i]}
            dimPlace={!showPlaces}
            onPress={() => setOn((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          />
        ))}
      </View>
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>Sum</Text>
        <Animated.Text style={[styles.sumValue, { transform: [{ scale: sumScale }] }]}>{sum}</Animated.Text>
        <Text style={styles.sumOf}>/ {target}</Text>
      </View>
      {item.showChart === false && !showPlaces ? (
        <Btn label="Peek at the chart (once)" icon="eye-outline" variant="ghost" small onPress={() => setShowPlaces(true)} />
      ) : null}
      {item.showHints ? (
        hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : (
          <Btn label="Hint: greedy walk" icon="bulb-outline" variant="ghost" small onPress={() => setHint(greedyText(target))} />
        )
      ) : null}
    </View>
  );
}

function NumQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const bin2dec = item.direction !== 'dec2bin';
  const expected = bin2dec ? String(binToDec(item.bits || '00000000')) : toBin(item.value ?? 0);
  const [digits, setDigits] = useState('');
  const targetAnim = usePop(item.value ?? 0);

  const submit = () =>
    onSubmit(
      digits === expected,
      bin2dec ? `${item.bits} = ${expected}` : `${item.value} = ${expected.split('').join(' ')}`,
    );

  useEffect(() => {
    if (item.autoSubmit && digits.length >= expected.length) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const type = (d: string) => setDigits((prev) => (prev.length >= expected.length ? prev : prev + d));

  useStickyAction(bin2dec ? null : { label: 'Check', disabled: !digits, onPress: submit });

  return (
    <View style={styles.wrap}>
      <Kicker text={bin2dec ? 'Binary → decimal' : 'Decimal → binary'} />
      {bin2dec ? (
        <Text style={styles.bitsBig}>{(item.bits || '').split('').join(' ')}</Text>
      ) : (
        <Animated.Text style={[styles.targetNumber, targetAnim]}>{item.value}</Animated.Text>
      )}
      {item.showChart ? <BitChart bits={item.bits || ''} /> : null}

      <View style={styles.numDisplay}>
        {digits.split('').map((d, i) => (
          <Digit key={`${i}-${d}`} value={d} />
        ))}
        {Array.from({ length: Math.max(0, expected.length - digits.length) }).map((_, i) => (
          <View key={`ghost-${i}`} style={styles.ghostCell} />
        ))}
      </View>

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <Key key={d} label={d} onPress={() => type(d)} />
        ))}
        <Key icon="backspace-outline" label="Delete" onPress={() => setDigits((prev) => prev.slice(0, -1))} />
        <Key label="0" onPress={() => type('0')} />
      </View>
    </View>
  );
}

function Digit({ value }: { value: string }) {
  const anim = useMount(0, 6, 160);
  return (
    <Animated.View style={[styles.digit, anim]}>
      <Text style={styles.digitText}>{value}</Text>
    </Animated.View>
  );
}

function Key({
  label,
  icon,
  onPress,
  enter,
  disabled,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  enter?: boolean;
  disabled?: boolean;
}) {
  return (
    <Press3D
      onPress={onPress}
      disabled={disabled}
      bg={disabled ? C.polar : enter ? C.green : C.paper}
      shadowColor={disabled ? 'transparent' : enter ? C.greenDark : C.swan}
      radius={R.md}
      depth={disabled ? 0 : 4}
      style={styles.keyOuter}
      contentStyle={styles.key}
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons name={icon} size={22} color={disabled ? C.mute : enter ? C.paper : C.ash} />
      ) : (
        <Text style={[styles.keyText, enter ? { color: C.paper } : null, disabled ? { color: C.mute } : null]}>{label}</Text>
      )}
    </Press3D>
  );
}

function McqQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answer = Number(item.answer);
  const check = () =>
    onSubmit(
      selected === answer,
      selected === answer
        ? `Yes — ${(item.options || [])[answer]}.`
        : `Correct answer: ${(item.options || [])[answer]}`,
    );

  useStickyAction({ label: 'Check', disabled: selected == null, onPress: check });

  return (
    <View style={styles.wrap}>
      <Kicker text="Question" />
      <Text style={styles.prompt}>{item.prompt}</Text>
      <View style={{ gap: 12, width: '100%' }}>
        {(item.options || []).map((opt, i) => {
          const state = selected === i ? (item.correctIndex != null ? (i === answer ? 'correct' : 'wrong') : 'picked') : 'idle';
          return (
            <Press3D
              key={`${opt}-${i}`}
              onPress={() => setSelected(i)}
              bg={state === 'picked' ? C.bluePale : C.paper}
              shadowColor={state === 'picked' ? C.blueDark : C.swan}
              radius={R.md}
              depth={4}
              contentStyle={[styles.option, state === 'picked' ? styles.optionOn : null]}
              accessibilityLabel={`${String.fromCharCode(65 + i)}. ${opt}`}
              accessibilityState={{ selected: selected === i }}
            >
              <View style={[styles.optionKey, selected === i ? { backgroundColor: C.blue } : null]}>
                <Text style={[styles.optionKeyText, selected === i ? { color: C.paper } : null]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[styles.optionText, selected === i ? { color: C.blue } : null]}>{opt}</Text>
            </Press3D>
          );
        })}
      </View>
    </View>
  );
}

function MatchQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const pairs = item.pairs || [];
  const rights = React.useMemo(() => shuffle(pairs.map((p, i) => ({ label: p[1], i }))), [pairs]);
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
        <View style={{ flex: 1, gap: 10 }}>
          {pairs.map((p, i) => (
            <Press3D
              key={p[0]}
              disabled={matched.includes(i)}
              onPress={() => setActive(i)}
              bg={matched.includes(i) ? C.eelLight : active === i ? C.bluePale : C.paper}
              shadowColor={matched.includes(i) ? 'transparent' : active === i ? C.blueDark : C.swan}
              radius={R.md}
              depth={matched.includes(i) ? 0 : 4}
              contentStyle={[styles.matchTile, active === i ? styles.matchActive : null]}
            >
              <Text style={[styles.matchText, active === i ? { color: C.blue } : null]}>{p[0]}</Text>
            </Press3D>
          ))}
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          {rights.map((r) => (
            <Press3D
              key={`${r.label}-${r.i}`}
              disabled={matched.includes(r.i)}
              onPress={() => tapRight(r.i)}
              bg={matched.includes(r.i) ? C.eelLight : wrong === r.i ? C.redPale : C.paper}
              shadowColor={matched.includes(r.i) ? 'transparent' : wrong === r.i ? C.redDark : C.swan}
              radius={R.md}
              depth={matched.includes(r.i) ? 0 : 4}
              contentStyle={[styles.matchTile, wrong === r.i ? styles.matchWrong : null]}
            >
              <Text style={styles.matchText}>{r.label}</Text>
            </Press3D>
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
        {pool.map((v) => {
          const placed = order.includes(v);
          return (
            <Press3D
              key={v}
              onPress={() => pick(v)}
              disabled={placed}
              bg={placed ? C.eelLight : C.paper}
              shadowColor={placed ? C.greenDark : C.swan}
              radius={R.md}
              depth={4}
              style={{ opacity: placed ? 0.35 : 1 }}
              contentStyle={styles.orderTile}
            >
              <Animated.Text style={styles.orderText}>{v}</Animated.Text>
            </Press3D>
          );
        })}
      </View>
      <View style={styles.orderRow}>
        {correct.map((_, i) => (
          <View key={i} style={[styles.orderSlot, order[i] ? styles.orderSlotFilled : null]}>
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
          <BitCell
            key={i}
            place={BITS[i]}
            bit={bit}
            on={false}
            onPress={() => onSubmit(i === item.wrongBitIndex, `The correct value is ${toBin(item.value ?? 0).split('').join(' ')}`)}
          />
        ))}
      </View>
    </View>
  );
}

function BlankQuestion({ item, onSubmit }: { item: Item; onSubmit: Props['onSubmit'] }) {
  const answer = String(item.answer ?? '');
  const [value, setValue] = useState('');
  const known = (item.known || '').split('');
  const answerStart = known.filter((c) => c !== '_').length;

  useStickyAction({
    label: 'Check',
    disabled: value.length !== answer.length,
    onPress: () => onSubmit(value === answer, `${item.value} = ${(item.known || '').replace(/_/g, '')}${answer}`),
  });

  return (
    <View style={styles.wrap}>
      <Kicker text="Fill the gap" />
      <Text style={styles.prompt}>
        {item.value} in binary. Fill in the missing bits.
      </Text>
      <View style={styles.blankRow}>
        {known.map((c, i) => (
          <View
            key={i}
            style={[styles.blankCell, c === '_' ? (i - answerStart < value.length ? styles.blankFilled : null) : styles.blankGiven]}
          >
            <Text style={styles.blankText}>{c === '_' ? value[i - answerStart] || '·' : c}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => setValue(t.replace(/[^01]/g, '').slice(0, answer.length))}
        keyboardType="number-pad"
        placeholder="Missing bits"
        placeholderTextColor={C.mute}
        style={styles.input}
        maxLength={answer.length}
        autoFocus
      />
    </View>
  );
}

/** The eight place-value cells, used by bin → dec and the theory chart. */
export function BitChart({ bits }: { bits: string }) {
  return (
    <View style={styles.chartRow}>
      {BITS.map((place, i) => {
        const bit = bits[i] ?? '0';
        const lit = bit === '1';
        return (
          <View key={place} style={styles.chartCell}>
            <View style={[styles.chartBit, lit ? styles.chartBitLit : null]}>
              <Text style={[styles.chartBitText, lit ? { color: C.paper } : null]}>{bit}</Text>
            </View>
            <Text style={styles.chartPlace}>{place}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18, width: '100%', alignItems: 'center' },
  sub: { fontSize: 14, fontWeight: '500', color: C.ash, textAlign: 'center', lineHeight: 20, marginTop: -6 },
  hint: {
    fontSize: 13,
    fontWeight: '500',
    color: C.ash,
    textAlign: 'center',
    lineHeight: 19,
    backgroundColor: C.polar,
    borderWidth: 2,
    borderColor: C.swan,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  kicker: { ...T.label, color: C.blue, letterSpacing: 1.1, fontSize: 12 },
  prompt: { ...T.h2, fontSize: 22, textAlign: 'center', lineHeight: 29 },
  target: { ...T.h2, fontSize: 24, textAlign: 'center' },
  targetNumber: { fontSize: 58, fontWeight: '700', letterSpacing: -1.5, color: C.graphite, lineHeight: 62 },
  bitsBig: { fontSize: 28, fontWeight: '700', letterSpacing: 3, color: C.graphite, fontFamily: MONO },
  bits: { flexDirection: 'row', gap: 4, width: '100%', justifyContent: 'center', marginTop: 2 },
  bitCell: { flex: 1, minWidth: 0, maxWidth: 46, alignItems: 'center', gap: 6 },
  place: { fontSize: 10, fontWeight: '700', color: C.ash },
  bitFace: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
  },
  bitFaceOn: { borderColor: C.greenDark },
  bitFaceWrong: { borderColor: C.red, backgroundColor: C.redPale },
  bitText: { fontSize: 20, fontWeight: '700', color: C.ash },
  sumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sumLabel: { ...T.label, fontSize: 13 },
  sumValue: { fontSize: 18, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
  sumOf: { ...T.tiny },
  numDisplay: { flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 58, alignItems: 'center', flexWrap: 'wrap' },
  chartRow: { flexDirection: 'row', gap: 5, width: '100%', justifyContent: 'center', marginTop: 2 },
  chartCell: { flex: 1, minWidth: 0, maxWidth: 38, alignItems: 'center', gap: 4 },
  chartBit: {
    width: '100%',
    height: 34,
    borderRadius: R.sm,
    backgroundColor: C.paper,
    borderWidth: 2,
    borderColor: C.swan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartBitLit: { backgroundColor: C.green, borderColor: C.greenDark },
  chartBitText: { fontSize: 13, fontWeight: '700', color: C.ash, fontFamily: MONO },
  chartPlace: { fontSize: 9, fontWeight: '700', color: C.ash },
  digit: {
    minWidth: 42,
    height: 56,
    borderRadius: R.md,
    borderWidth: 2,
    borderColor: C.blue,
    backgroundColor: C.bluePale,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.blueDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  digitText: { fontSize: 28, fontWeight: '700', color: C.graphite, fontVariant: ['tabular-nums'] },
  ghostCell: {
    minWidth: 42,
    height: 56,
    borderRadius: R.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.swan,
  },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 320, justifyContent: 'center' },
  keyOuter: { width: '31%' },
  key: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.md,
  },
  keyText: { fontSize: 22, fontWeight: '700', color: C.graphite },
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
    gap: 14,
    paddingVertical: 17,
    paddingHorizontal: 16,
    minHeight: 64,
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.md,
  },
  optionOn: { borderColor: C.blue },
  optionKey: {
    width: 28,
    height: 28,
    borderRadius: R.sm,
    backgroundColor: C.polar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionKeyText: { fontSize: 12, fontWeight: '700', color: C.ash },
  optionText: { flex: 1, fontSize: 17, fontWeight: '600', color: C.graphite },
  matchRow: { flexDirection: 'row', gap: 12, width: '100%' },
  matchTile: {
    minHeight: 52,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.swan,
    borderBottomWidth: 0,
    borderRadius: R.md,
  },
  matchActive: { borderColor: C.blue },
  matchWrong: { borderColor: C.red },
  matchText: { fontSize: 15, fontWeight: '700', color: C.graphite, textAlign: 'center', fontFamily: MONO },
  orderPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  orderTile: { minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.swan, borderBottomWidth: 0, borderRadius: R.md },
  orderText: { fontSize: 17, fontWeight: '700', color: C.graphite, fontFamily: MONO },
  orderRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: 10, borderRadius: R.md, backgroundColor: C.polar, borderWidth: 2, borderStyle: 'dashed', borderColor: C.swan, minWidth: '70%' },
  orderSlot: { width: 42, height: 42, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: C.swan },
  orderSlotFilled: { borderStyle: 'solid', borderColor: C.green, backgroundColor: C.eelLight },
  orderSlotText: { fontSize: 15, fontWeight: '700', color: C.greenDark, fontFamily: MONO },
  blankRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  blankCell: {
    width: 40,
    height: 56,
    borderRadius: R.md,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankGiven: { backgroundColor: C.polar },
  blankFilled: { borderColor: C.blue, backgroundColor: C.bluePale },
  blankText: { fontSize: 24, fontWeight: '700', color: C.mute, fontFamily: MONO },
});
