import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { C, R, T, card } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Btn({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const palette = {
    primary: { bg: C.green, border: C.greenDark, fg: C.paper },
    secondary: { bg: C.paper, border: C.swan, fg: C.blue },
    ghost: { bg: 'transparent', border: 'transparent', fg: C.ash },
    danger: { bg: C.red, border: '#e03d3d', fg: C.paper },
  }[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: disabled ? C.swan : palette.bg,
          borderBottomColor: disabled ? '#d1d1d1' : palette.border,
          borderBottomWidth: pressed ? 1 : 4,
          transform: [{ translateY: pressed ? 3 : 0 }],
          opacity: disabled ? 0.7 : 1,
        },
        small ? styles.btnSmall : null,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={disabled ? C.ash : palette.fg} /> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.btnLabel,
          { color: disabled ? C.ash : palette.fg },
          variant === 'ghost' ? { fontSize: 13, letterSpacing: 0.6 } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[card, { padding: 20 }, style]}>{children}</View>;
}

export function Chip({
  icon,
  label,
  tone = 'neutral',
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'neutral' | 'green' | 'gold' | 'red' | 'blue';
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    neutral: { bg: C.polar, border: C.swan, fg: C.ash },
    green: { bg: C.eelLight, border: C.lime, fg: C.greenDark },
    gold: { bg: C.amberPale, border: '#ffe6a3', fg: C.goldDark },
    red: { bg: C.redPale, border: '#ffd1d1', fg: C.red },
    blue: { bg: C.bluePale, border: '#bfe4fb', fg: C.blueDark },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: tones.bg, borderColor: tones.border }, style]}>
      {icon ? <Ionicons name={icon} size={13} color={tones.fg} /> : null}
      <Text style={[styles.chipText, { color: tones.fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  ratio,
  height = 8,
  track = C.swan,
  fill = C.green,
}: {
  ratio: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', width: '100%' }}>
      <View style={{ height, width: `${clamped * 100}%`, borderRadius: height, backgroundColor: fill }} />
    </View>
  );
}

export function PageHead({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.pageHead}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={C.graphite} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={T.h1}>{title}</Text>
        {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function ScreenScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: R.lg,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnSmall: { minHeight: 40, paddingHorizontal: 14, borderRadius: R.md },
  btnLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 2,
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  pageHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4, marginBottom: 18 },
  pageSub: { ...T.tiny, fontSize: 14, marginTop: 3, lineHeight: 19 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    borderWidth: 2,
    borderColor: C.swan,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: C.swan,
  },
});
