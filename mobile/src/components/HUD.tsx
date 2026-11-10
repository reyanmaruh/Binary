import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { CONFIG } from '../data/curriculum';
import { useBump, useFloat } from '../motion';
import { useStore } from '../store';
import { C, R } from '../theme';
import { fmtCountdown, xpProgress } from '../utils';
import { HeartsModal, ShopModal } from './Modals';
import { Text } from './Text';

export function HUD({ onStats }: { onStats: () => void }) {
  const { state, refillWithGems, buyOneHeart } = useStore();
  const [modal, setModal] = useState<null | 'hearts' | 'shop'>(null);
  const xp = xpProgress(state.xp);
  const nextIn = Math.max(0, CONFIG.heartsRefillMinutes * 60000 - (Date.now() - state.heartsRefilledAt));

  const xpScale = useBump(state.xp, 1.03);
  const gemScale = useBump(state.gems, 1.07);
  const heartPulse = useFloat(state.hearts === 0, 3, 800);
  const lowHeart = state.hearts === 0;

  return (
    <>
      <View style={styles.hud}>
        <Animated.View style={{ flex: 1, transform: [{ scale: xpScale }] }}>
          <Animated.View style={{ flex: 1 }}>
            <Pressable
              style={styles.xpBlock}
              accessibilityRole="button"
              accessibilityLabel={`Level ${xp.lv}, ${state.xp} XP. Open stats`}
              onPress={onStats}
            >
              <View style={styles.level}>
                <Text style={styles.levelText}>{xp.lv}</Text>
              </View>
              <Ionicons name="sparkles" size={19} color={C.goldDark} />
              <View style={styles.xpTextRow}>
                <Text style={styles.xpNum}>{state.xp}</Text>
                <Text style={styles.xpCap}>XP</Text>
              </View>
              <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${Math.round(xp.ratio * 100)}%` }]} />
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: gemScale }] }}>
          <Pressable
            style={styles.stat}
            onPress={() => setModal('shop')}
            accessibilityRole="button"
            accessibilityLabel={`${state.gems} gems. Open shop`}
          >
            <Ionicons name="diamond" size={18} color={C.beet} />
            <Text style={[styles.statNum, { color: C.beet }]}>{state.gems}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={lowHeart ? heartPulse : undefined}>
          <Pressable
            style={[styles.stat, lowHeart ? styles.heartOut : null]}
            onPress={() => setModal('hearts')}
            accessibilityRole="button"
            accessibilityLabel={`${state.hearts} of ${CONFIG.heartsMax} hearts. Open refill timer`}
          >
            <Ionicons name={state.hearts > 0 ? 'heart' : 'heart-outline'} size={18} color={C.red} />
            <Text style={[styles.statNum, { color: C.red }]}>{state.hearts}</Text>
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.paper,
    borderBottomWidth: 2,
    borderBottomColor: C.swan,
    shadowColor: C.graphite,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  xpBlock: {
    flex: 1,
    backgroundColor: C.eelLight,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
    paddingLeft: 9,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 6,
  },
  level: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.greenDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  levelText: { color: C.paper, fontWeight: '700', fontSize: 11 },
  xpTextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flex: 1 },
  xpNum: { fontSize: 19, fontWeight: '700', color: C.greenDark, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  xpCap: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, color: C.greenDark, opacity: 0.6 },
  xpBarTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(88,204,2,0.16)', overflow: 'hidden' },
  xpBarFill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  stat: {
    borderRadius: 14,
    backgroundColor: C.polar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statNum: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  heartOut: { backgroundColor: C.heartPale },
});
