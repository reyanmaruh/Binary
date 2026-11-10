import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { C } from '../theme';

interface ByteProps {
  size?: number;
  float?: boolean;
  reduced?: boolean;
}

/** Byte: a floating robot head with lime eyes. No body, no blush. */
export function Byte({ size = 96, float = true, reduced = false }: ByteProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!float || reduced) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, reduced, t]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const scale = size / 120;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }] }}>
      <View style={{ width: 120, height: 120, transform: [{ scale }], transformOrigin: 'top left' }}>
        {/* shadow */}
        <View style={{ position: 'absolute', left: 36, top: 104, width: 48, height: 9, borderRadius: 5, backgroundColor: '#eef3e6' }} />
        {/* antenna */}
        <View style={{ position: 'absolute', left: 58, top: 18, width: 4, height: 14, borderRadius: 2, backgroundColor: C.graphite }} />
        <View style={{ position: 'absolute', left: 52, top: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.graphite }} />
        {/* ears */}
        <View style={{ position: 'absolute', left: 11, top: 47, width: 16, height: 28, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.graphite }} />
        <View style={{ position: 'absolute', left: 93, top: 47, width: 16, height: 28, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.graphite }} />
        {/* head */}
        <View style={{ position: 'absolute', left: 22, top: 22, width: 76, height: 76, borderRadius: 38, backgroundColor: C.paper, borderWidth: 4, borderColor: C.graphite }} />
        {/* visor */}
        <View style={{ position: 'absolute', left: 35, top: 45, width: 50, height: 30, borderRadius: 15, backgroundColor: C.graphite }} />
        {/* eyes */}
        <View style={{ position: 'absolute', left: 43, top: 53, width: 15, height: 15, borderRadius: 8, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2f4a12' }} />
          <View style={{ position: 'absolute', left: 3, top: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: C.paper }} />
        </View>
        <View style={{ position: 'absolute', left: 61, top: 53, width: 15, height: 15, borderRadius: 8, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2f4a12' }} />
          <View style={{ position: 'absolute', left: 3, top: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: C.paper }} />
        </View>
        {/* smile */}
        <View style={{ position: 'absolute', left: 52, top: 64, width: 16, height: 9, borderBottomWidth: 3, borderColor: C.lime, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
      </View>
    </Animated.View>
  );
}
