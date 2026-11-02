# IronLog — Agent Session Guide
*Read this first, every session, without exception.*

---

## STOP — Verify you are in the right directory

The canonical project location is:

```
/Users/phillcantone/Library/Mobile Documents/com~apple~CloudDocs/Family/Phill/AI Coding/Ironlog/
```

**There is a stale copy at `/Users/phillcantone/Documents/New project 3/` — do not use it.** It is outdated and missing months of work. If your file links or line numbers point there, you are in the wrong place.

Before doing anything, confirm your working directory:
```bash
pwd
# Must output: /Users/phillcantone/Library/Mobile Documents/com~apple~CloudDocs/Family/Phill/AI Coding/Ironlog
```

Then sync with GitHub:
```bash
git pull --ff-only origin main
git status
# Must be clean before any code work
```

---

## What this is

A personal fitness tracking PWA for Phill (age 51, male, returning to training after ~5 years off). React 18 source tree with a gradual modular migration, deployed to GitHub Pages. No backend beyond Supabase for cloud sync.

- **GitHub repo:** `https://github.com/lord-buttock/ironlog`
- **Live app:** deployed via GitHub Pages from root `index.html` (and mirrored to `dist/index.html`)
- **Source of truth:** `src/` modules. `src/IronLog.jsx` remains the main UI module during the gradual migration; do not edit generated HTML directly.

---

## Document map — what to read and when

| Document | Purpose | When to read |
|---|---|---|
| **AGENTS.md** (this file) | Canonical session guide — paths, rules, working protocol | First, every session |
| **CHANGELOG.md** | Every change ever made, reverse-chronological | Before starting any work |
| **BUGS.md** | Open and closed bugs with IDs | Before starting any work |
| **ROADMAP.md** | Planned features, priorities, agent notes | Before starting any work |
| **README.md** | Detailed architecture, user profile, medical constraints | When you need deeper context |
| **DECISIONS.md** | Technical decisions and why they were made | When making architectural choices |
| **ICON-GUIDE.md** | Source of truth for IronLog icon/demo image style, sizes, prompts, cleanup, and verification | Before generating or editing any icon, demo frame, warmup/finisher image, or stretch image |
| `docs/superpowers/specs/` | Feature design specs (Claude-authored, Phill-approved) | When implementing a feature — read the relevant spec |
| `CODEX_COACH_BRIEF_R4.md` | AI Coach debug brief — feature now complete and deployed | Historical reference only |

**Do not rely on memory of previous sessions.** Always read CHANGELOG.md, BUGS.md, and ROADMAP.md fresh — they are the ground truth for what has and hasn't been done.

**Image/icon work:** If the task involves generating, editing, replacing, reviewing, or committing any image asset — including exercise icons, stretch icons, warmup/finisher icons, demo frames, app icons, or review galleries — read **ICON-GUIDE.md** in full before starting. It supersedes older ad-hoc image prompts and style notes.

---

## Multi-agent working rules

This project is worked on by **Claude** (design, spec, review) and **Codex** (implementation, icon generation) and **Phill** (decisions, testing). Follow these rules to avoid conflicts.

1. **Claim your task first.** For any medium or large task, mark it `in progress — [Claude/Codex]` in ROADMAP.md or BUGS.md and commit that claim before writing code.
2. **Edit only `src/IronLog.jsx`.** Never edit `dist/index.html` or root `index.html` directly — both are overwritten on every build.
3. **Build after every change.** Run `node build.js` — this compiles JSX and writes the output to **both** `dist/index.html` and root `index.html`. GitHub Pages serves from root `index.html`.
4. **Commit these four files together:** `src/IronLog.jsx`, `dist/index.html`, `index.html`, `version.json`. Never one without the others.
5. **Always push after committing.** Run `git push origin main` immediately after every commit.
6. **Never force push.** If a push is rejected, pull, rebuild from the merged source, then push.
7. **Before pushing:** run `git status` and `git log --oneline -3` to confirm what is going up.
8. **After completing work:** add a line to CHANGELOG.md and update BUGS.md / ROADMAP.md as appropriate.

### Claude ↔ Codex handoff workflow

- **Claude** designs features, writes specs to `docs/superpowers/specs/`, and writes Codex briefs.
- **Codex** reads the brief, reviews the spec, gives feedback, then implements.
- **Claude** incorporates Codex feedback before implementation begins.
- Phill carries feedback between Claude and Codex sessions — neither agent talks directly to the other.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI | React 18 (UMD from cdnjs) | Loaded via `<script>` tag; source is bundled at build time |
| Language | JSX + plain JavaScript modules | esbuild bundles the source at build time |
| Charts | Custom SVG (`MiniLineChart`) | Recharts blocked by GitHub Pages CSP |
| Styling | Inline styles (React style objects) | All in one file |
| Storage | `localStorage` | Per-device persistence |
| Cloud sync | Supabase REST API | Count-based restore; blocked during active session |
| Hosting | GitHub Pages | Auto-deploys on push to main |
| Fonts | Google Fonts CDN | Barlow Condensed, Barlow, JetBrains Mono |

**What was tried and abandoned:**
- Google Apps Script — file too large (116KB), `doGet` failed
- Recharts CDN — `Recharts is not defined` error; replaced with custom SVG
- Client-side Babel (`text/babel`) — blocked by CSP; pre-compiled at build time

---

## Build process

```bash
npm install          # first time only
npm run build        # every time src/IronLog.jsx changes
```

Build does four things:
1. Strips React imports (they come from CDN globals)
2. Bundles JSX and JavaScript modules via esbuild
3. Wraps output with CDN tags, fonts, icon, and PWA meta
4. Writes the result to **both** `dist/index.html` and root `index.html`

GitHub Pages serves root `index.html`. `.nojekyll` is present in the repo root so Pages publishes the prebuilt file as-is (no Jekyll processing).

---

## Source file structure

Key sections in order:
1. **THEME** — `C` object, all colours and font names
2. **EXERCISE ICONS** — SVG line-art icon components keyed by exercise ID
3. **WORKOUT DATA** — `WARMUP`, `STRETCHES`, `EXERCISES`, `WORKOUTS`, `PRESET_LIBRARY`
4. **MUSCLE META** — `MUSCLE_META` mapping exercise IDs to primary/secondary muscle arrays
5. **STORAGE** — `load()` / `save()` using `localStorage`
6. **SUPABASE SYNC** — cloud push/restore functions
7. **UTILITIES** — date formatting, timer helpers, `nextWorkout()`, `buildSession()`
8. **SVG CHART** — `MiniLineChart` component
9. **Remaining shared components** — `SetRow`, `MuscleDiagram`, `ActiveStretch`, modal and helper wiring retained during the migration
10. **App root** — `App()` — global state, navigation, persistence wiring, and screen composition

During the gradual migration, new pure logic belongs in `src/domain/`, validated persistence in `src/storage/`, cloud helpers in `src/integrations/`, and the bundled entry point is `src/main.jsx`.

Globals available at runtime (from CDN — do not import):
```js
const { useState, useEffect, useRef, useCallback } = React;
```

---

## Current workouts (A/B/C split) — as of 2026-05-13

### Workout A — Push (Chest · Shoulders · Triceps)
`bb_flat_bench` → `p_db_shoulder_press` → `p_lateral_raise` → `p_close_grip_bench` → `p_skull_crushers` → `p_tricep_pushdown`

### Workout B — Pull (Back · Biceps · Hinge)
`kb_deadlift` → `chin_up` → `cs_db_row` → `face_pull` → `p_db_bicep_curl` → `p_hammer_curl`

### Workout C — Legs + Core
`goblet_squat` → `rdl` → `hip_thrust` → `reverse_lunge` → `sb_ham_curl` → `pallof_press` → `farmers_walk`

Exercise IDs prefixed `p_` are in `PRESET_LIBRARY`. All others are in `EXERCISES`. Both merge into `allExercises` at runtime: `{ ...EXERCISES, ...PRESET_LIBRARY, ...customExercises }`.

---

## Data shape (localStorage keys)

```
il_sessions          → array of completed session objects
il_rides             → array of ride log objects
il_active            → current in-progress session (or null)
il_custom_exercises  → user-created exercise objects
il_workout_custom    → { A: [...extraIds], B: [...], C: [...] }
il_workout_hidden    → { A: [...hiddenIds], B: [...], C: [...] }
```

---

## App navigation and session flow

| Tab | Screen | Purpose |
|---|---|---|
| Home | Dashboard | Next workout, coach note, week strip, stretch routine |
| Workout | ActiveWorkout | Session flow (see below) |
| Log | History | Expandable session cards |
| Stats | Progress | SVG line charts per exercise |
| Rides | Rides | Cycling log with programme guide |
| Manage | Manage | Exercise library, workout builder, backup |

**Session flow:**
Energy check → Warm-up checklist → Exercises (weight/reps/RPE/pain per set) → Finisher → Complete

**Phase state** (inside `ActiveWorkout`):
`'energy'` → `'warmup'` → `'workout'` → `'finisher'` → complete

---

## User's medical constraints — ALWAYS respect these

| Condition | Hard constraint |
|---|---|
| Bilateral shoulder bursitis | No overhead barbell. DB shoulder press (seated) OK. No wide-grip pull-ups. Scapular control always. |
| Slipped disc / lower back pain | No loaded spinal flexion or rotation. Conservative hinge range. KB deadlift from raised height only. |
| Tight hamstrings | Raised deadlift height. Small range on hamstring curls. |
| Limited shoulder flexibility | Cannot back-rack barbell. No back squat or front squat. Front-loaded or goblet only. |
| Returning after 5 years off | Conservative progression. RPE 6–7 early weeks. 3–4 reps in reserve. |

**Equipment:** Dumbbells + plates, kettlebells (4–12kg), barbell + flat/incline/decline bench + rack, weight plates (5kg, 10kg), Swiss ball, stepper, resistance bands, small trampoline, sturdy step, 5m carry space, doorframe chin-up bar.

---

## Key completed features (do not re-implement)

- ✅ 3-day Push/Pull/Legs split (A/B/C) with full session flow
- ✅ Per-set logging: weight, reps/duration, RPE, pain
- ✅ Pain ≥ 3 warning banner; `caution` field on exercises renders amber banner in `SetRow`
- ✅ Pre-fill from last session
- ✅ Rest timer (30/60/120s shortcuts, auto-starts at 30s)
- ✅ Session clock (wall-clock based)
- ✅ PR detection (completed sets only — BUG-001 fixed)
- ✅ Progressive overload nudge
- ✅ Custom SVG progress charts (weight, volume, RPE)
- ✅ Session history (expandable)
- ✅ Stretch routine (Dashboard accordion + `ActiveStretch` guided flow)
- ✅ Ride log with programme phases
- ✅ Exercise library with form cues, YouTube demo links, muscle diagrams
- ✅ `MuscleDiagram` — anatomical SVG front/rear with primary (blue) / secondary (purple) highlighting
- ✅ `MUSCLE_META` — all exercises mapped to anatomical muscle arrays (ExRx-verified)
- ✅ Exercise icons — 108×108px transparent PNGs in `assets/icons/`
- ✅ Warmup/finisher icons in `assets/icons/warmup/`
- ✅ Custom exercise creator
- ✅ Workout builder (add/remove/hide exercises per A/B/C)
- ✅ Mid-session exercise addition
- ✅ Supabase auto-sync (count-based restore, blocked during active session)
- ✅ Auto-update indicator (↺ pulses amber when newer version deployed)
- ✅ JSON export/import in Manage → Backup
- ✅ PWA / iPhone home screen

---

## Do not touch

- `assets/anatomy/` — annotated SVGs, fully complete, do not modify or regenerate
- `MuscleDiagram` component — complete
- `MUSCLE_META` — complete, ExRx-verified
- `dist/index.html` and root `index.html` — never edit directly, always rebuild via `node build.js`
- `.superpowers/` — brainstorming session files, ignore

---

## iOS / PWA

- `apple-mobile-web-app-capable` — full screen, no browser chrome
- `apple-mobile-web-app-title` — "IronLog"
- Home screen icon: 180×180 PNG, base64 in `build.js` (survives rebuilds)

---

## Amendments log

| Date | Change |
|---|---|
| 2026-05-20 | Build/deploy fix — `build.js` now writes to both `dist/index.html` and root `index.html`; `.nojekyll` added; GitHub Pages serves from root. Updated multi-agent rules and build docs accordingly. |
| 2026-05-19 | Full rewrite — added canonical path, stale copy warning, document map, multi-agent workflow, updated workout lists to current A/B/C, added completed features list |
| 2026-05-01 | Original handover document created |
