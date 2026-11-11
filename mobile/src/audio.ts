import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * The reference's AudioKit recipes, rendered to WAVs by
 * `scripts/gen-sounds.mjs` because React Native has no WebAudio.
 */
const SOURCES = {
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  heartLoss: require('../assets/sounds/heartLoss.wav'),
  xpGain: require('../assets/sounds/xpGain.wav'),
  levelUp: require('../assets/sounds/levelUp.wav'),
  streakMilestone: require('../assets/sounds/streakMilestone.wav'),
  lessonComplete: require('../assets/sounds/lessonComplete.wav'),
  bossStart: require('../assets/sounds/bossStart.wav'),
  bossTick: require('../assets/sounds/bossTick.wav'),
  buttonPress: require('../assets/sounds/buttonPress.wav'),
  comboUp: require('../assets/sounds/comboUp.wav'),
  toggleOn: require('../assets/sounds/toggleOn.wav'),
  toggleOff: require('../assets/sounds/toggleOff.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

let enabled = true;
let configured = false;
const players = new Map<SoundName, AudioPlayer>();

/** Mirrors `P.settings.sound`; called from the store-aware root. */
export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function configure() {
  if (configured) return;
  configured = true;
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch(() => {});
}

/** Lazily create a player on first use, after a user gesture. */
export function playSound(name: SoundName) {
  if (!enabled) return;
  configure();
  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = 0.6;
      players.set(name, player);
    }
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Audio is a nice-to-have; never let a device codec issue break a session.
  }
}

export function stopSounds() {
  for (const player of players.values()) {
    try {
      player.pause();
    } catch {
      // ignore
    }
  }
}
