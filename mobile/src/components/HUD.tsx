import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../data/curriculum';
import { useStore } from '../store';
import { C, R, T } from '../theme';
import { fmtCountdown, xpProgress } from '../utils';
import { HeartsModal, ShopModal } from './Modals';

export function HUD({ onStats }: { onStats: () => void }) {
  const { state, refillWithGems, buyOneHeart } = useStore();
  const [modal, setModal] = useState<null | 'hearts' | 'shop'>(null);
  const xp = xpProgress(state.xp);
  const nextIn = Math.max(0, CONFIG.heartsRefillMinutes * 60000 - (Date.now() - state.heartsRefilledAt));

  return (
    <>
      <View style={styles.hud}>
        <Pressable style={styles.xpBlock} onPress={onStats} accessibilityLabel={`Level ${xp.lv}, ${state.xp} XP. Open stats`}>
          <View style={styles.level}>
            <Text style={styles.levelText}>{xp.lv}</Text>
          </View>
          <Ionicons name="sparkles" size={17} color={C.goldDark} />
          <View style={styles.xpTextRow}>
            <Text style={styles.xpNum}>{state.xp}</Text>
            <Text style={styles.xpCap}>XP</Text>
          </View>
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${Math.round(xp.ratio * 100)}%` }]} />
          </View>
        </Pressable>

        <Pressable style={styles.stat} onPress={() => setModal('shop')} accessibilityLabel={`${state.gems} gems. Open shop`}>
          <Ionicons name="diamond" size={18} color={C.beet} />
          <Text style={[styles.statNum, { color: C.beet }]}>{state.gems}</Text>
        </Pressable>

        <Pressable
          style={[styles.stat, state.hearts === 0 ? styles.heartOut : null]}
          onPress={() => setModal('hearts')}
          accessibilityLabel={`${state.hearts} of ${CONFIG.heartsMax} hearts. Open refill timer`}
        >
          <Ionicons name={state.hearts > 0 ? 'heart' : 'heart-outline'} size={18} color={C.red} />
          <Text style={[styles.statNum, { color: C.red }]}>{state.hearts}</Text>
        </Pressable>
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
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: C.paper,
    borderBottomWidth: 2,
    borderBottomColor: C.swan,
  },
  xpBlock: {
    flex: 1,
    backgroundColor: C.eelLight,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 5,
  },
  level: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { color: C.paper, fontWeight: '800', fontSize: 11 },
  xpTextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flex: 1 },
  xpNum: { fontSize: 19, fontWeight: '800', color: C.greenDark, fontVariant: ['tabular-nums'] },
  xpCap: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9, color: C.greenDark, opacity: 0.6 },
  xpBarTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(88,204,2,0.16)', overflow: 'hidden' },
  xpBarFill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  stat: {
    width: 54,
    borderRadius: 14,
    backgroundColor: C.polar,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statNum: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heartOut: { backgroundColor: C.redPale },
});

export const hudSpacer = StyleSheet.create({ pad: { height: 8 } });
export const hudTitle = T.h3;
