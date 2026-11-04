# IronLog — Bug Tracker

Canonical list of open and closed bugs. Use stable IDs when referencing from commits, ROADMAP.md, or CHANGELOG.md.

Format for commits: `Fix BUG-NNN: short description`

---

## Open

*(No high-priority bugs currently open)*

---

## Fixed

### BUG-014 [FIXED] Overnight Apple Health export was not refreshed into an open app
**Fixed:** 2026-11-05 by Codex
**Detail:** Health Auto Export was reaching Supabase, but an already-open PWA had no focus/visibility refresh. On startup, stale local same-day readings could also overwrite the fresh cloud value during the merge.
**Fix applied:** Startup and explicit Sync now prefer cloud readings for matching dates; the app refreshes on focus, visibility return, and a 15-minute interval while open.

### BUG-013 [FIXED] New Apple Health imports were hidden by stale cloud data
**Fixed:** 2026-11-03 by Codex
**Detail:** Startup used any non-empty Supabase metric array in preference to local data, so newer local exports could disappear after reload. Bulk and single-metric imports also reported cloud sync success without checking the Supabase response.
**Fix applied:** Health data now merges cloud and local readings by date, with the local import winning on duplicate dates. Health imports await the upsert and report whether cloud sync was confirmed. The deployed `ingest-health` function now accepts separate sleep-stage blocks and normalises hour/minute/second units safely.

### BUG-011 [FIXED] Weekly AI review hid useful service failure detail
**Fixed:** 2026-11-02 by Codex
**Detail:** Weekly review failures were shown only as a generic “non-2xx status code”, and the full history context could exceed a provider's request limit.
**Fix applied:** Weekly reviews now use a smaller bounded context, the client preserves the Edge Function HTTP status and response body detail, the deterministic fallback includes available evidence, and the Edge Function emits request-scoped operational telemetry without health payloads.

### BUG-012 [FIXED] Home readiness used an unvalidated composite recovery score
**Fixed:** 2026-11-02 by Codex
**Detail:** Recovery was presented as a 0–100 score built from IronLog-specific weights for HRV, resting HR, and sleep.
**Fix applied:** Home and Health now use an Apple Health SDNN HRV-led personal baseline protocol with an explicit insufficient-data state; sleep remains separate context and no composite score is displayed.

### BUG-002 [FIXED] Overload nudge fires too early
**Fixed:** 2026-05-18 (confirmed by Claude code review — fix already in codebase)
**Detail:** Several exercises have `defaultReps === repMax` (goblet squat, DB bench, KB deadlift, split squat). Completing prescribed reps on the first session triggers "add load." Logic also ignored high pain and high RPE.
**Fix applied:** `checkOverloadNudges` guards with `def.repMax <= def.defaultReps` (early return), `doneSets.some(s => Number(s.pain) >= 3)` (pain gate), and avgRpe > 8 check excluding blank RPE values. Per-set comparison remains `>= repMax`.

---

### BUG-003 [FIXED] Import validation missing — bad JSON shape crashes app
**Fixed:** 2026-05-18 (confirmed by Claude code review — fix already in codebase)
**Detail:** `importData()` parses JSON but does not validate that `sessions` and `rides` are arrays. Also does not call `setActiveSession(null)` on success — importing mid-workout leaves a stale active session in state.
**Fix applied:** `handleImport` validates `sessions`, `rides`, and `customExercises` with `Array.isArray()` checks and throws descriptive errors on mismatch. `setActiveSession(null)` called on successful import.

---

### BUG-004 [FIXED] Resume state incomplete — phase, exIdx, and elapsed time reset on reload
**Fixed:** 2026-05-18 (confirmed by Claude code review — fix already in codebase)
**Detail:** When `il_active` exists, `ActiveWorkout` always reopened at workout phase and exercise index 0. Elapsed time restarted from zero.
**Fix applied:** Phase restores from `activeSession?.phase`. `exIdx` initialises via `findIndex` to first exercise with any incomplete set. Elapsed computed as `Math.floor((Date.now() - session.startTime) / 1000)` using wall-clock timestamp; timer interval also anchors to `session.startTime`.

---

### BUG-005 [FIXED] Blank Train screen — no recovery path for malformed active session
**Fixed:** 2026-05-18 (confirmed by Claude code review — fix already in codebase)
**Detail:** If `il_active` contains a session with no valid `exercises` array, the workout phase returned `null` with no recovery path.
**Fix applied:** Guard at top of `ActiveWorkout` render: if `session` exists but `session.exercises` is not a non-empty array, renders a "SESSION DATA CORRUPTED" screen with a "Clear Session & Start Fresh" button that calls `setActiveSession(null)`.

---

### BUG-008 [FIXED] Finisher notes lost on reload before completion
**Fixed:** 2026-05-18 by Claude
**Detail:** Finisher note updates only local `session` state and never called `setActiveSession`. Notes typed before tapping Complete were lost on reload.
**Fix applied:** `onChange` now calls both `setSession` and `setActiveSession` so notes are immediately persisted to localStorage.

---

### BUG-009 [FIXED] EXERCISES not browseable in Manage → Library
**Fixed:** 2026-05-18 (confirmed by Claude code review — fix already in codebase)
**Detail:** The Library tab in Manage only showed `PRESET_LIBRARY` and custom exercises. Base `EXERCISES` items were not listed.
**Fix applied:** `libraryEntries` in `Manage` now spreads `Object.entries(EXERCISES)` first, followed by `PRESET_LIBRARY` and `customExercises`.

---

### BUG-010 [FIXED] Equipment-incompatible exercises appear in mid-session Add Exercise picker
**Fixed:** 2026-05-18 by Claude
**Detail:** Cable machines, leg press, T-bar row, and other equipment the user does not own appeared in the Add Exercise picker mid-session.
**Fix applied:** Added `gymOnly: true` to 7 machine-only exercises (p_cable_fly, p_lat_pulldown, p_seated_cable_row, p_t_bar_row, p_leg_press, p_leg_extension, p_seated_leg_curl). The picker now filters out any exercise where `gymOnly === true`.

---

### BUG-001 [FIXED] False PR detection on undone sets
**Fixed:** 2026-05-13 by Claude
**Commit:** f0ba663
**Detail:** `detectPRs` included sets where `s.done === false`. Pre-filled weights from the previous session that were never lifted could register as PRs. Also affected historical baseline (`prevMax`).
**Fix applied:** `filter(s => s.done)` added before mapping weights in both current-session and historical-session paths.

---

### BUG-006 [FIXED] Contraindicated exercises in PRESET_LIBRARY
**Fixed:** 2026-05-13 by Claude
**Commit:** 908a90d
**Detail:** `p_good_morning` (loaded spinal flexion), `p_russian_twist` (loaded spinal rotation), and `p_nordic_curl` (extreme eccentric hamstring load) were present in PRESET_LIBRARY and appeared in the mid-session Add Exercise picker. All three are contraindicated for this user's medical constraints.
**Fix applied:** All three removed from PRESET_LIBRARY.

---

### BUG-007 [FIXED] p_pull_up cue unsafe for shoulder bursitis
**Fixed:** 2026-05-13 by Claude
**Commit:** 908a90d
**Detail:** Cue said "full hang to chin over bar" without specifying grip width. Wide-grip pull-ups are contraindicated for bilateral shoulder bursitis.
**Fix applied:** Cue updated to specify shoulder-width or narrower grip only, band-assisted start, negatives progression.
