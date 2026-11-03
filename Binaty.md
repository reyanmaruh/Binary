# MASTER BUILD PROMPT — "BINARY TRAINER"

You are a senior front-end engineer and interaction designer. Build **"Binary Trainer"** — a gamified, speed-focused, single-file web app that teaches decimal↔binary conversion. Model the learning loop on Duolingo. Model the speed training on TypingClub. Ship a single, self-contained `index.html` file.

Everything you need is below. Do not ask clarifying questions — if something is ambiguous, pick the option most consistent with the design system and the acceptance criteria. Build in the phased order given at the end. After each phase, output a short summary and pause for testing.

---

## 1. HARD CONSTRAINTS

1. **Single file.** All HTML, CSS, and JS inline in `index.html`. No build step, no npm, no CDNs, no external CSS frameworks. Vanilla JS only. Must run by double-clicking the file.
2. **No backend.** All progress in `localStorage`. No accounts, no network calls.
3. **No leaderboard.** Competition comes from time pressure, personal bests, ghost races, combos, speed tiers, boss runs, and flash rounds only.
4. **Desktop + mobile equally.** Full keyboard support (1–8 bit toggles, number typing, Enter to submit) AND full touch support (large tap targets, on-screen number pad for numeric input). Responsive down to 320px.
5. **Animations are a first-class requirement** — not polish. Every interactive element has hover, press, and transition states. Every state change is animated. See §5.
6. **Sounds are present**, enabled by default, with a visible toggle. Synthesize with Web Audio API (no files). Never harsh — wrong answers are a soft thud, correct answers a bright chime.
7. **Accessibility:** keyboard-navigable, ARIA labels on all controls, correct/wrong signaled by icon + color + text (never color alone), respects `prefers-reduced-motion`.
8. **Do not invent lesson content.** A `const LESSONS = [...]` array is at the bottom of this prompt (§12). Populate it exactly. Every lesson's theory and items must be rendered as specified. Only 9 exercise types exist — do not add new ones.
9. **Do not build octal or hex.** The data model should accommodate them (via `direction: "dec2bin" | "bin2dec"` being extendable), but no content and no UI for them in this version.

---

## 2. PRODUCT SUMMARY

A user progresses along a vertical lesson path (Duolingo-style). Each lesson has two parts: **theory** (2–4 short teaching screens) followed by **practice** (12–25 interactive exercises). Lessons teach one new concept and drill it under increasing time pressure.

Progress = XP, levels, daily streak, hearts, gems. Skill = **CPM** (conversions per minute) and **accuracy**, tracked per lesson and per direction (dec→bin, bin→dec). The competitive engine is entirely solo: **ghost race** (race your own best), **speed tiers** (unlock stars by hitting CPM gates), **combo multiplier** (consecutive fast-correct answers), **boss runs** (60-second timed), **flash rounds** (1.5s per item), and a **speed streak** (consecutive days you beat a personal best).

---

## 3. FILE STRUCTURE

Inside `index.html`, organize in this order with big banner comments:

```
<!-- ===== CONFIG ===== -->
<!-- ===== DESIGN SYSTEM / CSS ===== -->
<!-- ===== LESSON DATA (const LESSONS) ===== -->
<!-- ===== UTILITIES (storage, audio, animation) ===== -->
<!-- ===== STATE ===== -->
<!-- ===== SCREENS: HOME / PATH ===== -->
<!-- ===== SCREENS: THEORY VIEWER ===== -->
<!-- ===== SCREENS: LESSON PLAYER ===== -->
<!-- ===== SCREENS: RESULTS ===== -->
<!-- ===== SCREENS: PRACTICE HUB ===== -->
<!-- ===== SCREENS: PROFILE / STATS ===== -->
<!-- ===== EXERCISE RENDERERS (one per type) ===== -->
<!-- ===== APP INIT ===== -->
```

---

## 4. CONFIG BLOCK (put all tunables here, at top of script)

```js
const CONFIG = {
  heartsMax: 5,
  heartsRefillMinutes: 60,
  xpPerLesson: 10,
  xpPerPractice: 5,
  xpPerBoss: 50,
  comboWindowMs: 3000,
  comboMaxMultiplier: 3,
  cpm: {
    dec2bin: [10, 20, 35, 50],
    bin2dec: [15, 25, 45, 60]
  },
  accuracyGate: 0.90,
  bossDurationSec: 60,
  flashItemMs: 1500,
  sessionItemCap: 20
};
```

`cpm` array = tier gates for stars: `[pass, good, great, legendary]`.

---

## 5. DESIGN SYSTEM

**Feel:** Duolingo-quality tactile. Chunky rounded buttons, soft shadows, generous whitespace, satisfying press states, bright accents, one primary action per screen. Friendly, not corporate.

**Palette (own brand, circuit-flavored — not a Duolingo copy):**
- Background `#F7F9FC`
- Surface `#FFFFFF`
- Text primary `#1F2937`, secondary `#6B7280`
- Primary accent (bit ON, correct, CTA) `#22C55E`
- Secondary accent (links, highlights) `#06B6D4`
- Bit OFF `#CBD5E1`
- Error `#EF4444`
- Warning (hearts low) `#F59E0B`
- Legendary `#A855F7`

**Typography:** system stack (`-apple-system, 'Segoe UI', Roboto, sans-serif`). Headings 600/700, body 400/500. Line-height 1.5.

**Shape:** cards `border-radius: 16px`; buttons `12px`; pills `999px`. Interactive elements use `border: 2px solid` — Duolingo's "toy" feel. Buttons use a hard bottom shadow (`box-shadow: 0 4px 0 rgba(0,0,0,0.15)`) that collapses on press. Cards use soft ambient shadow.

**Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48.

**Tap targets:** minimum 44×44px.

---

## 6. ANIMATION SYSTEM (MANDATORY)

Use CSS transitions/keyframes + a few JS-driven animations. **Every interactive element must have hover, focus, and press states.** Respect `prefers-reduced-motion` (disable large motion; keep only opacity fades).

Required:

- **Buttons:** hover = lift 2px + shadow grows; press = scale 0.96 + shadow collapses (60ms ease); focus = 3px accent ring. Transition 120ms.
- **Bit toggles (TAP):** flip animation on toggle (spring scale 1 → 1.15 → 1), glow pulse on ON state, place-value label brightens when ON.
- **Correct answer:** green flash, small bounce (scale 1 → 1.08 → 1), XP ticker flies up from the check button, particles for streak milestones.
- **Wrong answer:** horizontal shake (±6px, 3 cycles, 300ms), red flash, feedback panel slides up from bottom (translateY(100%) → 0, spring, 350ms).
- **Progress bar:** fills with spring easing; each segment pops when it fills.
- **Card entry (lesson path):** slide-up + fade, staggered 50ms per node.
- **Page transitions:** slide left (forward) / slide right (back), 280ms.
- **Mascot:** idle bob (2s loop, translateY ±4px), blink (random 4–8s), worried on heart loss, celebrate on lesson complete (jump + spin).
- **Streak flame:** flicker (scale + opacity, 800ms loop) when active; grey + static when inactive.
- **XP counter:** odometer roll on value change.
- **Number input:** each digit pops in (scale 0.8 → 1, 120ms).
- **Chart place-values:** stagger fade-in when chart first appears (50ms delay per place).
- **Boss timer:** pulses red + scale when under 10s; ticking sound.
- **Ghost race:** ghost marker animates along the progress bar at the pace of your personal best. Green if you're ahead, orange if behind.
- **Combo meter:** flames grow with multiplier; "fizzle" on break.
- **Lesson complete:** confetti burst, mascot celebrates, results cards slide up staggered.
- **Hover on lesson nodes:** lift + shadow grow + tooltip fades in.

**Timing:** UI feedback 100–150ms; state transitions 250–350ms; celebrations 600–1200ms. Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful motion, `ease-out` for functional.

---

## 7. SOUND SYSTEM

Synthesize with Web Audio API. All sounds < 400ms, soft, musical. Master volume 0.3. One global toggle in settings, persisted.

Required sounds: `toggleOn`, `toggleOff`, `correct` (bright two-note chime), `wrong` (soft low thud, not buzzer), `heartLoss`, `xpGain`, `levelUp`, `streakMilestone`, `lessonComplete`, `bossStart` (three beeps), `bossTick`, `buttonPress`, `comboUp`.

No hover sounds. Mute all sounds during `prefers-reduced-motion` unless user re-enables.

---

## 8. DATA SCHEMAS

### Lesson object (already populated in §12)

```js
{
  id: "1.1",
  section: 1,
  unit: 1,
  title: "On & Off",
  subtitle: "A bit is just a switch",
  newConcept: "One sentence — the single thing this lesson teaches.",
  scaffold: { chart: true, hints: true, timer: false },
  xp: 10,
  passCriteria: { accuracy: 0.80, cpm: null },
  theory: [
    { heading: "...", body: "...", visual: "...", takeaway: "..." }
  ],
  items: [ /* exercise objects */ ]
}
```

- `scaffold.chart` — show the place-value chart by default?
- `scaffold.hints` — enable step hints?
- `scaffold.timer` — show a timer during practice?
- `theory[].visual` — a hint for YOU (the coding AI) about what to animate/render. Not user-facing text.

### Exercise objects (only these 9 types)

```js
{ type: "TAP", direction: "dec2bin", value: 100, showChart: true, showHints: false }
{ type: "NUM", direction: "bin2dec", bits: "10110100", showChart: true, autoSubmit: true }
{ type: "MCQ", prompt: "...", options: ["a","b","c","d"], answer: 2 }
{ type: "BLANK", direction: "dec2bin", value: 44, known: "001011__", answer: "00" }
{ type: "ORDER", items: ["16","8","4","2","1"], correctOrder: ["16","8","4","2","1"] }
{ type: "MATCH", pairs: [["0000","0"],["0001","1"],["0010","2"],["0011","3"]] }
{ type: "SPOT", direction: "dec2bin", value: 20, shown: "00010100", wrongBitIndex: 2 }
{ type: "FLASH", direction: "bin2dec", bits: "1010" }
{ type: "BOSS", durationSec: 60, pool: "dec2bin", max: 255 }
```

- `MCQ.answer` is **zero-based index** into `options`.
- `SPOT.wrongBitIndex` is **zero-based from the right**; it identifies the one bit in `shown` that is wrong vs. the correct answer.
- `TAP.value` — the target decimal. The renderer computes the correct binary.
- `NUM.bits` — the binary string. The renderer computes the correct decimal.
- `BLANK.known` — the item with blanks as `_`. `BLANK.answer` — the exact string to fill.

### Progress object (`localStorage`, key `binaryTrainer.v1`)

```js
{
  xp: 0, level: 1, gems: 0, hearts: 5, heartsRefilledAt: 0,
  streak: { count: 0, lastDay: null, freeze: 0 },
  speedStreak: { count: 0, lastDay: null },
  lessons: {
    "1.1": { stars: 0, bestCpm: null, bestAccuracy: null,
             completed: false, attempts: 0, lastPlayed: null }
  },
  srs: { "<itemKey>": { nextDueLessonIndex: 0, errorCount: 0, lastSeen: null } },
  pbs: { dec2bin: null, bin2dec: null },
  settings: { sound: true, haptics: true, reducedMotion: false }
}
```

---

## 9. EXERCISE RENDERERS

Each type has a `render(exercise)` returning a DOM subtree, and `validate(input)` returning `{ correct, explanation }`. The `explanation` is the teaching payoff — for wrong answers, always explain *why*:

- TAP wrong → show the greedy walk: *"128 doesn't fit in 20. 64 doesn't fit. 32 doesn't fit. 16 fits → remainder 4. 4 fits → done. Answer: 00010100."*
- NUM wrong → show the nibble breakdown: *"10110100 = 1011 (11) × 16 + 0100 (4) = 176 + 4 = 180."*
- SPOT wrong → highlight which bit was actually wrong.
- BLANK wrong → show the full correct sequence and highlight the filled position.
- ORDER wrong → show the correct order side-by-side.
- MATCH wrong → briefly re-show the failed pair.

Every exercise reports `{ timeMs, correct }` to the lesson player.

---

## 10. LESSON PLAYER (state machine)

States: `IDLE → THEORY (if lesson has theory) → SHOWING_ITEM → AWAITING_INPUT → FEEDBACK → NEXT_ITEM → ... → COMPLETE | FAILED`

Rules:

- Theory runs first if `lesson.theory` exists: render each screen with a big **Continue** button. Progress dots for screens.
- Max `CONFIG.sessionItemCap` items per session, or all items if the lesson has fewer.
- Hearts start at `CONFIG.heartsMax`. Wrong answer = −1 heart. Hearts = 0 → `FAILED`.
- Correct answer = +XP × combo multiplier. Consecutive correct answers within `comboWindowMs` build combo: 1× → 1.5× → 2× → 3× (capped). Any wrong or slow answer resets combo.
- CPM = correct conversions / elapsed minutes (only counts TAP, NUM, FLASH items).
- Accuracy = correct / attempted.
- Timer UI visible if `scaffold.timer` is true or the item is BOSS.
- **BOSS override:** instead of N items, run for `durationSec` seconds, auto-generate items from `pool` and `max`. Result = count correct + CPM.
- **Ghost race:** if the lesson has `bestCpm`, render a ghost marker on the progress bar moving at that pace.
- Progress bar: segmented (one per item), or continuous for BOSS.
- Top bar: progress bar, hearts (fill animation on loss), X (confirm: "You'll lose progress"), streak flame, live XP counter.
- Bottom: single big **Check** button (or auto-submit for NUM). No "Next" button — Check advances.

**On COMPLETE:**
- Update progress. XP awarded. If `bestCpm` beaten → update + increment `speedStreak` if new day → trigger "New personal best!" celebration.
- Confetti, mascot celebrates, results screen slides up.
- Results show: accuracy, CPM, XP earned, PB status, and buttons **Next lesson / Retry for speed / Home**.

**On FAILED:**
- Results screen: "Out of hearts." Buttons: **Retry** (refills hearts for this session) / **Practice weak items** / **Home**. No XP awarded.

---

## 11. GAMIFICATION / PRESSURE SYSTEMS

Implement all of these. There is no leaderboard — pressure comes from self-competition.

1. **XP & Levels.** XP from lessons (10), practice (5), boss (50). Level = `floor(sqrt(xp/25)) + 1`. Level-up shows a modal + fanfare.
2. **Daily streak.** Increments if a lesson completes on a new calendar day. Visible flame. Freeze purchasable with gems (200), auto-consumed if a day would be missed.
3. **Hearts.** 5 max, refill 1 per `heartsRefillMinutes` (display countdown). Lose one per wrong answer. Persist.
4. **Gems.** +10 per lesson, +50 per boss, +5 per PB. Spend: heart refill (50), streak freeze (200).
5. **Speed tier gates → stars.** Each lesson has `passCriteria`. Stars: ⭐ pass · ⭐⭐ `cpm.good` · ⭐⭐⭐ `cpm.great`. Crown 👑 at `cpm.legendary`. Shown on the lesson node.
6. **Ghost race.** Every replay after the first races your previous best CPM — explicit visual: "You vs. You."
7. **Combo multiplier.** Consecutive fast-correct answers build 1× → 1.5× → 2× → 3×. Visible meter with a flame.
8. **Personal bests.** Per direction. Shown on profile. Beating one = celebration + speedStreak increment.
9. **Speed streak.** Consecutive days you beat a personal best. Displayed on home next to the daily streak. This is the core competitive hook.
10. **Flash rounds.** Practice mode: 1.5s per item, no hints, forced fast answers. Best CPM tracked.
11. **Boss runs.** 60s timed runs, no hints, no chart. Beat your own best.
12. **Practice hub.** "Practice weak items" (SRS due), "Speed run" (free boss), "Flash round", "Ghost race" (pick a lesson, race your best).

*Do not implement: leagues, global leaderboards, friends, chat, multiplayer.*

---

## 12. SCREENS

**Home (Path):** Vertical winding path of lesson nodes, grouped by unit. Node states: locked / available (pulse) / in-progress (ring) / complete (check + stars) / legendary (purple crown). Top HUD: streak flame, speed streak, hearts, gems, XP/level. Mascot reactive. Tap node → bottom sheet with **Start / Practice / Ghost race**.

**Theory Viewer:** Full-screen teaching screens. Big heading, body, animated visual (per `theory[].visual`), takeaway pill. Progress dots. **Continue** button. Back arrow.

**Lesson Player:** Full-screen. Minimal chrome. Center: the exercise, huge, centered. Top: progress bar, hearts, X. Bottom: single Check button. Feedback panel slides up from bottom.

**Results:** Confetti, mascot, stat cards sliding up staggered. Buttons as in §10.

**Practice Hub:** Four large cards: **Weak items** (SRS due count), **Speed run**, **Flash round**, **Ghost race**. Each shows a small stat.

**Profile / Stats:** Level, XP bar, total conversions, daily streak, speed streak, PB per direction, chart of CPM over last 30 days, badge wall (placeholders ok for v1).

**Settings:** Sound toggle, haptics toggle, reduced motion toggle, reset progress (confirm).

---

## 13. PERSISTENCE

Save progress to `localStorage` on every meaningful change (debounced 500ms). Load on init. Hidden "reset progress" in settings.

---

## 14. BUILD PHASES (in this exact order)

**Phase 1 — Foundation.**
Config block, design system CSS, utilities (storage, audio synth, animation helpers), state object, home/path screen rendered from `LESSONS`, navigation shell. App boots to a beautiful path screen even with no interactions yet.

**Phase 2 — Theory + Lesson Player + TAP + NUM.**
Implement theory viewer, lesson player state machine, TAP renderer, NUM renderer, Check button, feedback panel, progress bar, hearts, XP tracking, completion flow, results screen. Fully playable end-to-end for TAP/NUM lessons.

**Phase 3 — Remaining exercise types.**
MCQ, BLANK, ORDER, MATCH, SPOT, FLASH, BOSS. One at a time.

**Phase 4 — Gamification layer.**
Streak, gems, levels, speed tiers/stars, personal bests, speed streak, ghost race, combo multiplier. Full persistence.

**Phase 5 — Practice hub + Profile.**
SRS engine, practice sessions, boss entry, flash entry, ghost race entry, full profile screen.

**Phase 6 — Polish pass.**
All §6 animations. All §7 sounds. Mobile responsiveness audit. Accessibility audit. Reduced-motion audit. Hover states everywhere.

**After each phase: output a short summary and pause for testing.**

---

## 15. WHAT NOT TO DO

- No React, Vue, Tailwind, or any framework/CDN.
- No network requests.
- No leaderboard, login, or multi-user anything.
- Do not invent lesson content — use §16 exactly.
- Do not skip animations.
- Do not build octal or hex.
- Do not add new exercise types beyond the 9 listed.
- Do not render `items` before `theory` — theory must always come first when present.

---

## 16. THE CURRICULUM (`const LESSONS = [...]`)

Paste this exactly into the file. **Do not modify numbers, answers, or indices.**

```js
const LESSONS = [
  // ============================================================
  // SECTION 1 — FOUNDATIONS
  // ============================================================

  // ----- Lesson 1.1 -----
  {
    id: "1.1", section: 1, unit: 1,
    title: "On & Off", subtitle: "A bit is just a switch",
    newConcept: "A bit has exactly two states: 0 (off) and 1 (on).",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "What is a bit?",
        body: "A bit is the smallest piece of information a computer can hold. It has exactly two states: off (0) and on (1). That's it. No in-between.",
        visual: "A light bulb toggling between grey/off and bright/on, labeled 0 / 1.",
        takeaway: "One bit = one switch. Off or on."
      },
      {
        heading: "Everything is switches",
        body: "Computers don't think in numbers — they think in switches. Millions of tiny on/off switches. Binary is just how we write down which switches are on.",
        visual: "Eight light bulbs in a row, some on, some off.",
        takeaway: "Binary = writing down which switches are on (1) and off (0)."
      }
    ],
    items: [
      { type: "MCQ", prompt: "How many states does a bit have?", options: ["1","2","10","8"], answer: 1 },
      { type: "MCQ", prompt: "Which of these is a bit?", options: ["2","1","5","9"], answer: 1 },
      { type: "MCQ", prompt: "What does 1 mean for a bit?", options: ["Off","On","Both","Neither"], answer: 1 },
      { type: "MCQ", prompt: "What does 0 mean for a bit?", options: ["Off","On","Both","Neither"], answer: 0 },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 0, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 0, showChart: true, showHints: false },
      { type: "MCQ", prompt: "How many bits are ON in 00000001?", options: ["1","2","8","0"], answer: 0 },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 0, showChart: false, showHints: false },
      { type: "MCQ", prompt: "Binary uses which two symbols?", options: ["1 and 2","0 and 1","A and B","1 and 10"], answer: 1 }
    ]
  },

  // ----- Lesson 1.2 -----
  {
    id: "1.2", section: 1, unit: 1,
    title: "Two Switches", subtitle: "Two bits, four patterns",
    newConcept: "Two bits combine into four patterns: 00, 01, 10, 11.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "2 bits, 4 states",
        body: "One bit has 2 states. Add a second bit and now there are 4: 00, 01, 10, 11. Each new bit doubles the number of patterns.",
        visual: "Two bulbs cycling through all four combinations.",
        takeaway: "2 bits = 4 patterns."
      },
      {
        heading: "The pattern doubles",
        body: "1 bit → 2. 2 bits → 4. 3 bits → 8. 4 bits → 16. Every added bit doubles the possibilities. This doubling is why place values will double.",
        visual: "A table growing: 1→2, 2→4, 3→8, 4→16, 5→32, 6→64, 7→128, 8→256.",
        takeaway: "Each extra bit doubles the patterns."
      }
    ],
    items: [
      { type: "MCQ", prompt: "How many patterns do 2 bits have?", options: ["1","2","4","8"], answer: 2 },
      { type: "MCQ", prompt: "How many patterns do 3 bits have?", options: ["4","8","16","2"], answer: 1 },
      { type: "MCQ", prompt: "How many patterns do 4 bits have?", options: ["8","16","32","4"], answer: 1 },
      { type: "MCQ", prompt: "How many bits are needed for 32 patterns?", options: ["4","5","6","8"], answer: 1 },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 3, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 3, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 3, showChart: false, showHints: false },
      { type: "MCQ", prompt: "Which pattern is NOT possible with 2 bits?", options: ["00","01","10","22"], answer: 3 },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 1.3 -----
  {
    id: "1.3", section: 1, unit: 1,
    title: "The Doubling Rule", subtitle: "Every place doubles to the left",
    newConcept: "Each place in binary is worth exactly double the place to its right.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "Reading right to left",
        body: "In binary, position matters. Rightmost bit is worth 1. Next is 2. Next is 4. Next is 8. Each is double the one before.",
        visual: "Bulbs lighting up in sequence: 1 → 2 → 4 → 8 → 16, each double the last.",
        takeaway: "Binary place values double as you go left: 1, 2, 4, 8, 16, 32…"
      },
      {
        heading: "Why?",
        body: "Because each new bit doubles the patterns (Lesson 1.2). Place values come from that doubling.",
        visual: "Chart with arrows showing ×2 between each position.",
        takeaway: "Doubling places ↔ doubling patterns."
      }
    ],
    items: [
      { type: "ORDER", items: ["4","1","16","2","8"], correctOrder: ["1","2","4","8","16"] },
      { type: "ORDER", items: ["4","16","1","8","2"], correctOrder: ["16","8","4","2","1"] },
      { type: "MCQ", prompt: "After 4 comes…?", options: ["5","6","8","16"], answer: 2 },
      { type: "MCQ", prompt: "After 32 comes…?", options: ["33","48","64","128"], answer: 2 },
      { type: "MCQ", prompt: "What's double 16?", options: ["20","24","32","8"], answer: 2 },
      { type: "MCQ", prompt: "What's double 64?", options: ["65","100","128","256"], answer: 2 },
      { type: "MCQ", prompt: "What's half of 32?", options: ["8","16","24","64"], answer: 1 },
      { type: "MATCH", pairs: [["Bit 1","1"],["Bit 2","2"],["Bit 3","4"],["Bit 4","8"]] },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: false, showHints: false },
      { type: "MCQ", prompt: "Which is a valid binary place value?", options: ["3","6","10","16"], answer: 3 }
    ]
  },

  // ----- Lesson 1.4 -----
  {
    id: "1.4", section: 1, unit: 1,
    title: "The 8-bit Chart", subtitle: "128 64 32 16 8 4 2 1",
    newConcept: "A byte has 8 places: 128, 64, 32, 16, 8, 4, 2, 1.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "The full chart",
        body: "A byte = 8 bits. Left to right: 128, 64, 32, 16, 8, 4, 2, 1. Memorize this chart. Every conversion in the app uses it.",
        visual: "8 bulbs above place values, all off. Chart pinned at top.",
        takeaway: "8 bits. Values: 128 64 32 16 8 4 2 1."
      },
      {
        heading: "Reading it",
        body: "Each bulb is worth its value only when on. 10000000 = 128. 01000000 = 64. 00000001 = 1. 11111111 = 255 (all bits on).",
        visual: "Animate each example on the chart.",
        takeaway: "Bit on = take that value. Add them up."
      }
    ],
    items: [
      { type: "ORDER", items: ["16","128","4","64","1","32","2","8"], correctOrder: ["128","64","32","16","8","4","2","1"] },
      { type: "MATCH", pairs: [["Bit 8 (leftmost)","128"],["Bit 7","64"],["Bit 6","32"],["Bit 5","16"]] },
      { type: "MCQ", prompt: "The leftmost bit in a byte is worth…?", options: ["1","64","128","256"], answer: 2 },
      { type: "MCQ", prompt: "The rightmost bit is worth…?", options: ["0","1","2","128"], answer: 1 },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: true, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "10000000", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "01000000", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000001", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "11111111", showChart: true, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 2.1 -----
  {
    id: "2.1", section: 1, unit: 2,
    title: "Count to 3", subtitle: "00, 01, 10, 11",
    newConcept: "Counting in binary follows the same logic as decimal — but you carry after 1.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "Counting",
        body: "In decimal, after 9 you carry → 10. In binary, after 1 you carry. So counting is: 0, 1, 10, 11, 100, 101…",
        visual: "Side-by-side: decimal 0–8 and binary 0–1000, incrementing together.",
        takeaway: "Same counting, but you carry earlier."
      },
      {
        heading: "The rhythm",
        body: "The rightmost bit flips every step. The next bit flips every 2 steps. The next every 4. The rhythm of binary is built in.",
        visual: "Flipping bulbs on a 3-bit counter with a beat.",
        takeaway: "Each bit has its own flip rhythm: 1, 2, 4, 8…"
      }
    ],
    items: [
      { type: "MCQ", prompt: "In binary, after 1 comes…?", options: ["2","10","11","0"], answer: 1 },
      { type: "MCQ", prompt: "In binary, after 10 comes…?", options: ["11","20","100","01"], answer: 0 },
      { type: "MCQ", prompt: "After 11 comes…?", options: ["12","100","101","10"], answer: 1 },
      { type: "ORDER", items: ["11","01","00","10"], correctOrder: ["00","01","10","11"] },
      { type: "ORDER", items: ["100","000","110","010","101","001","111","011"], correctOrder: ["000","001","010","011","100","101","110","111"] },
      { type: "TAP", direction: "dec2bin", value: 0, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 3, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 3, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00000011", showChart: true, autoSubmit: true },
      { type: "BLANK", direction: "dec2bin", value: 3, known: "000000__", answer: "11" }
    ]
  },

  // ----- Lesson 2.2 -----
  {
    id: "2.2", section: 1, unit: 2,
    title: "Watch the Carry", subtitle: "1 + 1 = 10",
    newConcept: "Adding 1 to a bit that is already 1 makes it 0 and carries 1 to the left.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "The carry",
        body: "Decimal: 9 + 1 = 10, you carry. Binary: 1 + 1 = 10. You turn the bit off and turn on the next bit to the left.",
        visual: "Animate 0011 + 1 = 0100. Bit flips, carry ripples.",
        takeaway: "When a 1 meets a 1, carry left."
      },
      {
        heading: "Carries chain",
        body: "0111 + 1 chains three times → 1000. When everything is on, adding 1 turns all off and turns on a new left bit.",
        visual: "Chain carry animation across 3 bits.",
        takeaway: "111 + 1 = 1000. Chain carries happen."
      }
    ],
    items: [
      { type: "MCQ", prompt: "What is 1 + 1 in binary?", options: ["2","10","11","0"], answer: 1 },
      { type: "MCQ", prompt: "What is 11 + 1?", options: ["12","100","101","10"], answer: 1 },
      { type: "MCQ", prompt: "What is 111 + 1?", options: ["1111","1000","1001","1100"], answer: 1 },
      { type: "MCQ", prompt: "What is 0111 + 1?", options: ["0110","1000","1111","0100"], answer: 1 },
      { type: "SPOT", direction: "dec2bin", value: 8, shown: "00001010", wrongBitIndex: 1 },
      { type: "SPOT", direction: "dec2bin", value: 4, shown: "00000110", wrongBitIndex: 1 },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: true, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00000100", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001000", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001111", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00010000", showChart: true, autoSubmit: true }
    ]
  },

  // ----- Lesson 2.3 -----
  {
    id: "2.3", section: 1, unit: 2,
    title: "Count to 15", subtitle: "All sixteen 4-bit patterns",
    newConcept: "A 4-bit number has 16 patterns: 0000 through 1111, values 0–15.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "The full nibble table",
        body: "0000=0, 0001=1, 0010=2, 0011=3, … 1111=15. Sixteen patterns — the nibbles you'll see throughout the app.",
        visual: "Table of all 16 nibbles appearing in a grid.",
        takeaway: "16 nibbles. Every 4 bits maps to 0–15."
      },
      {
        heading: "A nibble in a byte",
        body: "A byte has two nibbles: high 4 bits and low 4 bits. The high nibble is worth ×16. This will matter for chunking later.",
        visual: "Byte 10110100 split into two colored halves: 1011 and 0100.",
        takeaway: "Byte = two nibbles. High nibble × 16 + low nibble."
      }
    ],
    items: [
      { type: "MATCH", pairs: [["0000","0"],["0001","1"],["0010","2"],["0011","3"],["0100","4"],["0101","5"],["0110","6"],["0111","7"]] },
      { type: "MATCH", pairs: [["1000","8"],["1001","9"],["1010","10"],["1011","11"],["1100","12"],["1101","13"],["1110","14"],["1111","15"]] },
      { type: "NUM", direction: "bin2dec", bits: "00000101", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001010", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001111", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000011", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001100", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001001", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000110", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001110", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000111", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001011", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001101", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000100", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001000", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000010", showChart: false, autoSubmit: true }
    ]
  },

  // ----- Lesson 2.4 -----
  {
    id: "2.4", section: 1, unit: 2,
    title: "One Bit On", subtitle: "Powers of 2",
    newConcept: "Numbers that are powers of 2 (1, 2, 4, 8, 16, 32, 64, 128) are a single bit turned on.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.80, cpm: null },
    theory: [
      {
        heading: "The elegant fact",
        body: "00000001 = 1. 00000010 = 2. 00000100 = 4. 00010000 = 16. Each is exactly one bit on. These are called powers of 2 — the foundation of all binary math.",
        visual: "Bulbs lighting one at a time, each labeled with its value.",
        takeaway: "One bit on = a power of 2."
      }
    ],
    items: [
      { type: "MCQ", prompt: "Which is a power of 2?", options: ["3","6","8","12"], answer: 2 },
      { type: "MCQ", prompt: "Which is NOT a power of 2?", options: ["2","4","6","16"], answer: 2 },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: true, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00100000", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "01000000", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000010", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000100", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 2.5 (Checkpoint 1) -----
  {
    id: "2.5", section: 1, unit: 2,
    title: "Checkpoint 1", subtitle: "Foundations check",
    newConcept: "Combine everything from Units 1–2. No new content.",
    scaffold: { chart: false, hints: false, timer: true },
    xp: 10,
    passCriteria: { accuracy: 0.85, cpm: null },
    theory: [
      {
        heading: "Foundations check",
        body: "No new content. This mixes everything from Units 1 and 2. No chart. No hints. Timer on. Aim for 85% or better.",
        visual: "A checklist ticking through: bits, place values, counting, carries.",
        takeaway: "Show what you know."
      }
    ],
    items: [
      { type: "MCQ", prompt: "How many states does a bit have?", options: ["1","2","10","8"], answer: 1 },
      { type: "MCQ", prompt: "How many patterns do 4 bits have?", options: ["8","16","32","4"], answer: 1 },
      { type: "MCQ", prompt: "After 8 in place values comes…?", options: ["9","10","16","32"], answer: 2 },
      { type: "MCQ", prompt: "What is 1 + 1 in binary?", options: ["2","10","11","0"], answer: 1 },
      { type: "MCQ", prompt: "A power of 2 is…?", options: ["Any number","One bit on","Two bits on","Zero"], answer: 1 },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00000100", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00010000", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "01000000", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000011", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001111", showChart: false, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "10101010", showChart: false, autoSubmit: true },
      { type: "MATCH", pairs: [["0100","4"],["1000","8"],["1100","12"],["1111","15"]] },
      { type: "SPOT", direction: "dec2bin", value: 2, shown: "00000100", wrongBitIndex: 2 },
      { type: "ORDER", items: ["16","128","2","64","8","4","32","1"], correctOrder: ["128","64","32","16","8","4","2","1"] },
      { type: "MCQ", prompt: "11111111 = ?", options: ["254","255","256","128"], answer: 1 }
    ]
  },

  // ============================================================
  // SECTION 2 — DECIMAL → BINARY
  // ============================================================

  // ----- Lesson 3.1 -----
  {
    id: "3.1", section: 2, unit: 3,
    title: "One Bit Set", subtitle: "Each answer is one switch",
    newConcept: "Any power of 2 converts to binary by turning on exactly one bit.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 1.0, cpm: 20 },
    theory: [
      {
        heading: "Instant conversions",
        body: "If the decimal is 1, 2, 4, 8, 16, 32, 64, or 128 → flip that exact bit on and you're done. No math needed.",
        visual: "The chart, each bulb flashed with its decimal labeled.",
        takeaway: "Powers of 2 = single-bit answers."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 1, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 4, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 16, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 8, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 64, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 32, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 128, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 2, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 1, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 3.2 -----
  {
    id: "3.2", section: 2, unit: 3,
    title: "Two Bits Set", subtitle: "Sums of two powers",
    newConcept: "Numbers like 3, 5, 6, 9, 10, 12 are sums of exactly two powers of 2.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: 20 },
    theory: [
      {
        heading: "Two bits, one sum",
        body: "00000011 = 2 + 1 = 3. 00000101 = 4 + 1 = 5. 00001010 = 8 + 2 = 10. Two bits on = sum of two powers.",
        visual: "Two bulbs on with values added above.",
        takeaway: "Two bits = two powers added."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 3, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 5, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 6, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 9, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 10, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 12, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 20, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 40, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 72, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 96, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 5, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 9, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 6, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 10, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 20, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 12, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 3.3 -----
  {
    id: "3.3", section: 2, unit: 3,
    title: "The Greedy Method", subtitle: "Can I take 64?",
    newConcept: "To convert, ask left-to-right: 'Does this place value fit? If yes, subtract and set that bit to 1.'",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: null },
    theory: [
      {
        heading: "Walk 100",
        body: "128 fits in 100? No → 0. 64? Yes → 1, remainder 36. 32? Yes → 1, remainder 4. 16? No → 0. 8? No → 0. 4? Yes → 1, remainder 0. 2? No → 0. 1? No → 0. Result: 01100100 = 100.",
        visual: "Chart with each place flashing green (fits) or red (doesn't fit), running remainder shown.",
        takeaway: "Greedy: left-to-right, subtract if fits."
      },
      {
        heading: "Why it works",
        body: "Binary place values are exact. Every number has one and only one binary form. Greedy always produces that form — no backtracking needed.",
        visual: "Two-sided comparison: 100 → 01100100.",
        takeaway: "Greedy always works, first try."
      }
    ],
    items: [
      { type: "BLANK", direction: "dec2bin", value: 100, known: "0110__00", answer: "01" },
      { type: "TAP", direction: "dec2bin", value: 20, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 42, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 100, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 15, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 27, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 53, showChart: true, showHints: true },
      { type: "TAP", direction: "dec2bin", value: 100, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 42, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 27, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 53, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 15, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 20, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 42, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 100, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 15, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 3.4 -----
  {
    id: "3.4", section: 2, unit: 3,
    title: "Greedy Practice", subtitle: "Chart visible, hints off",
    newConcept: "Drill greedy subtraction on the full 0–255 range.",
    scaffold: { chart: true, hints: false, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: 20 },
    theory: [
      {
        heading: "Reminder",
        body: "Walk the chart left to right. If it fits, take it, subtract, move on. A wrong answer shows you the greedy walk to study.",
        visual: "Faint chart overlay with arrow moving left to right.",
        takeaway: "Left to right. Fit? Take. Subtract. Move on."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 7, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 11, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 19, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 23, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 33, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 50, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 67, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 90, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 127, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 150, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 180, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 200, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 250, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 99, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 88, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 222, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 13, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 101, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 176, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 255, showChart: true, showHints: false }
    ]
  },

  // ----- Lesson 4.1 -----
  {
    id: "4.1", section: 2, unit: 4,
    title: "Division by 2", subtitle: "Remainders, read bottom-up",
    newConcept: "Convert by repeatedly dividing by 2 and reading remainders bottom-up.",
    scaffold: { chart: true, hints: true, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.85, cpm: null },
    theory: [
      {
        heading: "The method",
        body: "Take 13. 13÷2 = 6 remainder 1. 6÷2 = 3 remainder 0. 3÷2 = 1 remainder 1. 1÷2 = 0 remainder 1. Read remainders bottom-up: 1101 = 13.",
        visual: "Division table building row by row, remainders highlighted, bottom-up arrow.",
        takeaway: "Divide by 2, collect remainders, read up."
      },
      {
        heading: "Slower but universal",
        body: "This method works for any number, any base. It's slower than greedy, but it's a good mental cross-check.",
        visual: "Side-by-side division and result. Caption: 'Slower than greedy — use greedy in practice.'",
        takeaway: "Know it, but don't use it for speed."
      }
    ],
    items: [
      { type: "ORDER", items: ["0","1","1","1"], correctOrder: ["1","1","0","1"] },
      { type: "ORDER", items: ["1","0","0","1"], correctOrder: ["1","0","1","0"] },
      { type: "MCQ", prompt: "13 ÷ 2 = 6 remainder…?", options: ["0","1","2","3"], answer: 1 },
      { type: "MCQ", prompt: "6 ÷ 2 = 3 remainder…?", options: ["0","1","2","3"], answer: 0 },
      { type: "NUM", direction: "bin2dec", bits: "00001101", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00001010", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00000111", showChart: true, autoSubmit: true },
      { type: "NUM", direction: "bin2dec", bits: "00011010", showChart: true, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 13, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 10, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 7, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 26, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 42, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 80, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 4.2 -----
  {
    id: "4.2", section: 2, unit: 4,
    title: "Why We Switch", subtitle: "Greedy is faster",
    newConcept: "Greedy is ~3× faster than division. Use greedy for all practice from here on.",
    scaffold: { chart: true, hints: false, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: 25 },
    theory: [
      {
        heading: "Compare",
        body: "100 via division: 7 divisions, 7 remainders. 100 via greedy: 3 yes/no questions (128? no. 64? yes. 32? yes. 4? yes). Greedy wins.",
        visual: "Two-column race — division on left, greedy on right, greedy finishes first.",
        takeaway: "Greedy — fewer steps, faster brain."
      }
    ],
    items: [
      { type: "MCQ", prompt: "Which is faster?", options: ["Division by 2","Greedy subtraction","Same","Neither"], answer: 1 },
      { type: "MCQ", prompt: "Greedy works because…?", options: ["It's random","Place values are exact","It doubles","You guess"], answer: 1 },
      { type: "SPOT", direction: "dec2bin", value: 50, shown: "00100010", wrongBitIndex: 4 },
      { type: "SPOT", direction: "dec2bin", value: 13, shown: "00000101", wrongBitIndex: 3 },
      { type: "TAP", direction: "dec2bin", value: 6, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 9, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 25, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 37, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 41, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 63, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 85, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 112, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 140, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 170, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 210, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 245, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 4.3 -----
  {
    id: "4.3", section: 2, unit: 4,
    title: "Greedy, No Hints", subtitle: "Chart visible, zero hints",
    newConcept: "Drill greedy with no scaffolding except the chart.",
    scaffold: { chart: true, hints: false, timer: false },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: 25 },
    theory: [
      {
        heading: "Speed now",
        body: "Chart stays visible. No more step-by-step. Aim for your first CPM target.",
        visual: "Chart anchored at top, timer appearing faintly.",
        takeaway: "Same method. Faster every round."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 12, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 21, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 34, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 48, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 59, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 72, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 88, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 97, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 105, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 118, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 127, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 133, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 147, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 162, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 178, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 189, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 203, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 218, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 234, showChart: true, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 251, showChart: true, showHints: false }
    ]
  },

  // ----- Lesson 5.1 -----
  {
    id: "5.1", section: 2, unit: 5,
    title: "Chart Off", subtitle: "No safety net",
    newConcept: "Chart hidden by default. Toggle allowed once per item.",
    scaffold: { chart: false, hints: false, timer: true },
    xp: 10,
    passCriteria: { accuracy: 0.9, cpm: 30 },
    theory: [
      {
        heading: "Trust the memory",
        body: "You've memorized 128 64 32 16 8 4 2 1. From now on, the chart is your safety net, not your crutch. Toggle only when stuck.",
        visual: "Chart slides off screen. Faint reminder of the eight numbers.",
        takeaway: "Chart = safety net, not crutch."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 17, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 29, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 45, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 63, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 81, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 99, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 113, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 126, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 142, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 157, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 173, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 189, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 204, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 221, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 236, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 248, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 31, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 66, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 88, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 111, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 5.2 -----
  {
    id: "5.2", section: 2, unit: 5,
    title: "Blind", subtitle: "No chart, no toggle",
    newConcept: "Pure conversion from memory.",
    scaffold: { chart: false, hints: false, timer: true },
    xp: 10,
    passCriteria: { accuracy: 0.95, cpm: 35 },
    theory: [
      {
        heading: "Blind drill",
        body: "No chart. No toggle. Pure memory. Aim for 95% accuracy and 35 CPM.",
        visual: "Empty screen with a single 8-bit input row, timer pulsing.",
        takeaway: "All memory. Full speed."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 18, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 33, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 47, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 61, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 76, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 92, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 108, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 123, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 137, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 151, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 166, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 182, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 197, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 213, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 228, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 244, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 255, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 0, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 85, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 170, showChart: false, showHints: false }
    ]
  },

  // ----- Lesson 5.3 (Boss) -----
  {
    id: "5.3", section: 2, unit: 5,
    title: "Boss: Speed Run", subtitle: "60 seconds. Convert as many as you can.",
    newConcept: "Timed test of dec→bin against your personal best.",
    scaffold: { chart: false, hints: false, timer: true },
    xp: 50,
    passCriteria: { accuracy: 0.95, cpm: 35 },
    theory: [
      {
        heading: "The rules",
        body: "60 seconds. Random numbers 0–255. No hints. No chart. Your score is conversions per minute. Beat your own best.",
        visual: "A stopwatch, a pulse, a ghost marker racing.",
        takeaway: "60 seconds. Go."
      }
    ],
    items: [
      { type: "BOSS", durationSec: 60, pool: "dec2bin", max: 255 }
    ]
  },

  // ----- Lesson 5.4 (Checkpoint 2) -----
  {
    id: "5.4", section: 2, unit: 5,
    title: "Checkpoint 2", subtitle: "Decimal → binary mastery",
    newConcept: "Final test of Section 2. Mixed dec→bin and bin→dec.",
    scaffold: { chart: false, hints: false, timer: true },
    xp: 10,
    passCriteria: { accuracy: 0.95, cpm: 40 },
    theory: [
      {
        heading: "Mastery check",
        body: "Mixed dec→bin and bin→dec. No chart. Timer on. Aim for 95% accuracy and 40 CPM.",
        visual: "Certificate image appearing faintly.",
        takeaway: "Show the app what you can do."
      }
    ],
    items: [
      { type: "TAP", direction: "dec2bin", value: 22, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 37, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00010100", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 44, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00110100", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 56, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "00101010", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 68, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 79, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "01000110", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 94, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 107, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "01100011", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 124, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 139, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "10010110", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 163, showChart: false, showHints: false },
      { type: "TAP", direction: "dec2bin", value: 178, showChart: false, showHints: false },
      { type: "NUM", direction: "bin2dec", bits: "11001010", showChart: false, autoSubmit: true },
      { type: "TAP", direction: "dec2bin", value: 243, showChart: false, showHints: false }
    ]
  }
];
```

---

## 17. ACCEPTANCE CRITERIA (before you consider it done)

- Opens and runs from a single `index.html` by double-click.
- Fully playable on both desktop (keyboard 1–8, Enter, numeric typing) and mobile (touch, on-screen keypad for NUM).
- All 9 exercise types work.
- All gamification systems work and persist.
- Every lesson renders `theory` first, then `items`.
- Every interactive element has hover/press/focus states.
- Sounds play and can be toggled off.
- No console errors. No external network requests.
- No octal/hex content. No leaderboard. No backend.

---

## 18. FINAL REMINDER

Build in the order given in §14. **Do not skip phases.** After each phase, output a short summary of what changed and pause for testing.

If anything in this prompt conflicts with itself, prefer the more specific instruction (§6 animation, §8 schemas, §16 lesson data) over the general one (§2 product summary).

Now begin Phase 1.