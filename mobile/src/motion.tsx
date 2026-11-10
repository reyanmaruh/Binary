import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { C, R } from './theme';

/** Same overshoot feel as the web build's cubic-bezier(0.34,1.56,0.64,1). */
export const SPRING = { friction: 6, tension: 130 };

export function springTo(value: Animated.Value, toValue: number, config: Record<string, unknown> = {}) {
  Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    friction: SPRING.friction,
    tension: SPRING.tension,
    ...config,
  }).start();
}

/** Fade + rise, the web's `screenIn` / `nodeIn` / `cardUp` entrance. */
export function useMount(delay = 0, from = 10, duration = 320, enabled = true) {
  const v = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  useEffect(() => {
    if (!enabled) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, duration, enabled, v]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  };
}

export function FadeIn({
  children,
  delay = 0,
  from = 10,
  duration = 320,
  enabled = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  duration?: number;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useMount(delay, from, duration, enabled);
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Scale pulse whenever `value` changes (the web's hudXp / xpBump). */
export function useBump(value: number | string, scale = 1.08) {
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(v, { toValue: scale, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 160 }),
    ]).start();
  }, [value, scale, v]);
  return v;
}

/** Infinite ring that expands out of the active lesson's icon. */
export function PulseRing({ size = 46, color = C.green, active = true }: { size?: number; color?: string; active?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.12, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
      }}
    />
  );
}

/** Horizontal shake for a wrong answer. */
export function useShake(trigger: unknown) {
  const v = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.sequence(
      [-6, 6, -5, 5, -3, 0].map((to) =>
        Animated.timing(v, { toValue: to, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      ),
    ).start();
  }, [trigger, v]);
  return v.interpolate({ inputRange: [-10, 10], outputRange: [-10, 10] });
}

/** Pop-in used for stars, gems and placed chips. */
export function usePop(trigger: unknown, from = 0.6, enabled = true) {
  const v = useRef(new Animated.Value(enabled ? from : 1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (!enabled) {
      v.setValue(1);
      return;
    }
    if (first.current) {
      first.current = false;
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5.5, tension: 140 }).start();
      return;
    }
    v.setValue(from);
    Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5.5, tension: 140 }).start();
  }, [trigger, from, enabled, v]);
  return {
    opacity: v.interpolate({ inputRange: [from, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ scale: v }],
  };
}

/** The 3D button: a solid shelf that the face springs into when pressed. */
export function Press3D({
  onPress,
  onLongPress,
  children,
  style,
  contentStyle,
  bg = C.paper,
  shadowColor = C.swan,
  radius = R.lg,
  depth = 4,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bg?: string;
  shadowColor?: string;
  radius?: number;
  depth?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityState?: Record<string, unknown>;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const press = (to: number) =>
    Animated.spring(t, { toValue: to, useNativeDriver: true, friction: 9, tension: 230 }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => !disabled && press(1)}
      onPressOut={() => press(0)}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={[style, { borderRadius: radius, backgroundColor: shadowColor, paddingBottom: disabled ? 0 : depth }]}
    >
      <Animated.View
        style={[
          {
            borderRadius: radius,
            backgroundColor: bg,
            transform: [{ translateY: disabled ? 0 : t.interpolate({ inputRange: [0, 1], outputRange: [0, depth] }) }],
          },
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Tiny spring scale on touch for icon buttons and tiles. */
export function Tap({
  onPress,
  children,
  style,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityState?: Record<string, unknown>;
}) {
  const s = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => springTo(s, 0.94, { friction: 9, tension: 250 })}
      onPressOut={() => springTo(s, 1, { friction: 6, tension: 200 })}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={style}
    >
      <Animated.View
        style={{
          transform: [{ scale: s }],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Infinite gentle float (mascot, FAB, start tooltip). */
export function useFloat(enabled = true, distance = 6, duration = 1600, rotate = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, duration, v]);
  return {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotate}deg`] }) },
    ],
  };
}

export function useMounted(duration = 260) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), duration);
    return () => clearTimeout(id);
  }, [duration]);
  return mounted;
}

export function Divider() {
  return <View style={{ height: 2, backgroundColor: C.swan }} />;
}
