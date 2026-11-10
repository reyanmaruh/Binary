import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Press3D, Tap } from '../motion';
import { C, R, T, card } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger';

const PALETTE = {
  primary: { bg: C.green, shelf: C.greenDark, fg: C.paper },
  secondary: { bg: C.paper, shelf: C.swan, fg: C.blue },
  neutral: { bg: C.paper, shelf: C.swan, fg: C.ash },
  ghost: { bg: 'transparent', shelf: 'transparent', fg: C.ash },
  danger: { bg: C.red, shelf: C.redDark, fg: C.paper },
};

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
  const palette = PALETTE[variant];
  if (variant === 'ghost') {
    return (
      <Tap onPress={disabled ? undefined : onPress} style={[style, { alignSelf: 'stretch' }]} accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}>
        <View style={styles.ghost}>
          {icon ? <Ionicons name={icon} size={16} color={C.ash} /> : null}
          <Text style={[styles.ghostLabel, disabled ? { opacity: 0.5 } : null]}>{label}</Text>
        </View>
      </Tap>
    );
  }
  const isOutline = variant === 'secondary' || variant === 'neutral';
  const fg = disabled ? C.mute : palette.fg;
  return (
    <Press3D
      onPress={onPress}
      disabled={disabled}
      bg={disabled ? C.polar : palette.bg}
      shadowColor={palette.shelf}
      radius={small ? R.md : R.lg}
      depth={disabled ? 0 : 4}
      style={[styles.btnOuter, style]}
      contentStyle={[
        styles.btnFace,
        small ? styles.btnSmall : null,
        isOutline ? { borderWidth: 2, borderColor: C.swan, borderBottomWidth: 0 } : null,
      ]}
      accessibilityLabel={label}
    >
      {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={fg} /> : null}
      <Text style={[styles.btnLabel, small ? styles.btnLabelSmall : null, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Press3D>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[card, { padding: 24 }, style]}>{children}</View>;
}

export function Chip({
  icon,
  label,
  tone = 'neutral',
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'neutral' | 'green' | 'gold' | 'red' | 'blue' | 'orange' | 'purple';
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    neutral: { bg: C.polar, border: C.swan, fg: C.ash },
    green: { bg: '#f3fbea', border: C.eelLight, fg: C.greenDark },
    gold: { bg: C.amberPale, border: C.amberLine, fg: C.goldDark },
    red: { bg: '#fff0f0', border: C.heartLine, fg: C.red },
    blue: { bg: C.bluePale, border: '#bfe4fb', fg: C.blueDark },
    orange: { bg: C.amberPale, border: C.amberLine, fg: C.orangeDeep },
    purple: { bg: C.gemBg, border: C.gemLine, fg: C.gemInk },
  }[tone];
  const iconColor = tone === 'green' ? C.goldDark : tones.fg;
  return (
    <View style={[styles.chip, { backgroundColor: tones.bg, borderColor: tones.border }, style]}>
      {icon ? <Ionicons name={icon} size={13} color={iconColor} /> : null}
      <Text style={[styles.chipText, { color: tones.fg }]}>{label}</Text>
    </View>
  );
}

const barAnim = new WeakMap<Animated.Value, number>();

export function ProgressBar({
  ratio,
  height = 8,
  track = C.swan,
  fill = C.green,
  animate = true,
}: {
  ratio: number;
  height?: number;
  track?: string;
  fill?: string;
  animate?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const v = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    if (!animate) {
      v.setValue(clamped);
      return;
    }
    Animated.spring(v, { toValue: clamped, useNativeDriver: false, friction: 7, tension: 90 }).start();
  }, [clamped, animate, v]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', width: '100%' }}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: fill,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Press3D
      onPress={onPress}
      bg={C.paper}
      shadowColor={C.swan}
      radius={14}
      depth={3}
      style={{ width: 40 }}
      contentStyle={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.swan, borderBottomWidth: 0 }}
      accessibilityLabel="Back"
    >
      <Ionicons name="arrow-back" size={20} color={C.graphite} />
    </Press3D>
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
      <BackButton onPress={onBack} />
      <View style={{ flex: 1, paddingTop: 2 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Kept for screens that just want the standard padded scroll body. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={T.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  btnOuter: { alignSelf: 'stretch' },
  btnFace: {
    minHeight: 50,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnSmall: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 11 },
  btnLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 18 },
  btnLabelSmall: { fontSize: 13, letterSpacing: 0.8 },
  ghost: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: R.md,
  },
  ghostLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, color: C.ash },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: R.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  pageHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 2, marginBottom: 20 },
  pageTitle: { ...T.h1, fontSize: 28 },
  pageSub: { fontSize: 14, fontWeight: '500', color: C.ash, marginTop: 3, lineHeight: 20 },
});
