/**
 * Generates the app's UI sound effects as small mono WAV files.
 *
 * The reference web build synthesizes these live with WebAudio; React Native
 * cannot, so we render the same oscillator recipes offline and ship them as
 * assets. Run `node scripts/gen-sounds.mjs` after editing a recipe.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'assets', 'sounds');

const env = (t, dur, attack = 0.008) => {
  const a = Math.max(0.0001, attack);
  if (t < a) return t / a;
  const rest = Math.max(0.0001, dur - a);
  return Math.pow(0.0001, (t - a) / rest);
};

function renderSound(name, parts) {
  const ends = parts.map((p) => (p.delay || 0) + p.dur);
  const duration = Math.max(...ends);
  const length = Math.ceil((duration + 0.05) * RATE);
  const buf = new Float64Array(length);

  for (const p of parts) {
    const start = Math.floor((p.delay || 0) * RATE);
    const n = Math.floor(p.dur * RATE);
    if (p.noise) {
      let prev = 0;
      const cutoff = p.cutoff || 500;
      const rc = 1 / (2 * Math.PI * cutoff);
      const alpha = 1 / RATE / (rc + 1 / RATE);
      for (let i = 0; i < n; i++) {
        const white = Math.random() * 2 - 1;
        prev += alpha * (white - prev);
        buf[start + i] += prev * (p.gain ?? 0.3) * 1.6;
      }
      continue;
    }
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / RATE;
      const freq = p.slideTo ? p.freq * Math.pow(p.slideTo / p.freq, t / p.dur) : p.freq;
      phase += (2 * Math.PI * freq) / RATE;
      let wave;
      if (p.type === 'square') wave = Math.sin(phase) >= 0 ? 1 : -1;
      else if (p.type === 'triangle') wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
      else wave = Math.sin(phase);
      buf[start + i] += wave * (p.gain ?? 0.4) * env(t, p.dur, p.attack);
    }
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const norm = peak > 0.94 ? 0.94 / peak : 1;

  const data = Buffer.alloc(length * 2);
  for (let i = 0; i < length; i++) {
    const fade = Math.min(1, (length - i) / (RATE * 0.012));
    const v = Math.max(-1, Math.min(1, buf[i] * norm * fade));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(outDir, `${name}.wav`), Buffer.concat([header, data]));
  return length / RATE;
}

const T = (freq, dur, opts = {}) => ({ freq, dur, ...opts });
const seq = (freqs, dur, opts = {}) => freqs.map((freq, i) => T(freq, dur, { ...opts, delay: i * (opts.step || 0.09) }));

const SOUNDS = {
  correct: [T(880, 0.12, { type: 'triangle', gain: 0.4 }), T(1174.66, 0.18, { type: 'triangle', gain: 0.35, delay: 0.09 })],
  wrong: [
    T(150, 0.22, { type: 'sine', gain: 0.5, slideTo: 90, attack: 0.005 }),
    { noise: true, dur: 0.14, cutoff: 380, gain: 0.18 },
  ],
  heartLoss: [T(330, 0.14, { type: 'sine', gain: 0.3, slideTo: 220 }), T(196, 0.18, { type: 'sine', gain: 0.24, delay: 0.1 })],
  xpGain: [T(740, 0.07, { type: 'square', gain: 0.18 }), T(988, 0.09, { type: 'square', gain: 0.16, delay: 0.05 })],
  levelUp: seq([523.25, 659.25, 783.99, 1046.5], 0.18, { type: 'triangle', gain: 0.32, step: 0.09 }),
  streakMilestone: seq([659.25, 880, 1046.5, 1318.5], 0.16, { type: 'sine', gain: 0.3, step: 0.08 }),
  lessonComplete: seq([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.24, { type: 'triangle', gain: 0.3, step: 0.1 }),
  bossStart: seq([440, 440, 660], 0.1, { type: 'square', gain: 0.22, step: 0.16 }),
  bossTick: [T(1200, 0.035, { type: 'square', gain: 0.1 })],
  buttonPress: [T(300, 0.05, { type: 'sine', gain: 0.18 })],
  comboUp: [T(700, 0.08, { type: 'triangle', gain: 0.26 }), T(1050, 0.1, { type: 'triangle', gain: 0.22, delay: 0.06 })],
  toggleOn: [T(880, 0.09, { type: 'triangle', gain: 0.35 }), T(1320, 0.1, { type: 'triangle', gain: 0.3, delay: 0.05 })],
  toggleOff: [T(660, 0.09, { type: 'triangle', gain: 0.3 }), T(440, 0.1, { type: 'triangle', gain: 0.25, delay: 0.05 })],
};

mkdirSync(outDir, { recursive: true });
for (const [name, parts] of Object.entries(SOUNDS)) {
  const seconds = renderSound(name, parts);
  console.log(`${name}.wav  ${seconds.toFixed(2)}s`);
}
