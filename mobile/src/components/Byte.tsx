import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { C } from '../theme';

interface ByteProps {
  size?: number;
  float?: boolean;
  reduced?: boolean;
  /** worried: 2x head shake, celebrate: the web's jump-and-spin. */
  mood?: 'idle' | 'worried' | 'celebrate';
}

/** Byte: a floating robot head with lime eyes. No body, no blush. */
export function Byte({ size = 96, float = true, reduced = false, mood = 'idle' }: ByteProps) {
  const bob = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!float || reduced) {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, reduced, bob]);

  useEffect(() => {
    if (mood === 'idle' || reduced) {
      burst.setValue(0);
      return;
    }
    burst.setValue(0);
    const run = Animated.sequence([
      Animated.timing(burst, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(burst, { toValue: 0, useNativeDriver: true, friction: 5, tension: 110 }),
    ]);
    Animated.loop(run, { iterations: 2 }).start();
  }, [mood, reduced, burst]);

  const translateY = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
    burst.interpolate({ inputRange: [0, 1], outputRange: [0, mood === 'celebrate' ? -14 : 2] }),
  );
  const rotate = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '2deg'] }),
    burst.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', mood === 'celebrate' ? '-10deg' : mood === 'worried' ? '-4deg' : '0deg'],
    }),
  );
  const scale = burst.interpolate({ inputRange: [0, 1], outputRange: [1, mood === 'celebrate' ? 1.08 : 1] });
  const inner = size / 120;

  return (
    <Animated.View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY }, { rotate }, { scale }] }}
    >
      <Animated.View style={{ width: 120, height: 120, transform: [{ scale: inner }] }}>
        {/* antenna */}
        <Animated.View style={{ position: 'absolute', left: 58, top: 18, width: 4, height: 14, borderRadius: 2, backgroundColor: C.graphite }} />
        <Animated.View
          style={{
            position: 'absolute',
            left: 52,
            top: 4,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: C.green,
            borderWidth: 3,
            borderColor: C.graphite,
            transform: [{ scale: bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
          }}
        />
        {/* ears */}
        <Animated.View style={{ position: 'absolute', left: 11, top: 47, width: 16, height: 28, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.graphite }} />
        <Animated.View style={{ position: 'absolute', left: 93, top: 47, width: 16, height: 28, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.graphite }} />
        {/* head */}
        <Animated.View style={{ position: 'absolute', left: 22, top: 22, width: 76, height: 76, borderRadius: 38, backgroundColor: C.paper, borderWidth: 4, borderColor: C.graphite }} />
        {/* visor */}
        <Animated.View style={{ position: 'absolute', left: 35, top: 45, width: 50, height: 30, borderRadius: 15, backgroundColor: C.graphite }} />
        {/* eyes */}
        <Animated.View style={{ position: 'absolute', left: 43, top: 53, width: 15, height: 15, borderRadius: 8, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2f4a12' }} />
          <Animated.View style={{ position: 'absolute', left: 3, top: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: C.paper }} />
        </Animated.View>
        <Animated.View style={{ position: 'absolute', left: 61, top: 53, width: 15, height: 15, borderRadius: 8, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2f4a12' }} />
          <Animated.View style={{ position: 'absolute', left: 3, top: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: C.paper }} />
        </Animated.View>
        {/* smile */}
        <Animated.View style={{ position: 'absolute', left: 52, top: 64, width: 16, height: 9, borderBottomWidth: 3, borderColor: C.lime, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
      </Animated.View>
    </Animated.View>
  );
}
