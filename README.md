# IronLog

A personal fitness tracking Progressive Web App (PWA) built for a specific user — a 51-year-old male returning to strength training after ~5 years off. It is published as a single generated HTML artifact on GitHub Pages, while the source is gradually being split into testable JavaScript modules. Supabase remains the cloud sync backend and React is still loaded from the runtime CDN.

**Live app:** https://lord-buttock.github.io/ironlog

---

## Purpose

IronLog exists to solve a specific problem: commercial fitness apps are either too generic, too gamified, or too complicated for someone who wants to quietly track a 3-day Push/Pull/Legs split at home, log sets with RPE and pain scores, and see whether they're actually getting stronger over time.

The app is opinionated by design. It is built around one person's equipment, medical constraints, and training goals — not a general-purpose tool.

**Core goals:**
- Log every set of every workout (weight, reps, RPE, pain)
- Pre-fill from the last session so starting is frictionless
- Surface progressive overload nudges when it's time to add weight
- Track cycling rides separately
- Work offline, load fast, live on the iPhone home screen

---

## Who This Is For (User Profile)

This context is critical for any AI agent working on this project.

**User:** Phill Cantone, 51, male, Victoria Australia  
**Training history:** Returning after ~5 years off. Conservative progression required.  
**Training split:** 3-day Push / Pull / Legs (A / B / C)  
**Training location:** Home gym

### Home Gym Equipment
- Dumbbells (various weights)
- Kettlebells (various weights)
- Barbell + weight plates (5kg, 10kg) + barbell stand
- Flat bench
- Incline/decline bench
- Resistance bands
- Fit ball (Swiss ball)
- Medicine ball
- Stepper
- Small trampoline
- Doorframe chin-up bar

### Medical Constraints — ALWAYS Respect These

These are not preferences — they are physical limitations that must be honoured when suggesting, modifying, or adding exercises.

| Condition | Constraint |
|---|---|
| Bilateral shoulder bursitis | No overhead **barbell** pressing. Seated DB shoulder press is OK. Emphasise scapular control. Wide-grip pull-ups may aggravate — shoulder-width or narrower only. |
| Slipped disc / lower back pain | No loaded spinal flexion or rotation. Conservative hinge range. Deadlifts from raised height initially. Bent-over rows only with strict neutral spine. |
| Tight hamstrings | Raised deadlift starting height. Small range on hamstring curls. Limited range on Romanian deadlift. |
| Limited shoulder flexibility | Cannot back-rack a barbell. No barbell back squat. No barbell front squat. Front-loaded (goblet) or dumbbell squats only. |
| Returning after 5 years off | RPE 6–7 in early weeks. 3–4 reps in reserve. Conservative load progression. |

### Exercise Status Key (used in ROADMAP.md)
- 🟢 **Clear** — no medical or equipment issues
- 🟡 **Modify** — doable with noted changes
- 🔴 **Avoid** — genuine risk or equipment gap

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| UI | React 18 (UMD via cdnjs CDN) | Runtime CDN dependency; source is bundled before deployment |
| Language | JSX + JavaScript modules | esbuild bundles the source at build time; client-side Babel is not used |
| Charts | Custom SVG (`MiniLineChart` component) | Recharts caused CSP errors on GitHub Pages |
| Styling | Inline React style objects | Keeps everything in one file; no CSS to manage |
| Storage | `localStorage` + Supabase | localStorage for offline-first; Supabase for auto-sync and cross-device restore |
| Backup | Supabase auto-sync + JSON export / import | Automatic cloud push after every session; manual JSON fallback in Manage |
| Sync | Supabase (project `bhlbebdmuodscdgcwkyb`) | Sessions and rides auto-pushed on completion; count-based restore on load |
| Fonts | Google Fonts CDN | Barlow Condensed, Barlow, JetBrains Mono |
| Hosting | GitHub Pages | Free, generated single-file deployment, auto-deploys on push |

### What Was Tried and Abandoned
- **Google Apps Script** — file too large (116 KB), `doGet` failed
- **Recharts CDN** — `Recharts is not defined` in production due to CSP
- **Client-side Babel** (`text/babel`) — blocked by GitHub Pages CSP

---

## Project Structure

```
ironlog/
├── src/
│   ├── IronLog.jsx          ← legacy/main UI module during migration
│   ├── main.jsx             ← bundle entry point
│   ├── runtime.js           ← CDN React adapter
│   ├── ui/theme.js          ← shared colours, typography, and style tokens
│   ├── ui/charts/           ← shared chart geometry and metric colour helpers
│   ├── ui/Nav.jsx           ← shared bottom navigation
│   ├── screens/             ← extracted Dashboard, ActiveWorkout, Health, History, Manage, PreStart, Progress, and Rides screens
│   ├── data/workouts.js     ← canonical A/B/C and Iron Series programmes
│   ├── data/exercises.js    ← preset/Iron Series exercise and muscle metadata
│   ├── data/mobility.js     ← warm-up, stretch, and mobility safety catalogues
│   ├── domain/              ← pure session, health, progression logic (including sleep/recovery scoring)
│   ├── storage/             ← validated persistence and backup/import helpers
│   └── integrations/        ← Supabase response and sync helpers
├── dist/
│   └── index.html           ← compiled output, deployed to GitHub Pages
├── build.js                 ← build script (JSX → HTML)
├── babel.config.json        ← Babel config
├── package.json
├── CLAUDE.md                ← detailed AI agent handover doc
├── README.md                ← this file
└── ROADMAP.md               ← planned features, known issues, update suggestions
```

**Never edit `dist/index.html` directly** — it is overwritten on every build.

---

## Source File Architecture (`src/IronLog.jsx`)

The remaining shared UI and app-root wiring are still organised inside `src/IronLog.jsx`, while extracted screens live in `src/screens/` and receive validated state and explicit dependencies through props. New logic should be placed in the relevant module directory above. The migration is intentionally incremental so the live app remains stable.

### 1. THEME (`C` object)
All colours and font names in a single object. Change colours here to restyle the whole app.

### 2. WORKOUT DATA
- `WARMUP` — warm-up checklist items (shared across all workouts)
- `EXERCISES` — main exercise library (keyed by ID string)
- `WORKOUTS` — defines A, B, C workouts (title, exercise IDs, finisher checklist)
- `src/data/workouts.js` — canonical A/B/C and Iron Series programme definitions used by the app
- `src/data/exercises.js` — preset/Iron Series exercise definitions and muscle metadata
- `src/data/mobility.js` — warm-up/stretch catalogues, configurable groups, and safety tags
- `src/screens/Health.jsx` — Health screen with explicit helper, component, and cloud-import dependencies
- `src/screens/ActiveWorkout.jsx` — active session flow with explicit workout data, helper, component, and theme dependencies
- `src/screens/PreStart.jsx` — pre-workout coaching and safe-swap screen
- `src/ui/FontLoader.jsx` — runtime font stylesheet loader
- `PRESET_LIBRARY` — additional exercises not in default workouts but available to add

Both `EXERCISES` and `PRESET_LIBRARY` are merged at runtime:
```js
const allExercises = { ...EXERCISES, ...PRESET_LIBRARY, ...customExercises };
```

### 3. STORAGE
`load(key)` / `save(key, val)` — thin wrappers around `localStorage`.

### 4. DATA EXPORT / IMPORT
`exportData()` — downloads all app data as a `.json` file  
`importData()` — reads an uploaded `.json` file and restores data

### 5. UTILITIES
Date formatting, timer helpers.

### 6. SVG CHART (`MiniLineChart`)
Custom charting component. Takes an array of `{ x, y }` points and renders a line chart in SVG. No external library.

### 7. COMPONENTS
In order: `Nav`, `Dashboard`, `ActiveWorkout`, `SetRow`, `History`, `Progress`, `Rides`, `Manage`

### 8. APP ROOT (`App()`)
Top-level component. Owns all state, handles persistence, renders the correct screen based on `view`.

### Runtime Globals (from CDN — do NOT import these)
```js
const { useState, useEffect, useRef, useCallback } = React;
```
`src/runtime.js` adapts these globals for normal source-module imports. The build bundles the source before writing the deployable HTML files.

---

## Exercise Data Shape

Each exercise in `EXERCISES` or `PRESET_LIBRARY` follows this shape:

```js
exercise_id: {
  name: 'Display Name',
  muscle: 'Push | Pull | Legs | Core | Hinge | Glutes | Balance | ...',
  unit: 'kg | bw | band',   // bw = bodyweight, band = resistance band
  defaultReps: 8,            // null if timed
  defaultSets: 3,
  repMax: 10,                // top of rep range (triggers overload nudge)
  defaultDuration: 30,       // seconds, only if isTimed: true
  isTimed: false,            // true for holds/carries
  perSide: false,            // true for unilateral exercises
  canBW: false,              // true if exercise can be done bodyweight
  cue: 'Form cue text shown during the workout',
  demo: 'https://youtube.com/...',  // search URL for demo video
}
```

---

## localStorage Data Keys

| Key | Contents |
|---|---|
| `il_sessions` | Array of completed session objects |
| `il_rides` | Array of ride log objects |
| `il_active` | Current in-progress session (or null) |
| `il_custom_exercises` | User-created exercise objects |
| `il_workout_custom` | `{ A: [...extraIds], B: [...], C: [...] }` — user customisations to workouts |

---

## Session Flow

Each training session follows this linear flow managed by `ActiveWorkout`:

```
Energy check (😴→🔥) → Warm-up checklist → Exercises (sets/reps/RPE/pain) → Finisher checklist → Complete
```

On completion: PR detection runs, progressive overload nudges are evaluated, session is saved to `il_sessions`.

---

## Navigation (Bottom Tab Bar)

| Tab | View key | Screen |
|---|---|---|
| Home | `dashboard` | Dashboard — next workout, recent sessions, cloud sync status |
| Train | `workout` | Active Workout — session flow |
| Log | `history` | History — expandable session cards |
| Stats | `progress` | Progress — SVG charts per exercise |
| Rides | `rides` | Ride log with programme guide |
| Manage | `manage` | Exercise library + workout builder + backup/restore |

---

## Build Process

### First-time setup
```bash
cd "path/to/ironlog"
npm install
```

### Every time you change a source module under `src/`
```bash
npm run build
```

`build.js` does the following:
1. Reads `src/IronLog.jsx`
2. Strips the React `import` statement (React comes from CDN globals)
3. Strips the `FontLoader` component (fonts are in the HTML `<head>`)
4. Bundles JSX and JavaScript modules with esbuild
5. Wraps the output in a full HTML page with CDN script tags, Google Fonts, PWA meta tags, and the embedded base64 app icon
6. Writes `dist/index.html`

### Watch mode (auto-rebuild on save)
```bash
npm run watch
```

---

## Deployment

```bash
git add dist/index.html
git commit -m "Update app"
git push
```

GitHub Pages auto-deploys from `dist/index.html` on the `main` branch within ~30 seconds of a push.

**Note:** The `dist/` folder is committed to the repo. This is intentional — GitHub Pages needs the compiled file directly in the repository.

---

## PWA / iPhone Home Screen

The app is configured as a PWA and can be added to the iPhone home screen via Safari → Share → Add to Home Screen:

- Launches full screen with no browser chrome
- Shows "IronLog" as the app name
- Dark status bar
- 180×180 app icon embedded as base64 in `build.js` (survives rebuilds)

---

## Exercise Demo Videos

Each exercise in the library has a `demo` field. Currently this stores a YouTube search URL:
```js
const YT = q => `https://www.youtube.com/results?search_query=${q}`;
demo: YT('dumbbell+bench+press+form+tutorial')
```
Tapping the link opens YouTube in the browser. This works but is not ideal — results vary, ads appear, and leaving the app mid-workout is disruptive on iPhone.

**Status:** Under review. Options include curated YouTube video IDs, ExerciseDB animated GIFs, and self-hosted assets. See **DECISIONS.md → Decision 1** for the full analysis and agent feedback thread.

---

## Data Storage & Cross-Device Sync

App data is saved locally first in `localStorage`, then sessions and rides are pushed to Supabase for automatic backup and cross-device restore. The dashboard shows cloud sync status only; manual JSON export/import lives under **Manage → Backup** as a fallback.

**Status:** Implemented 2026-05-13. Supabase sync is active for sessions and rides; restore currently uses the count-based rule documented in **DECISIONS.md → Decision 2**.

---

## Notes for AI Agents

- **Edit source modules under `src/` as needed.** Never touch generated `index.html` files — they are overwritten on every build.
- **Run `npm run build` after every change** to verify the JSX compiles without errors.
- **Do not introduce `import` statements** for React, ReactDOM, or any other CDN-loaded library.
- **Build-time dependencies are acceptable** when they only affect the generated artifact. Runtime dependencies remain deliberately limited to the existing CDN scripts.
- **Respect the medical constraints** in every exercise suggestion or modification — see the User Profile section above.
- **Keep the single-file architecture.** The entire app is one JSX file by design. Do not split into multiple files or introduce a build system beyond what exists.
- **Inline styles only** — no CSS files, no CSS-in-JS libraries, no Tailwind.
- **Test the build** by running `npm run build` and checking the output size reported. If it errors, the JSX has a syntax problem.
- **See ROADMAP.md** for planned features, known issues, and update priorities before starting any new work.
- **See DECISIONS.md** for open architectural questions that need input before implementation begins.
- **After every program change**, update `ROADMAP.md → Agent Notes & Feedback Log`. Also update `README.md` when current behaviour changes, and `DECISIONS.md` when an architectural decision is resolved or materially changed.
