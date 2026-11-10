import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { CONFIG } from '../data/curriculum';
import { useBump, useFloat } from '../motion';
import { useStore } from '../store';
import { C } from '../theme';
import { xpProgress } from '../utils';
import { HeartsModal, ShopModal } from './Modals';
import { Text } from './Text';

/**
 * The sticky header: one wide XP tile that carries the level badge and the
 * level bar, plus compact gem and heart tiles. Everything is a single row of
 * equal-height tiles so it never reflows as the numbers grow.
 */
export function HUD({ onStats }: { onStats: () => void }) {
  const { state, refillWithGems, buyOneHeart } = useStore();
  const [modal, setModal] = useState<null | 'hearts' | 'shop'>(null);
  const xp = xpProgress(state.xp);
  const nextIn = Math.max(0, CONFIG.heartsRefillMinutes * 60000 - (Date.now() - state.heartsRefilledAt));

  const xpScale = useBump(state.xp, 1.03);
  const gemScale = useBump(state.gems, 1.07);
  const lowHeart = state.hearts === 0;
  const heartPulse = useFloat(lowHeart, 2, 800);

  return (
    <>
      <View style={styles.hud}>
        <Animated.View style={[styles.xpWrap, { transform: [{ scale: xpScale }] }]}>
          <Pressable
            style={({ pressed }) => [styles.xpTile, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel={`Level ${xp.lv}, ${state.xp} XP, ${xp.into} of ${xp.need} XP to level ${xp.lv + 1}. Open stats`}
            onPress={onStats}
          >
            <View style={styles.xpRow}>
              <View style={styles.level}>
                <Text style={styles.levelText}>{xp.lv}</Text>
              </View>
              <Ionicons name="sparkles" size={17} color={C.goldDark} />
              <Text style={styles.xpNum}>{state.xp}</Text>
              <Text style={styles.xpCap}>XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.round(xp.ratio * 100)}%` }]} />
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: gemScale }] }}>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
            onPress={() => setModal('shop')}
            accessibilityRole="button"
            accessibilityLabel={`${state.gems} gems. Open the gem shop`}
          >
            <Ionicons name="diamond" size={18} color={C.beet} />
            <Text style={[styles.tileNum, { color: C.beet }]}>{state.gems}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={lowHeart ? heartPulse : undefined}>
          <Pressable
            style={({ pressed }) => [styles.tile, lowHeart ? styles.heartOut : null, pressed ? styles.pressed : null]}
            onPress={() => setModal('hearts')}
            accessibilityRole="button"
            accessibilityLabel={`${state.hearts} of ${CONFIG.heartsMax} hearts. Open the refill timer`}
          >
            <Ionicons name={state.hearts > 0 ? 'heart' : 'heart-outline'} size={18} color={C.red} />
            <Text style={[styles.tileNum, { color: C.red }]}>{state.hearts}</Text>
          </Pressable>
        </Animated.View>
      </View>

      <HeartsModal
        visible={modal === 'hearts'}
        onClose={() => setModal(null)}
        hearts={state.hearts}
        gems={state.gems}
        nextIn={nextIn}
        onRefill={() => refillWithGems()}
        onOpenShop={() => setModal('shop')}
      />
      <ShopModal
        visible={modal === 'shop'}
        onClose={() => setModal(null)}
        gems={state.gems}
        hearts={state.hearts}
        onBuy={(kind) => {
          if (kind === 'full') refillWithGems();
          else buyOneHeart();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
    backgroundColor: C.paper,
    borderBottomWidth: 2,
    borderBottomColor: C.swan,
    shadowColor: C.graphite,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  xpWrap: { flex: 1, minWidth: 0 },
  xpTile: {
    flex: 1,
    backgroundColor: C.eelLight,
    borderRadius: 16,
    paddingLeft: 10,
    paddingRight: 11,
    paddingTop: 7,
    paddingBottom: 8,
    justifyContent: 'space-between',
    gap: 6,
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26 },
  level: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: C.greenDark,
    marginBottom: 1,
  },
  levelText: { color: C.paper, fontWeight: '700', fontSize: 11, lineHeight: 13 },
  xpNum: {
    fontSize: 19,
    fontWeight: '700',
    color: C.greenDark,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    lineHeight: 22,
  },
  xpCap: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, color: C.greenDark, opacity: 0.6 },
  xpTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(88,204,2,0.16)', overflow: 'hidden' },
  xpFill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  tile: {
    height: '100%',
    minWidth: 58,
    borderRadius: 16,
    backgroundColor: C.polar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 11,
  },
  tileNum: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  heartOut: { backgroundColor: C.heartPale },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
