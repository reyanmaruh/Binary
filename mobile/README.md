# Binary Trainer — React Native app

A native port of the single-file `index.html` trainer, built with Expo (SDK 58) and
React Native. No WebView: every screen is native components.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator) or scan the QR code with
Expo Go on a physical device. To run the web build of this app:

```bash
npm run web
```

Build installable binaries with EAS:

```bash
npx eas build --platform ios
npx eas build --platform android
```

## What is ported

- The full curriculum: 20 lessons, 311 items across 8 item types
  (`TAP`, `NUM`, `MCQ`, `MATCH`, `ORDER`, `SPOT`, `BLANK`) from `src/data/curriculum.ts`.
- Lesson theory pages, per-question feedback, combo tracking, hearts (5 max, 15 min
  refill, gem refills) and the 80% practice gate before the next lesson unlocks.
- Rewards engine identical to the web app: 10 gems on first clear, 25% XP on replay,
  a +5 gem personal-best bonus once per day, daily caps of 300 XP / 60 gems, stars
  derived from conversions per minute.
- Modes: lesson, practice, weak items (spaced repetition), 60 s speed run, flash
  round, and ghost race against your personal-best pace on any finished lesson.
- Screens: onboarding, path home with sticky HUD, player, results, practice hub,
  stats (chart + records) and settings (name, age, reduced motion, reset).
- The home path is a serpentine of lesson cards over an animated dashed connector,
  with a floating Start callout, star/crown markers and a practice pill under every
  unlocked lesson. Lesson sheets show accuracy/speed gates, missions and the ghost
  race entry point.
- Visual parity: the web palette, Space Grotesk (via `@expo-google-fonts`), 3D
  shelf buttons, and the CSS motion ported to the Animated API (screen entrances,
  bit flips, keypad pops, sheet/feedback springs, star and gem pops, mascot float).
- Persistence through AsyncStorage — the whole store is one JSON blob under
  `binary-trainer/v1`.

## Layout

```
App.tsx                 store provider, route stack, tab bar
src/store.tsx           state, persistence, hearts timer, rewards
src/data/curriculum.ts  generated from index.html (do not hand-edit)
src/screens/            Onboarding, Home, Player, Results, Practice, Stats, Settings
src/components/         Byte, HUD, Modals, Question, UI primitives
src/theme.ts            palette, fonts, radii, type scale (matches the web design)
src/motion.tsx          Press3D/Tap, FadeIn, pulse/mount/bump hooks
src/components/Text.tsx maps fontWeight onto Space Grotesk faces
```

## Differences from the web version

- Sound effects are not implemented (no WebAudio); haptics are used on answers instead.
- The ghost-race overlay on results was dropped.
- Theory illustrations render as their text/description panel rather than SVG art.
- The path's hover tooltips and the web's canvas confetti do not carry over; native
  press feedback and haptics stand in for them.
- `index.html` at the repo root is untouched and still works on its own.
