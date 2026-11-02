# IronLog — Changelog

Reverse-chronological log of all meaningful changes. One entry per change — date, author, one line. Link bug IDs from BUGS.md where relevant.

## 2026-11-03 — Clear completed-set button state (Codex)

- Made completed workout sets use a strong green `✓ Done` button with a visible border and success shadow, clearly distinct from the blue `Start`/running state for easier use without glasses

## 2026-11-03 — Apple Health freshness and ingestion audit (Codex)

- Fixed [BUG-013](BUGS.md): local Health Auto Export readings now merge with Supabase by date, preserving newer imports and using the local value for same-day conflicts
- Health imports now confirm the Supabase upsert instead of always displaying “synced to cloud” after a local-only import
- Hardened local and deployed `ingest-health` parsing for separate sleep-stage blocks and minute/second stage units; verified the deployed dry-run returns 6.6 h asleep, 0.6 h deep, 1.3 h REM, 4.8 h core, 0.5 h awake, and 92.8% efficiency for a representative export
- Audited all stored metrics: steps, HRV, resting HR, active calories, and blood oxygen currently reach 2 November; cardio reaches 24 October; the latest server capture had no sleep block, so sleep cannot update until Sleep is included in the Health Auto Export configuration

## 2026-11-02 — Science-first readiness and weekly AI review fix (Codex)

- Replaced the unvalidated 0–100 recovery headline with transparent Apple Health SDNN HRV-led readiness: seven-day rolling trend, personal baseline, smallest-worthwhile-change band, confidence, and explicit “Building baseline” state
- Kept resting HR, sleep duration/efficiency/stages, training load, RPE, pain, and Apple Watch effort as visible context rather than arbitrary weighted points; sleep stages are described cautiously because they are wearable estimates
- Updated Home and Health explanations, readiness evidence, sleep modal, and AI context to use the new model without inventing a score
- Fixed weekly AI review diagnostics: mode-specific bounded context, actual HTTP status/response detail in fallback messages, useful deterministic weekly evidence, and request-scoped server telemetry without health payload logging
- Added regression tests for SDNN readiness, sparse baseline handling, score removal, and detailed AI service failures

## 2026-11-02 — Activity goals and health detail upgrade (Codex)

- Added Apple Health / Apple Watch activity points, with measured Watch intensity preferred and clearly labelled HR-based estimates when possible
- Added editable weekly Heart Points, strength, cycling, steps, active-calorie, and personal max-HR goals under Manage → Goals, persisted as `il_activity_goals` and included in JSON backup/import
- Added compact Home Activity Balance, detailed Health activity goals and deterministic coaching, and per-session Log activity summaries
- Added a seven-night descriptive sleep timeline plus weight trend and manual weight entry; sleep stages remain descriptive and do not alter HRV readiness
- Extended the bounded AI context with weekly activity, goals, sleep timeline, weight trend, and coaching evidence without sending raw Apple Health or Watch samples
- Added domain tests for intensity classification, sparse Watch data, weekly aggregation, sleep timelines, weight trends, and safety-aware goal coaching

---

## 2026-11-02 — Multi-provider AI explanation layer (Codex)

- Improved AI explanations so they define each health signal, connect the evidence to the recommendation, and provide a practical reasoned action instead of echoing the rules text; deployed Edge Function version 4
- Hardened provider fallback for model-specific context/request-shape rejections and alternate OpenAI-compatible response formats; the live Edge Function is now deployed as version 6 with status/provider diagnostics
- AI fallback modals now show a short service note when the provider chain is unavailable, while keeping IronLog's deterministic guidance visible
- Added bounded full-history AI context summaries that exclude raw Health Auto Export, ECG, notes, set timestamps, and raw Watch samples
- Added Groq → Cloudflare Workers AI fallback Edge Function source with safe retry policy, structured output validation, provider telemetry, and no health-payload logging
- Added opt-in first-use disclosure, AI enable/disable setting, local insight cache, deterministic fallback, and low-confidence sparse-data labelling
- Added Explain with AI actions for readiness, sleep, HRV, resting HR, Watch/workout effort, exercise progression, and Health weekly review
- Added AI context, privacy, schema, cache, and fallback-policy tests; provider credentials and Edge Function deployment remain setup steps
- Corrected AI Watch summaries to consume the imported Supabase field names for duration, calories, average/peak heart rate, matching confidence, and sample counts

## 2026-11-02 — Modularisation foundation (Codex)

- Extracted History and Apple Watch workout-effort review into `src/screens/History.jsx`; the screen now receives validated session data and explicit chart/effort helpers through props
- Extracted Manage, exercise/stretches library, workout builder, and backup controls into `src/screens/Manage.jsx` with explicit state, data, theme, icon, diagram, and modal dependencies
- Extracted the Dashboard screen into `src/screens/Dashboard.jsx`; readiness, trend, week-strip, and Home insight presentation now receive helper and child-component dependencies from the app root
- Extracted the Active Workout screen into `src/screens/ActiveWorkout.jsx`; session flow, warm-up, set timing, exercise insights, and workout data now receive explicit dependencies from the app root
- Added regression assertions for active-session resume position, set timestamps, and cardio/health-stage mappings; browser-smoke verified all navigation screens plus `Start` → running timer → `Done`
- Added a bundled `src/main.jsx` entry point and framework-free domain, storage, health, and Supabase helper modules while preserving the GitHub Pages HTML outputs
- Added migration/validation tests, explicit active-session exercise metadata, and fixed cloud cardio data being ignored during startup restore
- Extracted shared theme and style tokens into `src/ui/theme.js` while preserving the existing UI
- Extracted shared smooth-chart geometry and metric colour classification into `src/ui/charts/metrics.js`, with a focused regression test
- Extracted the bottom navigation into `src/ui/Nav.jsx` with explicit theme and icon dependencies
- Extracted the Progress and Rides screens into `src/screens/` with explicit state and persistence callbacks
- Moved the A/B/C and 30-day Iron Series workout catalogue into `src/data/workouts.js` and added a catalogue regression test
- Moved stage-aware sleep scoring, recovery scoring, baselines, and health trend classification into the tested health domain module
- Replaced count-only cloud restore decisions with identity/timestamp comparison so equal-size local/cloud conflicts are not silently overwritten
- Moved backup creation and file reading into `src/storage/importExport.js` and tightened backup version/shape validation before importing
- Extracted the PreStart and Health screens behind explicit props and dependency contracts
- Moved preset/Iron Series exercise definitions and muscle metadata into `src/data/exercises.js`
- Extracted the font stylesheet loader into `src/ui/FontLoader.jsx`
- Moved warm-up, stretch, configurable mobility groups, and mobility safety metadata into `src/data/mobility.js`

## 2026-11-02 — Iron Series week/day picker (Codex)

- Added selectable week and day controls to Iron Series so a paused 30-day programme can be resumed from any workout day
- Added a clear custom-day label and a one-tap return to the next sequence day

## 2026-06-09 — Sleep score calibration (Codex)

- Recalibrated Sleep Quality so meeting duration, efficiency, deep, REM, and awake-time targets scores as good rather than barely fair; last night's 7.9h / 98% efficient sleep now reads as a strong sleep signal
- Kept Home readiness balanced by converting the display sleep score back to a neutral-at-target recovery z-score before combining it with HRV and resting HR

## 2026-06-08 — Log effort missing-data crash fix (Codex)

- Fixed a crash when expanding older Log workouts that have matched Apple Watch summaries but no timestamped exercise/set windows; they now show no-sample labels instead of blanking the app

## 2026-06-08 — Workout effort chart drill-down (Codex)

- Made Log workout effort timelines interactive: tapping exercise bands or numbered exercise chips shows the exercise name and opens its effort breakdown
- Added per-exercise heart-rate charts with set-window markers so expanded exercises show where each set sits on the Watch HR line

## 2026-06-08 — Log workout effort review (Codex)

- Added a completed-workout Apple Watch effort review inside Log, with matched workout summary, heart-rate timeline, hardest-exercise insight, exercise-level effort rows, and expandable set-level HR/kcal/sample-confidence detail
- Tightened Watch sample handling so effort analysis filters heart-rate samples explicitly and fetches recent ordered workout samples for reliable Log review

## 2026-06-08 — Home week strip placement (Codex)

- Moved the seven-day Home activity strip up between Recovery Trend and This Week so weekly progress is visible earlier on the screen

## 2026-06-08 — Cardio Fitness / VO2 pipeline fix (Codex)

- Redeployed Supabase `ingest-health` Edge Function v10 so VO2/Cardio Fitness exports map to `health_metrics.metric = cardio`
- Updated IronLog health cloud restore and push mappings so `cardio` rows load into the Health tab and sync with other health metrics
- Expanded local Health Auto Export parser aliases for common VO2/Cardio Fitness metric names

## 2026-06-08 — Health tab analysis upgrade (Codex)

- Reworked Health into a deeper analysis screen with Readiness Breakdown, Sleep, Cardiovascular, Movement & Energy, Training Response, and Data Tools sections
- Added sleep-stage breakdown inside Health using total sleep, efficiency, deep, REM, and awake time from Apple Health exports
- Added focused health summary cards so Health explains what is helping or limiting recovery instead of acting as a raw metric dump

## 2026-06-08 — Home sleep and activity semantics cleanup (Codex)

- Moved the Selected Workout and Stretch Routine cards from Home to the Workout tab while keeping the seven-day activity strip on Home
- Added a sleep-specific Home insight modal with sleep score, total sleep, efficiency, deep, REM, core, awake time, explanation, and recommendation
- Updated Active Cal chart colours, labels, and recommendations so calorie burn reads as activity/weight-loss context rather than automatically "worse" when higher

## 2026-06-08 — Sleep stage recovery scoring (Codex)

- Redeployed Supabase `ingest-health` Edge Function v9 so `sleep_analysis` exports store deep, REM, core, awake, and derived efficiency metrics alongside total sleep
- Backfilled the latest captured sleep export into `sleep_deep`, `sleep_rem`, `sleep_core`, `sleep_awake`, and `sleep_efficiency` rows
- Updated Home recovery scoring to use a sleep quality score from total sleep, efficiency, deep sleep, REM sleep, and awake time instead of sleep duration alone
- Updated the Home readiness chip/modal so sleep reports as `Sleep good/fair/low` with stage details in the explanation

## 2026-06-08 — Sleep diagnostics and Blood Oxygen support (Codex)

- Redeployed Supabase `ingest-health` Edge Function v7 so health exports are captured for debugging when sleep or Blood Oxygen payloads do not normalize as expected
- Updated `health_export_captures` constraint to allow `kind = health`; verified diagnostic capture and cleanup
- Added Blood Oxygen / SpO2 support to IronLog health cloud sync, localStorage, Health tab cards, and Health Auto Export bulk import
- Fixed sleep localStorage persistence after cloud/local health data loads

## 2026-06-08 — Sleep ingest parser fix (Codex)

- Redeployed Supabase `ingest-health` Edge Function v4 so `sleep_analysis` exports normalize to `health_metrics.metric = sleep`
- Parser now handles Health Auto Export aggregated sleep (`totalSleep` / `asleep`) and unaggregated sleep segments by summing same-day sleep durations

## 2026-06-07 — Smooth blended Home charts (Codex)

- Updated Home metric sparklines, HRV/resting HR insight charts, and Recovery Trend lines to use smoothed SVG curves with blended status-colour strokes
- Added green/blue/yellow/orange/red colour keys to the detailed trend surfaces so chart colours explain recovery signal severity

## 2026-06-07 — Home metric chart clarity (Codex)

- Removed the Strength and Cycling recommendation tiles from Home because they only navigated to other tabs without adding insight
- Replaced the HRV/resting HR modal sparkline with a wider labelled chart showing axes, dates, 7-day baseline, and green/amber/red status context

## 2026-06-07 — Readiness chip modal routing fix (Codex)

- HRV and resting HR readiness chips now open metric-specific insight modals instead of the overall readiness plan
- View recovery plan continues to open the readiness plan modal; Watch effort still opens Watch effort details

## 2026-06-07 — Home health InsightModals (Codex)

- Added tappable Home metric cards for HRV, resting HR, steps, and active calories with detail panels for today's value, recent trend, baseline, explanation, and recommendation
- Added Watch effort detail modal from the Home readiness chip with matched workout stats, weekly hard-workout count, calories, minutes, and recommendation context
- Added recovery trend detail modal with larger HRV/RHR chart, current trend read, and guidance on how to interpret the pattern

## 2026-06-07 — Explicit Start Set timing and recovery CTA cleanup (Codex)

- Recovery-day Home card now shows one primary action: "View recovery plan", which opens the readiness modal; duplicate top-card "See why" is hidden in that state
- Set rows now use explicit `Start` → running timer → `Done` states so `setStartedAt` reflects when Phill starts the set, not when a field is edited
- Completing a running set records `setCompletedAt`; completing without Start still has the conservative fallback for older/edge flows

## 2026-06-07 — Insight modal usability fixes (Codex)

- Fixed Exercise InsightModal layering/scrolling so the bottom content is reachable above the app nav, including shorter mobile viewports
- Added a proper Home readiness insight modal; the top-card "See why" button now opens recovery signals, explanation, and recommendation details
- Changed recovery-day "Review plan" to open the readiness explanation instead of silently jumping straight to the Workout tab

## 2026-06-07 — Exercise InsightModal and effort history (Codex)

- Added tappable "View insight" action to the workout exercise "NEXT TIME" panel
- Added `ExerciseInsightModal` with recommendation explanation, recent performance chart, load/volume/RPE/pain summary, Watch effort status, and safety rationale
- Added `exerciseHistoryPoints()` and `ExerciseHistoryChart()` to compare recent exercise sessions and overlay average heart rate when Watch samples match
- Added session-aware Watch sample matching helpers so exercise effort can filter by matched Apple Watch workout when match/source identifiers are available
- Modal clearly labels Watch effort as unavailable until a timestamped IronLog workout and matching Watch export exist

## 2026-06-07 — Exercise effort intelligence foundation (Codex)

- Added forward-looking exercise/set timing fields: `exerciseStartedAt`, `exerciseCompletedAt`, `setStartedAt`, `setCompletedAt`, and session `completedAt`
- Set timing now starts on first set edit and completes when Done is tapped; Done without prior edit creates a conservative estimated work window
- IronLog now fetches `apple_workout_samples` alongside Watch workout summaries so future exports can support exercise-effort matching
- Added confidence-scored Watch effort helpers and rule-based exercise progression recommendations gated by pain, recovery, RPE, and Watch effort
- Workout screen now shows a "NEXT TIME" recommendation panel for the current exercise, with Watch effort details when timestamped sample data is available

## 2026-06-07 — Iron Series icons, equipment list, exercise library (Claude Sonnet 4.6)

- Iron Series exercise library: all 40 `IRON_EXERCISES` now appear in Manage → Library → Exercises, searchable by name
- Added `Quads` and `Hamstrings` to `MUSCLE_FILTERS`; filter now checks `ex.primaryMuscle` in addition to `ex.muscle` so Iron exercises sort correctly into anatomical filter pills
- Added `equipment` arrays to all 30 `IRON_WORKOUTS` entries (sourced from original video descriptions): Dumbbells, Exercise Mat, Chair or Bench, Yoga Block, Glute Band as applicable per day
- IronSeriesView: equipment checklist renders below exercise list — emoji-tagged chips (🏋️ Dumbbells / 🟦 Mat / 🪑 Chair or Bench / 🧱 Yoga Block / 🔴 Glute Band) under a "YOU'LL NEED" header, divider above YouTube link
- Codex icon generation: Batches 1–3 complete and pushed (exercises 1–15: heel-elevated squat → bench dip); Batch 4 in progress (exercises 16–20)
- Iron Series tap-to-animate: ExerciseIcon components in IronSeriesView now pass `onDemoOpen` handler — tapping an icon opens ExerciseDemoModal

## 2026-06-07 — Apple Watch workout export pipeline (Codex)

- Added Supabase `apple_workouts`, `apple_workout_samples`, and `ecg_readings` tables; raw Health Auto Export payloads retained in `health_export_captures`
- Deployed `ingest-workouts` and `ingest-ecg` Edge Functions with `x-ironlog-ingest-key` validation; workout exports now parse into normalized summaries and minute samples
- Backfilled Phill's exported workout/ECG captures: 4 Apple Watch strength workouts, 477 samples, 1 ECG reading
- Added `ironlog_watch_matches` Supabase view linking Apple Watch workouts to IronLog sessions by time overlap and confidence
- IronLog Home now fetches Watch matches/workouts/ECG and shows a compact "Last workout matched" effort card; ECG remains stored but not used in normal readiness scoring

## 2026-06-07 — Polished Home screen redesign (Codex)

- Rebuilt the top Home screen toward the approved professional mockup: large readiness verdict card, action buttons, recommendation tiles, compact signal strip, recovery trend card, and combined weekly summary
- Added `dash` mini design system for Home cards, labels, chips, icon boxes, rounded surfaces, and softer shadows
- Added Home components: `ReadinessSummaryCard`, `TrainingRecommendationTiles`, `DailySignalsStrip`, `RecoveryTrendCard`, and `ThisWeekSummaryCard`
- Watch workout effort now informs the readiness explanation/reason chips instead of taking over the screen; ECG remains quiet unless needed later for abnormal recent readings
- Recovery trend chart height tightened so the first viewport shows more useful information before scrolling

## 2026-06-06 — Sleep-aware recovery score (Claude Sonnet 4.6)

- `computeRecovery()` now adapts automatically based on sleep data availability
- **With sleep** (≥3 nights in 7-day window + last-night reading): HRV 40% + RHR 30% + Sleep 30% — matches Oura/WHOOP weighting
- **Without sleep** (watch not worn overnight): HRV 70% + RHR 30% — graceful fallback, clearly labelled as estimate
- Recovery card disclaimer updates dynamically: shows actual sleep hours and weights when sleep is available, or "no sleep reading for last night" when it isn't
- Extended `ingest-health` Edge Function (v2): added `sleep_analysis → sleep` to METRIC_MAP
- `pullHealthMetrics()` and `pushHealthMetrics()` now include sleep
- App state, startup `useEffect`, and localStorage load all extended for sleep
- Sleep metric: Health Auto Export reports "Sleep Analysis" as hours per night (no unit conversion needed)

## 2026-06-06 — Recovery score methodology overhaul (Claude Sonnet 4.6)

- Replaced simple ratio formula with science-based SD-band approach (Buchheit 2014, Plews 2013, Altini/HRV4Training methodology)
- Baseline: 7-day rolling mean + standard deviation (was: 14-day mean ratio)
- Weighting: HRV 70%, resting HR 30% (was: 50/50 — HRV is more sensitive to recovery)
- Scoring: `score = clamp(50 + zCombined × 15, 0, 100)` where 50 = exactly at your average; each ±1 SD = ±15 pts
- Thresholds: Good ≥ 60, Fair 38–59, Low < 38 (was: Good ≥ 75, Fair ≥ 55)
- Real-data result for June 5/6: was 100% Good (inflated), now correctly 46% Fair (HRV 0.45σ below 7-day mean)
- Recovery ring now shows z-score context: "HRV ↑1.9σ · RHR ↓2.2"
- Added disclaimer: "Estimate · based on HRV + resting HR vs 7-day baseline · sleep data not yet available"
- Training recommendation thresholds updated to match new scale
- Requires ≥3 data points in 7-day window; fallback SD = 10% of mean (typical HRV CV)

## 2026-06-06 — Recovery Dashboard fixes and polish (Claude Sonnet 4.6)

- Fixed StrengthWeekCard: was filtering out Iron Series sessions (`IRON_` exclusion). All completed sessions — A/B/C and Iron Series — now count toward weekly sessions, volume, and time
- Moved Cycling/Strength week cards + Weekly Heatmap + Recent Workouts above the Selected Workout hero card, so all health/activity data is grouped together at the top of the Home screen
- Metric cards: converted from 2×2 grid to horizontal 4-wide strip (all cards visible on screen without scrolling)
- MetricSparkline: converted from plain polyline to SVG area chart with gradient fill, matching target mockup's shaded sparkline style
- Added Lucide icons to each metric card (activity / heart / footprints / flame)
- Active Cal comparison now shows 7-day average value ("581 avg") instead of "+X vs avg" delta
- Today's Training cards: now use soft-blue icon box layout (Lucide dumbbell/bike) matching target mockup
- Weekly Activity Heatmap + Recent Workouts displayed side by side (heatmap ~45%, recent ~55%)
- Recovery ring capped at 100% visually — formula may exceed 100 but ring never overfills
- Trend chart x-axis: shows 3–4 evenly-spaced date labels instead of only first/last
- Strength week card stats in 3-column grid (Volume | Top Lift Increase | Total Time)
- Added Readiness sub-row to Recovery Summary card (label + context text)
- Today's Training shows regardless of whether health data is present

## 2026-06-06 — Recovery Dashboard — initial build (Claude Sonnet 4.6)

- New Home screen greeting: "Good morning/afternoon/evening, Phill" with today's date
- Recovery Summary card: circular ring (green/amber/red, 0–100%), segmented fatigue bar, training load bar. Formula: `recoveryScore = round((hrvScore × 0.5) + (rhrScore × 0.5))` using 14-day rolling baseline
- Today's Training: two recommendation boxes (Weight Training, Cycling) with Recommended / Take it steady / Recovery suggested based on recovery score
- 4-metric sparkline grid: HRV, Resting HR, Steps, Active Cal — colour-coded vs 14-day rolling average
- Recovery Trends: dual-axis line chart (HRV blue, Resting HR red) with 7D / 30D / 90D toggle; data points green/amber/red vs baseline; auto-generated insight text
- Cycling This Week card: total km, % vs last week, longest ride, day-by-day bar chart
- Strength This Week card: sessions, volume (tonnes), top lift increase, total time, day-by-day bar chart
- Weekly Activity Heatmap: GitHub-style 5-week grid (Mon–Sun rows), colour-coded grey/blue-tint/blue/amber/green by steps+workout+goal status
- Recent Workouts section: last 3 activities (sessions + rides combined), "View all" → Log tab, "+ Log Workout" CTA
- New helpers: `computeRecovery()`, `computeFatigue()`, `computeTrainingLoad()`, `computeTrendInsight()`, `timeGreeting()`, `rollingAvg()`, `getLatestReading()`
- New components: `RecoveryRing`, `FatigueBar`, `MetricSparkline`, `RecoveryTrendChart`, `CyclingWeekCard`, `StrengthWeekCard`, `WeeklyHeatmap`, `RecentWorkoutsSection`
- All new sections hidden gracefully when no health data is present — existing workout flow unchanged
- Dashboard now accepts `healthData` prop; App passes it from state

## 2026-06-06 — Health tab chart improvements (Claude Sonnet 4.6)

- X-axis date labels now show "May 30" / "Jun 5" instead of raw "05-30" / "06-05"
- Workout day markers (amber ▲ triangles) on chart x-axis for days with completed sessions
- HRV card: GOOD / FAIR / LOW recovery status badge + delta vs 30-day average
- Resting HR card: ↓/↑ week-over-week trend with "improving ✓" / "trending up" label
- Steps card: "X / N days hit target (XX%)" stat below chart
- Active Cal card: 7-day average callout below chart
- Import card demoted from prominent blue card to small text link at bottom of Body section
- "No data" copy updated to mention nightly auto-sync

## 2026-06-05 — Supabase health metrics pipeline (Claude Sonnet 4.6)

- Deployed `ingest-health` Supabase Edge Function — accepts Health Auto Export v1 JSON via POST, upserts to `health_metrics` table. Maps: `heart_rate_variability→hrv`, `resting_heart_rate→resting_hr`, `step_count→steps`, `active_energy→active_cal`. Converts active_energy kJ→kcal (÷4.184). Handles CORS.
- Created `health_metrics` Supabase table: columns `(metric text, date date, value numeric, updated_at timestamptz)`, PRIMARY KEY `(metric, date)`. RLS: anon SELECT, service-role INSERT/UPDATE.
- Added `pullHealthMetrics()`: fetches all health_metrics rows, sorts by metric type, returns `{hrv, restingHr, steps, activeCal}` arrays. Called on app startup in parallel with sessions/rides pulls.
- Added `pushHealthMetrics(healthData)`: upserts current health state to Supabase after bulk import. Fire-and-forget cloud backup.
- Added `localDateStr()` helper: formats Date objects as YYYY-MM-DD in local timezone (fixes UTC mismatch bugs where early-morning workouts appeared on previous day)
- Fixed consistency heatmap streak counter to start from today (not array end) — future cells no longer zero out streaks
- Startup `useEffect` parallelised: `Promise.all([pullSessions, pullRides, pullHealthMetrics])`. Cloud health data takes precedence over localStorage cache.
- Added `parseHealthAutoExport()`: parses Health Auto Export v1 JSON, extracts HRV/Resting HR/Steps/Active Cal, converts units, validates dates, returns merged readings
- Health tab Body section: "Import Health Auto Export JSON" bulk import modal (accepts full export file, merges all metrics at once, syncs to cloud on confirm)
- Health Auto Export automation configured: POST to Edge Function URL, 1-Day sync cadence, nightly auto-export

## 2026-06-05 — Shortcuts Health Import Compatibility

- Health Body import now accepts Shortcuts-friendly `{"dates":"...","values":"..."}` JSON and zips newline-separated rows into readings
- Existing `[{date,value}]` health import format still works
- Removed Sleep from the Body metrics; retained HRV, Resting HR, Steps, Active Calories, and Cardio Fitness

## 2026-06-05 — Apple Health Body Import

- Added Health → Body section for Apple Watch / Apple Health imports
- Added localStorage-backed imports for HRV, Resting HR, Steps, Active Calories, Cardio Fitness, and Sleep
- Added paste-JSON import modal per metric with validation, date dedupe, newest-value merge, imported count, and error feedback
- Added Body charts: HRV and Resting HR 30-day lines, Steps / Active Calories / Sleep 14-day bars, and sparse Cardio Fitness line chart
- Added HRV workout-day vs rest-day comparison for the last 30 days when enough HRV data exists

## 2026-06-05 — Health Tab (Training section)

- Added ❤️ Health tab (7th nav tab)
- Weekly volume: 6-week bar chart (kg × reps, completed kg sets, non-Iron sessions)
- Volume by workout type: Push / Pull / Legs+Core horizontal bars for current week
- Consistency: 28-day heatmap grid + streak / total sessions / per-week stats
- Recent PRs: kg exercises that hit their all-time max weight within the last 30 days
- Effort trend: line chart of average RPE per session, last 10 sessions, coloured green/amber/red by intensity
- Body section (Apple Watch / HRV / Sleep) deferred — to be added once Watch Shortcut is set up

## 2026-05-30 — Iron Series Integration

- Added Caroline Girvan's Iron Series (30 workouts, 6-week dumbbell programme) as a parallel programme
- Workout tab now has "My Split / 🔩 Iron Series" toggle — both programmes track independently
- 40 new exercises in `IRON_EXERCISES` constant; 30 workouts in `IRON_WORKOUTS` constant
- `nextIronDay(sessions)` derives next Iron day from session history; loops back to Day 1 after Day 30
- Iron sessions: energy check → exercises → complete (no warmup, no finisher; user follows video)
- `defaultDuration` is reference-only — no timer lockout; user follows video timing
- History: Iron sessions show `🔩 N` day badge and "Iron Series — Day N" title
- Exercises shared with A/B/C (RDL, hip thrust, etc.) contribute to the same Stats charts
- 40 MUSCLE_META entries added for all new Iron exercises
- Direct YouTube video IDs populated for all 30 Iron days; icons remain a separate Codex pass — see ICON-GUIDE.md

## 2026-05-28 — Per-Workout Warm-Up Defaults

- `WARMUP_GROUPS.defaultId` changed from a single string to `{ A, B, C }` so each workout gets targeted defaults
- Workout A (Push): Chest slot = chest-opener; Hips = figure-four; Ankles = circles
- Workout B (Pull): Chest slot = biceps-wall stretch (primes pull chain); Hips = hip-flexor; Ankles = circles
- Workout C (Legs): Chest slot = upward-dog (thoracic/hip-flexor); Lower Back = child's pose (lumbar decompression); Hips = 90/90-hip; Ankles = dorsiflexion
- Neck, shoulders, trunk, and legs (hamstring) unchanged across all workouts — sciatica/hamstring care retained
- `getWarmupConfig` and `saveWarmupChoice` updated to resolve per-workout defaults; existing saved choices unaffected

---

## 2026-05-26 — Session Set Editing

- History: expanded session cards now have an "✏ Edit" button (left) alongside "🗑 Delete" (right)
- Edit mode: inline input rows for weight, reps, RPE, pain, duration per set
- Add set (copies last set's values) and delete set per exercise
- Exercise notes editable as a text field
- Save writes to localStorage immediately; Cancel discards all changes
- Handles all exercise types: standard (kg), timed (secs), bodyweight, band, pullup-tracking (bw/band/neg)

---

## 2026-05-26 — Customisable Stretch Routine

- Added `STRETCH_GROUPS` constant: 12 body-part slots each with a default stretch and picker options
- Added `getStretchConfig()`, `saveStretchChoice()`, `resetStretchConfig()` helpers; storage key `il_stretch_config`
- Added `StretchSetup` component: 12 rows with Change button, duration estimate, Reset to defaults
- Added `StretchPicker` component: full-screen overlay with all options for a slot; Sciatica/Cross-legged/Caution pills
- Added `StretchActive` component: guided execution with SVG countdown ring, bilateral auto-advance (1.5s Switch Sides), three footer states, Skip all
- Dashboard: replaced static stretch accordion with simple card + "Start Stretching" button
- Removed old `ActiveStretch` component
- `view === 'stretch'` aliased to `'stretch_setup'` for backward compatibility

---

## 2026-05-25 — Warm-Up UX refinements + Stats picker grouping

- Warm-up execution: timer now requires a manual **▶ Start** tap before counting down — gives time to read the stretch and get into position
- Bilateral stretches (e.g. Neck Rotation): side 1 requires manual start; when it finishes a green ✓ Switch Sides indicator shows for 1.5s then side 2 auto-starts — no second tap needed
- Fixed warm-up active screen footer being hidden behind the fixed nav bar (missing `paddingBottom` to clear safe-area + nav height)
- Stats screen exercise picker now grouped by workout (Workout A — Push / Workout B — Pull / Workout C — Legs + Core / Other) with exercises sorted A–Z within each group, using native `<optgroup>` labels

## 2026-05-24 — Customisable Warm-Up

- Replaced static warm-up checklist with a three-screen flow: **Setup → Picker → Guided execution**
- Setup screen: 8 compact rows (one per muscle-tendon group — Neck, Shoulders, Chest, Trunk, Lower Back, Hips, Legs, Ankles), each with a Change button
- Picker: full-screen overlay per group showing curated stretch options with Sciatica / Cross-legged / Caution pills so you can pick based on your goal
- Guided execution: one stretch at a time, SVG countdown ring, cue text; see 2026-05-25 entry for final execution behaviour
- Per-workout config (A, B, C each store independent choices) persisted in `il_warmup_config` localStorage key
- Skip Warm-Up and Reset to defaults available from the setup screen; Skip all → and Skip this stretch available during execution
- Backward compatible: sessions stored with old `phase:'warmup'` resume at the setup screen

## 2026-05-24 — 8 new stretches + three-way filter (Sciatica / Cross-legged)

- **Sciatica additions** (from OAH clinical PDF + Healthline): Knee to Opposite Shoulder, Double Knee to Chest, Supine Sciatic Nerve Glide, Lower Trunk Rotations (Wig Wags ⚠️ disc caution). SCIATICA_IDS now covers 15 stretches.
- **Cross-legged sitting additions**: Butterfly Stretch (adductors — the key missing piece), Deep Squat Hold (⚠️ disc caution), Lateral Lunge Stretch, Pilates Saw (posture/thoracic). CROSS_LEGGED_IDS covers 14 stretches.
- Stretches tab filter upgraded from 2-way to 3-way: **All / ◈ Sciatica / ⊕ Cross-legged**. Purple pill = Sciatica, Green pill = Cross-legged. Both flags independent (a stretch can carry both).
- Total stretch library: 39 cards.

## 2026-05-24 — Sciatica Stretches + Filter

- Added 2 new sciatica-specific stretches: Sciatic Nerve Floss (neural mobilisation), Seated Piriformis Stretch. Both appear in the Stretches tab.
- 11 stretches now flagged `sciatica: true` via `STRETCH_SCIATICA_IDS` set — includes Figure Four, Pigeon, Child's Pose, Knee to Chest, both hamstring stretches, Prone Cobra, 90/90 Hip, Seated Forward Fold, and both new ones.
- Purple "Sciatica" pill shown on flagged cards. "All stretches / ◈ Sciatica only" toggle added to the Stretches tab header.

## 2026-05-24 — Stretch Library Expanded (13 new stretches)

- Added 13 new stretches to STRETCH_LIBRARY covering all 8 major muscle-tendon groups: neck (Neck Rotation), shoulders (Overhead Triceps Stretch), chest (Upward Facing Dog, Biceps Wall Stretch), trunk (Standing Side Bend), lower back (Knee to Chest, Lying Spine Twist ⚠️), hips (90/90 Hip Stretch, Pigeon Pose ⚠️), legs (Standing Quad Stretch, Seated Forward Fold), ankles (Ankle Circles, Wall Ankle Dorsiflexion). Caution banners added for Lying Spine Twist and Pigeon Pose. Redrawn icons for str_pec_roller_t, str_pec_roller_w, str_it_band committed. Library now shows 29 stretch cards total.

## 2026-05-23 — Stretch Library Tab

- Manage → Library now has Exercises / Stretches sub-tabs. Stretches tab shows 19 curated items (12 full-body flexibility, 5 warm-up mobility, 2 workout finishers) with expandable cards: stretch image, MuscleDiagram with target-area highlights, hold time, and cue text.

## 2026-05-20 — Exercise View Improvements

- Previous session notes reminder: if notes were written for an exercise in the last session, shown as a read-only 📝 banner above the set rows
- Muscle diagram collapsed by default: tap MUSCLES ▼ to expand, resets to collapsed on each exercise

## 2026-05-19 — AI Coach & Home Screen Redesign

- Added `computeCoachRecommendation(sessions, rides, override)` rules engine
- Reads last 7 days: pain ≥ 3, avg RPE ≥ 8, ride within 48h, days since last session ≥ 4
- New `'preStart'` view — review modifications and optionally swap exercises before session begins
- Safe swaps: rdl → hip_thrust, kb_deadlift → hip_thrust, p_bb_row → cs_db_row, chin_up → band_row, goblet_squat → reverse_lunge
- Coach modification notes rendered ephemerally via props in ActiveWorkout — not stored in sessions
- Dashboard unified card: coach note panel (🤖), flag pills, Why? expand, Safe Swaps link
- New 7-day week strip (Mon–Sun) below unified card
- `buildSession()` updated: accepts preStartSwaps, deduplicates exercise list, returns phase:'energy'
- `startSession()` updated: preserves pre-built session from pre-start screen

## 2026-05-16

- [Codex] Added and verified PNG exercise icons for ten missing/default workout exercise IDs.
- [Codex] Rewrote MuscleDiagram to inline annotated anatomical SVGs and colour muscles from primary/secondary arrays.
- [Codex] Revised the iOS/PWA app icon again to remove the blue monogram look and better match the brushed-metal reference.
- [Codex] Replaced the iOS/PWA app icon with a brushed-metal rounded-square IL design.

## 2026-05-15

- [Codex] Replaced the iOS/PWA app icon with a steel-blue IL monogram and moved icon source to assets/app-icon.png.
- [Codex] Replaced chin-up PNG icon with a reference-style wall-mounted pull-up bar illustration.
- [Codex] Added build-version cache busting to PNG exercise icon URLs so updated icons load on deployed devices.
- [Codex] Added transparent PNG exercise icons for Workouts A and B using the approved RDL-style art direction.
- [Codex] Regenerated Workout C PNG icons to match the approved RDL-style art direction.
- [Codex] Added transparent PNG exercise icons for the current Workout C lineup and updated ExerciseIcon to prefer PNG assets with SVG fallback.
- [Codex] Updated warmup with mobility/stretch work and revised Workout A/B/C exercise lineups.

## 2026-05-14

- [Codex] Added IMAGE-PROCESS.md documenting the tested exercise icon PNG cleanup workflow and failed conversion attempts.
- [Codex] Prototyped richer two-tone mini-illustration icons for the seven visible Workout C exercises.
- [Codex] Added exercise-specific SVG stick-figure icons for all 71 built-in exercises and rendered them on Dashboard workout rows and the active workout header.

## 2026-05-13

- [Codex] Applied Phase 2 visual redesign — restructured Dashboard hero/sync row, added Lucide icons, and attached primary/secondary muscle metadata to built-in exercises.
- [Codex] Applied Phase 1B visual redesign — switched from dark steel-blue to light blue theme and changed active/CTA text to white.
- [Codex] Applied Phase 1 visual redesign token pass — steel-blue dark palette, cooler status colours, softer primary button radius, reduced headline/loading letter spacing.
- [Claude] Fixed false PR detection — `filter(s => s.done)` in `detectPRs` for current and historical sets. See BUG-001. Commit: f0ba663
- [Codex] Moved JSON backup/restore controls from Dashboard into Manage → Backup tab. Commit: d145ebb
- [Codex] Fixed band/bodyweight set row layout. Commit: bf3c377
- [Claude] Added auto-update indicator — ↺ button next to IRONLOG header pulses amber when a newer deployed version is detected. Commit: 9f36697
- [Claude] Added "Check for updates" button to home screen. Commit: 2e66d1d
- [Claude] Implemented Supabase auto-sync — sessions and rides pushed after each save; count-based restore on load; sync blocked during active session. Commit: f0cfb30
- [Claude] Added 8 new exercises: bb_flat_bench, bb_incline_bench, chin_up, face_pull, reverse_fly, rdl, reverse_lunge, farmers_walk
- [Claude] Revised default workouts A/B/C — barbell bench as primary push compound, chin-up + face pull in pull, RDL + reverse lunge in legs
- [Claude] Removed contraindicated exercises from PRESET_LIBRARY — p_good_morning, p_russian_twist, p_nordic_curl. See BUG-006. Commit: 908a90d
- [Claude] Fixed p_pull_up cue — narrow grip only, band-assisted start specified. See BUG-007. Commit: 908a90d
- [Claude] Updated docs to reflect implementation session. Commit: 3f1e616
