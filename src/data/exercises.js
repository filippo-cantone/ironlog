// Canonical preset and Iron Series exercise metadata.
const YT = q => 'https://www.youtube.com/results?search_query=' + q;

export const PRESET_LIBRARY = {
  // ── Arms: Biceps ──────────────────────────────────────────────────
  p_db_bicep_curl:      { name: 'Dumbbell Bicep Curl',        muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Keep elbows tucked to sides. Full range, controlled descent.', demoId: 'PuaJzTatIJM', demo: YT('dumbbell+bicep+curl+proper+form') },
  p_barbell_curl:       { name: 'Barbell Curl',               muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Shoulder-width grip. No swinging. Squeeze at the top.',        demoId: 'Xq3HiacA4dA', demo: YT('barbell+curl+proper+form+tutorial') },
  p_hammer_curl:        { name: 'Hammer Curl',                muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Neutral grip (thumbs up). Targets brachialis and forearms.',    demoId: 'NyW2fT2gQhM', demo: YT('hammer+curl+form+tutorial') },
  p_concentration_curl: { name: 'Concentration Curl',         muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 12, cue: 'Elbow braced on inner thigh. Slow and deliberate.',            demoId: 'I_bKCYL2nL8', demo: YT('concentration+curl+tutorial+form') },
  p_preacher_curl:      { name: 'Preacher Curl',              muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 10, cue: 'Arm supported on pad. Do not let elbow fully lock out.',        demoId: 'BPmUhDtdQfw', demo: YT('preacher+curl+tutorial+form') },
  // ── Arms: Triceps ─────────────────────────────────────────────────
  p_tricep_pushdown:    { name: 'Tricep Pushdown',            muscle: 'Arms',      unit: 'band', defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Elbows at sides, push down to full extension. Control return.', demoId: '4s8Fdhnk6aI', demo: YT('tricep+pushdown+band+cable+form') },
  p_overhead_ext:       { name: 'Tricep Overhead Extension',  muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Upper arms vertical. Only forearms move. Keep core braced.',    demoId: 'b_r_LW4HEcM', demo: YT('tricep+overhead+extension+dumbbell+form') },
  p_skull_crushers:     { name: 'Skull Crushers',             muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Lower bar to forehead slowly. Keep elbows narrow and vertical.', demoId: 'G8CAGNSpzBY', demo: YT('skull+crushers+proper+form+tutorial') },
  p_tricep_dips:        { name: 'Tricep Dips',                muscle: 'Arms',      unit: 'bw',   defaultSets: 3, defaultReps: 8,  repMax: 12, cue: 'Hands on bench behind you. Lower slowly, elbows back.',        demoId: '4ua3MzaU0QU', demo: YT('tricep+dips+bench+form+tutorial') },
  p_close_grip_bench:   { name: 'Close-Grip Bench Press',     muscle: 'Arms',      unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Hands shoulder-width. Elbows close to body throughout.',       demoId: 'hWEpF7lFR9Q', demo: YT('close+grip+bench+press+form+tutorial') },
  // ── Shoulders ─────────────────────────────────────────────────────
  p_lateral_raise:      { name: 'Lateral Raise',              muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Slight bend in elbows. Raise to shoulder height only. Light weight.', demoId: 'ryfDT8pNSG4', demo: YT('lateral+raise+proper+form+tutorial') },
  p_front_raise:        { name: 'Front Raise',                muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 12, cue: 'Arms straight, raise to eye level. Avoid shoulder impingement.', demoId: 'vtJfIcyrWO8', demo: YT('front+raise+dumbbell+form+tutorial') },
  p_db_shoulder_press:  { name: 'DB Shoulder Press',          muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Start at ear level, press overhead. Avoid arching lower back.', demoId: '2D0TyoHv_EY', demo: YT('dumbbell+shoulder+press+form+tutorial') },
  p_arnold_press:       { name: 'Arnold Press',               muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 10, cue: 'Rotate palms as you press — in to out. Covers all three delt heads.', demoId: 'wRlIuexTowA', demo: YT('arnold+press+form+tutorial'), caution: 'Shoulder bursitis — rotation may aggravate. Start very light and stop if impingement.' },
  p_rear_delt_fly:      { name: 'Rear Delt Fly',              muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 15, repMax: 15, cue: 'Hinge at hips, slight bend in elbows. Lead with elbows back.',  demoId: 'KoRDmXocJII', demo: YT('rear+delt+fly+dumbbell+form+tutorial') },
  p_shrugs:             { name: 'Dumbbell Shrugs',            muscle: 'Shoulders', unit: 'kg',   defaultSets: 3, defaultReps: 15, repMax: 15, cue: 'Straight up and down. No rolling. Hold at top 1 sec.',          demoId: 'RLHxN6hq8NA', demo: YT('dumbbell+shrugs+form+tutorial') },
  // ── Push: Chest ───────────────────────────────────────────────────
  p_push_up:            { name: 'Push-Up',                    muscle: 'Push',      unit: 'bw',   defaultSets: 3, defaultReps: 10, repMax: 20, cue: 'Straight body, elbows 45°. Lower chest to floor.',              demoId: 'WDIpL0pjun0', demo: YT('push+up+proper+form+tutorial') },
  p_db_fly:             { name: 'Dumbbell Fly',               muscle: 'Push',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 12, cue: 'Slight bend in elbows throughout. Wide arc, feel the stretch.', demoId: 'fKHCefJ9aP4', demo: YT('dumbbell+fly+proper+form+tutorial'), caution: 'Shoulder bursitis — light weight only. Limit range, stop before arms go fully wide. Stop if impingement.' },
  p_incline_db_press:   { name: 'Incline DB Press',           muscle: 'Push',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 10, cue: '30–45° incline. Elbows at 45°. Targets upper chest.',           demoId: 'ljyqdC4ydrM', demo: YT('incline+dumbbell+press+form+tutorial'), caution: 'Shoulder bursitis — 30–45° incline maximum. Stop if you feel any shoulder impingement.' },
  p_chest_dip:          { name: 'Chest Dip',                  muscle: 'Push',      unit: 'bw',   defaultSets: 3, defaultReps: 8,  repMax: 12, cue: 'Lean slightly forward. Elbows flare to target chest.',          demoId: 'AlQ13funQ6Q', demo: YT('chest+dip+form+tutorial'), caution: 'Shoulder bursitis — stop immediately if you feel any shoulder impingement.' },
  p_cable_fly:          { name: 'Cable Fly',                  muscle: 'Push',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Arms arc in a hugging motion. Squeeze at the midpoint.',        demoId: 'i3Wlwcwcfqg', demo: YT('cable+fly+chest+form+tutorial'), gymOnly: true },
  // ── Pull: Back ────────────────────────────────────────────────────
  p_pull_up:            { name: 'Pull-Up',                    muscle: 'Pull',      unit: 'bw',   defaultSets: 3, defaultReps: 4,  repMax: 8,  cue: 'Shoulder-width or narrower grip only — no wide grip (aggravates shoulder bursitis). Overhand. Start band-assisted or negatives only. Full hang, chin over bar.', pullupTracking: true, demoId: 'OEXosPwzFdc', demo: YT('pull+up+form+narrow+grip+band+assisted+beginners'), caution: 'Shoulder bursitis — narrow grip only. No wide grip. Stop if you feel shoulder impingement.' },
  p_lat_pulldown:       { name: 'Lat Pulldown',               muscle: 'Pull',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Pull bar to upper chest. Lean back slightly, lead with elbows.', demoId: 'oMJmAHRZXBk', demo: YT('lat+pulldown+proper+form+tutorial'), gymOnly: true },
  p_seated_cable_row:   { name: 'Seated Cable Row',           muscle: 'Pull',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Sit tall. Pull to lower chest. Squeeze shoulder blades together.', demoId: 'jqYQOQqLNgQ', demo: YT('seated+cable+row+form+tutorial'), gymOnly: true },
  p_t_bar_row:          { name: 'T-Bar Row',                  muscle: 'Pull',      unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Neutral spine, hinge at hips. Pull to lower chest.',            demoId: 'E7Q3eaf-FxM', demo: YT('t+bar+row+form+tutorial'), gymOnly: true },
  p_straight_arm_pd:    { name: 'Straight-Arm Pulldown',      muscle: 'Pull',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Arms straight. Hinge at shoulder only. Excellent lat isolation.', demoId: 'eKJUJ2eFPUY', demo: YT('straight+arm+pulldown+form+tutorial') },
  // ── Legs ──────────────────────────────────────────────────────────
  p_leg_press:          { name: 'Leg Press',                  muscle: 'Legs',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Feet hip-width. Do not lock knees at top. Full range.',         demoId: 'nDh_BlnLCGc', demo: YT('leg+press+proper+form+tutorial'), gymOnly: true },
  p_leg_extension:      { name: 'Leg Extension',              muscle: 'Legs',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Extend fully, hold 1 sec, lower controlled. Isolates quads.',    demoId: 'Tae3aeJe5Ks', demo: YT('leg+extension+machine+form+tutorial'), gymOnly: true },
  p_seated_leg_curl:    { name: 'Seated Leg Curl',            muscle: 'Legs',      unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 12, cue: 'Curl to full flexion. Control the return. Hamstring isolation.', demoId: 'mDSpvNsBx1Y', demo: YT('seated+leg+curl+machine+form+tutorial'), gymOnly: true },
  p_sumo_squat:         { name: 'Sumo Squat',                 muscle: 'Legs',      unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Wide stance, toes out. Knees track over toes. Targets inner thigh.', demoId: 'BGxj6Wd5vqc', demo: YT('sumo+squat+form+tutorial') },
  p_wall_sit:           { name: 'Wall Sit',                   muscle: 'Legs',      unit: 'bw',   defaultSets: 3, defaultReps: null, defaultDuration: 30, repMax: null, cue: 'Back flat on wall, thighs parallel to floor. Hold.',   demoId: 'JjWs0cwqxEk', demo: YT('wall+sit+exercise+tutorial'), isTimed: true },
  // ── Glutes ────────────────────────────────────────────────────────
  p_cable_kickback:     { name: 'Cable Kickback',             muscle: 'Glutes',    unit: 'kg',   defaultSets: 3, defaultReps: 15, repMax: 15, cue: 'Slight hinge, kick back and up. Squeeze glute at top.',         demoId: 'A9aN_L4vexk', demo: YT('cable+kickback+glute+form+tutorial'), perSide: true },
  p_hip_abduction:      { name: 'Hip Abduction',              muscle: 'Glutes',    unit: 'kg',   defaultSets: 3, defaultReps: 15, repMax: 20, cue: 'Push knees outward against resistance. Targets glute med.',      demoId: 'HngwgIoABFg', demo: YT('hip+abduction+machine+band+form+tutorial') },
  p_donkey_kick:        { name: 'Donkey Kicks',               muscle: 'Glutes',    unit: 'bw',   defaultSets: 3, defaultReps: 15, repMax: 20, cue: 'On all fours. Kick heel toward ceiling, squeeze glute at top.',  demoId: 'JsDRMr1T7Is', demo: YT('donkey+kicks+exercise+form+tutorial'), perSide: true },
  p_clamshell:          { name: 'Clamshell',                  muscle: 'Glutes',    unit: 'band', defaultSets: 3, defaultReps: 15, repMax: 20, cue: 'Side-lying. Rotate top knee up like a clamshell. Band optional.', demoId: 'Cn09FlW5Zfs', demo: YT('clamshell+exercise+form+tutorial'), perSide: true },
  // ── Core ──────────────────────────────────────────────────────────
  p_plank:              { name: 'Plank',                      muscle: 'Core',      unit: 'bw',   defaultSets: 3, defaultReps: null, defaultDuration: 30, repMax: null, cue: 'Forearms or hands. Straight line head to heels. Brace hard.', demoId: 'htqqk_uojIs', demo: YT('plank+proper+form+tutorial'), isTimed: true },
  p_side_plank:         { name: 'Side Plank',                 muscle: 'Core',      unit: 'bw',   defaultSets: 2, defaultReps: null, defaultDuration: 25, repMax: null, cue: 'Hip off floor, straight line. Stack feet or stagger.',      demoId: 'HyAct6eyrvg', demo: YT('side+plank+form+tutorial'), isTimed: true, perSide: true },
  p_dead_bug:           { name: 'Dead Bug',                   muscle: 'Core',      unit: 'bw',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Lower back pressed to floor. Opposite arm and leg extend slowly.', demoId: 'Bgn0OXKEX2o', demo: YT('dead+bug+exercise+form+tutorial') },
  p_bird_dog:           { name: 'Bird Dog',                   muscle: 'Core',      unit: 'bw',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'On all fours. Extend opposite arm and leg. Keep hips level.',    demoId: 'MCkb_SwmSh0', demo: YT('bird+dog+exercise+form+tutorial'), perSide: true },
  p_ab_wheel:           { name: 'Ab Wheel Rollout',           muscle: 'Core',      unit: 'bw',   defaultSets: 3, defaultReps: 6,  repMax: 10, cue: 'From knees. Roll out slowly, pull back in. Do not let hips sag.', demoId: 'ZCw7rx-D3e0', demo: YT('ab+wheel+rollout+form+tutorial+beginners') },
  p_hanging_knee_raise: { name: 'Hanging Knee Raise',         muscle: 'Core',      unit: 'bw',   defaultSets: 3, defaultReps: 10, repMax: 15, cue: 'Hang from bar. Bring knees to chest, lower slowly.',            demoId: 'jTak29W-uoY', demo: YT('hanging+knee+raise+form+tutorial') },
  p_cable_crunch:       { name: 'Cable Crunch',               muscle: 'Core',      unit: 'kg',   defaultSets: 3, defaultReps: 15, repMax: 20, cue: 'Kneel, pull rope to floor. Round spine. Abs do the work.',       demoId: 'bd63yN6g_9w', demo: YT('cable+crunch+abs+form+tutorial') },
  // ── Shoulder health ───────────────────────────────────────────────────
  p_band_ext_rot:       { name: 'Band External Rotation',     muscle: 'Shoulders', unit: 'band', defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Elbow tucked at 90° at your side. Rotate forearm outward against band resistance. Slow and controlled both ways. Critical for rotator cuff health — do not skip.', demoId: 'gMO7fgjQ-u4', demo: YT('band+external+rotation+rotator+cuff+exercise+form'), perSide: true },
  // ── Priority 1 additions ─────────────────────────────────────────────
  // Push: Chest
  p_bb_decline_bench:   { name: 'Barbell Decline Bench Press', muscle: 'Push',    unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Grip just outside shoulder-width. Lower bar to lower chest under control. Drive up. Decline angle targets the lower chest.', demoId: 'tdLxgjkch6U', demo: YT('barbell+decline+bench+press+form+tutorial') },
  p_incline_db_fly:     { name: 'Incline DB Fly',              muscle: 'Push',    unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 12, cue: '30–45° incline. Slight bend in elbows throughout. Wide arc down then back up — the stretch at the bottom is the key benefit.', demoId: 'SYwuUr8FpOo', demo: YT('incline+dumbbell+fly+form+tutorial'), caution: 'Shoulder bursitis — light weight only. Limit range, stop before arms go fully wide. Stop immediately if shoulder impingement.' },
  // Triceps
  p_db_tricep_kickback: { name: 'DB Tricep Kickback',          muscle: 'Arms',    unit: 'kg',   defaultSets: 3, defaultReps: 12, repMax: 15, cue: 'Hinge forward, upper arm parallel to floor. Extend forearm back fully. Squeeze tricep at top. Control the return.', demoId: 'TsNoEJGyUw0', demo: YT('dumbbell+tricep+kickback+form+tutorial'), perSide: true },
  // Biceps
  p_incline_db_curl:    { name: 'Incline DB Curl',             muscle: 'Arms',    unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Sit on incline bench. Arms hang behind the body. Curl up slowly — the stretched starting position is the key benefit. Control down.', demoId: 'S2cYwsDhpI4', demo: YT('incline+dumbbell+curl+form+tutorial') },
  // Pull: Back
  p_bb_row:             { name: 'Barbell Bent-Over Row',       muscle: 'Pull',    unit: 'kg',   defaultSets: 3, defaultReps: 8,  repMax: 10, cue: 'Hinge to ~45°. Bar stays close to legs. Pull to lower chest. Squeeze shoulder blades. Keep back FLAT throughout — no rounding.', demoId: 'Ka-yi9zHp2Q', demo: YT('barbell+bent+over+row+form+tutorial'), caution: 'Slipped disc — keep weight conservative, back must stay flat. Stop immediately if any lower back pain.' },
  // Hinge
  p_deadlift:           { name: 'Conventional Deadlift',       muscle: 'Hinge',   unit: 'kg',   defaultSets: 3, defaultReps: 5,  repMax: 5,  cue: 'Bar over mid-foot. Hinge, grip just outside legs. Chest up, back flat, brace. Drive the floor away. Lock out hips at top.', demoId: 'aNqAqG_08EU', demo: YT('conventional+deadlift+form+tutorial+beginners'), caution: 'Slipped disc — start conservative (60% max). Back must stay neutral throughout. Skip entirely during any disc flare-up.' },
  // Legs
  p_db_squat:           { name: 'DB Squat',                    muscle: 'Legs',    unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Hold dumbbells at your sides. Feet shoulder-width. Squat to parallel. Knees track over toes. Drive through heels to stand.', demoId: 'ZXwvmRSRRxY', demo: YT('dumbbell+squat+at+sides+form+tutorial') },
  p_walking_lunge:      { name: 'Walking Lunge',               muscle: 'Legs',    unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Long stride forward. Front knee tracks over toes. Stay upright — no forward lean. Alternate legs. Rep count is total steps.', demoId: '2MbSPOB24XQ', demo: YT('walking+lunge+form+tutorial'), caution: 'Light weight or bodyweight only. Stop if knee pain.' },
  // Glutes
  p_bb_hip_thrust:      { name: 'Barbell Hip Thrust',          muscle: 'Glutes',  unit: 'kg',   defaultSets: 3, defaultReps: 10, repMax: 12, cue: 'Shoulders on bench, bar across hips with pad. Drive hips up to full extension. Squeeze glutes hard at top. Control the descent.', demoId: 'ZOEJ33c6S64', demo: YT('barbell+hip+thrust+form+tutorial') },
};

// ─── IRON SERIES EXERCISES ─────────────────────────────────────────────────
export const IRON_EXERCISES = {
  iron_heel_elev_squat: { name: 'Heel-Elevated Squat', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Heels raised on yoga block or weight plate. Sit deep into squat, knees track over toes. Upright torso throughout. Drive through quads on the way up.', demoId: 'UvxTioyshwQ', demo: YT('heel+elevated+squat+dumbbell+tutorial+form') },
  iron_bulgarian_split: { name: 'Bulgarian Split Squat', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Rear foot elevated on chair behind you. Lower rear knee toward floor, torso upright. Front foot flat, drive through heel. Keep most weight through the front leg.', caution: 'Slipped disc — stop if lower back rounds or you feel any lumbar discomfort.', demoId: 'o7yFuIR9XVU', demo: YT('bulgarian+split+squat+dumbbell+tutorial+form') },
  iron_kas_bridge: { name: 'Kas Glute Bridge', muscle: 'Glutes', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Like a glute bridge but with very small ROM — do not lock out at the top. Keep constant glute tension throughout. Slow, deliberate pace. Weight across hips.', demoId: 'SN3Yy07jWPA', demo: YT('kas+glute+bridge+tutorial+constant+tension') },
  iron_sl_rdl: { name: 'Single-Leg RDL', muscle: 'Hamstrings', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Hinge on one leg, rear leg floats back as counterweight. Neutral spine — no rounding. Light load, focus on the hip hinge and balance. Stop well before hamstring pull.', caution: 'Slipped disc — neutral spine only. Stop if lower back tightens.', demoId: 'MeV_WFmvBCU', demo: YT('single+leg+romanian+deadlift+dumbbell+form+tutorial') },
  iron_bw_kickback: { name: 'Bodyweight Glute Kickback', muscle: 'Glutes', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'On hands and knees. Drive heel toward ceiling, squeezing glute at top. Keep hips square — do not twist. Controlled return. Can add band around thighs.', demoId: 'KEaLf6QraWU', demo: YT('bodyweight+glute+kickback+quadruped+tutorial') },
  iron_cyclist_squat: { name: 'Cyclist Squat', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Very narrow stance, heels elevated on block. Extreme quad isolation. Go deep — the elevated heels allow the knees to travel well forward. Dumbbells held at sides or in goblet position.', demoId: 'QnsIwZZT0Q8', demo: YT('cyclist+squat+dumbbell+heel+elevated+quad+tutorial') },
  iron_fwd_lunge: { name: 'Forward Alternating Lunge', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Step forward, lower rear knee toward floor. Drive through front heel to return. Alternate legs. More quad-dominant than reverse lunge. Keep torso upright throughout.', demoId: 'CpvfDjEulYQ', demo: YT('forward+alternating+lunge+dumbbell+form+tutorial') },
  iron_1_5_goblet: { name: '1.5 Rep Goblet Squat', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Full squat down, rise halfway, lower back down fully, then stand completely = 1 rep. Constant time under tension. Slower tempo than standard goblet squat.', demoId: '3Q8i79Kd_EM', demo: YT('1.5+rep+goblet+squat+time+under+tension+tutorial') },
  iron_squat_pulse: { name: 'Bodyweight Squat Pulse', muscle: 'Quads', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Stay at the bottom of a squat and pulse up and down through a very small range. Maintain tension throughout — do not stand up. Burn-out finisher for quads.', demoId: 'Mdc-nP0APzo', demo: YT('squat+pulse+bodyweight+legs+burnout+tutorial') },
  iron_b_stance_rdl: { name: 'B-Stance RDL', muscle: 'Hamstrings', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Staggered stance — front foot takes most of the load. Rear foot touches floor for balance only. Hinge at hip, neutral spine. Most of the work goes through the front leg.', caution: 'Slipped disc — neutral spine only. Stop if lower back tightens.', demoId: 'd8mnjJ00DjI', demo: YT('b+stance+rdl+dumbbell+single+leg+hinge+tutorial') },
  iron_sumo_dl: { name: 'Sumo Deadlift', muscle: 'Glutes', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Wide stance, toes pointed out 30-45°. Grip DBs between legs. Push knees out in line with toes as you drive up. Neutral spine throughout. Full hip extension at the top.', caution: 'Slipped disc — neutral spine only. Stop immediately if lower back pain.', demoId: 'De9OUZz5W_I', demo: YT('dumbbell+sumo+deadlift+form+tutorial+glutes') },
  iron_banded_abduct: { name: 'Banded Glute Abduction', muscle: 'Glutes', unit: 'band', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Resistance band around thighs just above knees. Seated or lying with knees bent. Push knees apart against band resistance, controlling return. Targets glute medius.', demoId: 'DU6W5rVb7zA', demo: YT('banded+glute+abduction+seated+lying+tutorial') },
  iron_db_row: { name: 'Bent-Over DB Row', muscle: 'Lats', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hinge forward at hips, flat back. Both DBs hang below chest. Pull elbows back and up, squeezing shoulder blades. Control the descent. Core braced throughout.', demoId: 'PFTMBwL3GV0', demo: YT('bent+over+dumbbell+row+both+arms+form+tutorial') },
  iron_pronated_row: { name: 'Pronated (Palms Down) Row', muscle: 'Lats', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Overhand grip (palms facing you as you hinge). Pull elbows back. Overhand grip increases upper back and rear delt engagement compared to underhand. Flat back throughout.', demoId: 'vgE1djLy9vw', demo: YT('pronated+overhand+dumbbell+row+back+tutorial') },
  iron_supinated_row: { name: 'Supinated (Palms Up) Row', muscle: 'Lats', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Underhand grip (palms facing ceiling as you hinge). Pull elbows back close to body. Underhand grip increases bicep involvement compared to overhand. Flat back throughout.', demoId: 'YsCSDAwAhag', demo: YT('supinated+underhand+dumbbell+row+bicep+back+tutorial') },
  iron_pullover: { name: 'DB Pullover', muscle: 'Lats', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Lie on bench, hold one DB with both hands above chest. Arc slowly behind head, keeping slight bend in elbows. Return to start. Light weight — this is a stretch movement.', caution: 'Shoulder bursitis — use light weight only. Stop if you feel impingement at the stretched (overhead) position.', demoId: 'jCV5t9Cy4hI', demo: YT('dumbbell+pullover+lat+stretch+tutorial+form') },
  iron_zottman: { name: 'Zottman Curl', muscle: 'Biceps', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Curl up with supinated (palms up) grip, rotate to pronated (palms down) at top, lower slowly with pronated grip. Trains biceps on the way up and forearms on the way down.', demoId: 'CUyil5rSf4E', demo: YT('zottman+curl+dumbbell+tutorial+bicep+forearm') },
  iron_suitcase_squat: { name: 'Suitcase Squat', muscle: 'Quads', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Feet shoulder-width, DBs held at sides (not goblet position). Squat down keeping torso upright. Resist the urge to lean — maintain a vertical torso throughout.', demoId: 'rQhACv66Xe0', demo: YT('suitcase+squat+dumbbell+sides+tutorial') },
  iron_curtsy_lunge: { name: 'Curtsy Lunge', muscle: 'Glutes', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Step one foot behind and across the other (curtsy position). Lower rear knee toward floor. Front knee tracks over toes. Works glutes and abductors. Return to start.', demoId: 'giX5abwg1lw', demo: YT('curtsy+lunge+dumbbell+glute+abductor+tutorial') },
  iron_seated_calf: { name: 'Seated Calf Raise', muscle: 'Calves', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Seated, weight plates or DBs resting on knees. Rise onto balls of feet, hold 1 second at top. Lower fully to feel the stretch at the bottom. Slow, controlled tempo.', demoId: 'fFWpWJy8ybU', demo: YT('seated+calf+raise+dumbbell+knees+tutorial+form') },
  iron_incline_press: { name: 'Incline DB Chest Press', muscle: 'Chest', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Low incline only (20-30°). Elbows at 45° from body — not flared. Lower to chest, press up. Higher inclines approach overhead pressing angle — stay low.', caution: 'Shoulder bursitis — low incline only (20-30°). Stop if you feel any shoulder impingement.', demoId: 'ljyqdC4ydrM', demo: YT('incline+dumbbell+chest+press+low+incline+form+tutorial') },
  iron_bench_dip: { name: 'Chair / Bench Dip', muscle: 'Triceps', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hands on chair edge behind, fingers pointing forward. Lower by bending elbows. Keep elbows pointing straight back — do not flare. Stop range if shoulders feel uncomfortable.', demoId: '4ua3MzaU0QU', demo: YT('bench+dip+tricep+chair+tutorial+form') },
  iron_hip_hinge_hold: { name: 'Hip Hinge Hold', muscle: 'Hamstrings', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hinge at hips with DBs held at thighs. Hold the hinge position isometrically — back flat, slight knee bend, hamstrings loaded. Replaces Good Mornings; eliminates loaded spinal flexion risk.', demoId: 'hi6T9-znK84', demo: YT('hip+hinge+hold+isometric+hamstring+tutorial') },
  iron_bw_hyper_ext: { name: 'Bodyweight Back Extension', muscle: 'Glutes', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Lie prone on mat. Lift chest and legs together (superman position), or just chest if lower back complains. No added load — bodyweight only. Stop if lower back is uncomfortable.', demoId: 'cIYeKqLqVVs', demo: YT('bodyweight+back+extension+prone+superman+tutorial') },
  iron_lying_ham_curl: { name: 'Lying DB Hamstring Curl', muscle: 'Hamstrings', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Lie face down, feet together squeezing a single DB between them. Curl DB toward glutes, hold briefly, lower with control. Light weight — squeeze the hamstrings, no momentum.', demoId: 'q1G8PRYBdU8', demo: YT('lying+dumbbell+hamstring+curl+feet+squeeze+tutorial') },
  iron_lateral_hold: { name: 'Lateral Raise Hold', muscle: 'Side Delts', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hold DBs at shoulder height (arms extended to sides at 90°) for the set duration. Isometric lateral deltoid work. Arms stay at shoulder height — not overhead. Replaces Isometric Overhead Holds.', demoId: '3OwPNv33Gfo', demo: YT('lateral+raise+isometric+hold+shoulder+height+tutorial') },
  iron_rear_delt_row: { name: 'Rear Delt Row', muscle: 'Rear Delts', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hinge forward, elbows flare wide as you pull. Target is to get elbows level with shoulders. Lead with elbows, not hands. Targets posterior deltoid rather than lats.', demoId: 'uQ1iNizDQM8', demo: YT('rear+delt+row+dumbbell+hinge+elbow+flare+tutorial') },
  iron_front_raise: { name: 'Front DB Raise', muscle: 'Front Delts', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Straight arms, raise DBs to shoulder height in front. Control the descent — no momentum. Light weight only. Can alternate arms to manage fatigue.', demoId: 'vtJfIcyrWO8', demo: YT('front+dumbbell+raise+shoulder+tutorial+form') },
  iron_crossover_stepup: { name: 'Cross-over Step-up', muscle: 'Glutes', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Step across midline onto bench with one foot. Drive through that hip to step up. The cross pattern emphasises the glute over the quad. Step down slowly and controlled.', demoId: 'j9d7Z7aDqS4', demo: YT('crossover+step+up+glute+emphasis+dumbbell+tutorial') },
  iron_squat_hold: { name: 'Squat Isometric Hold', muscle: 'Quads', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Lower to squat position and hold. Thighs parallel to floor or as low as comfortable. Chest up, weight through heels. Static hold — no pulsing, no movement.', demoId: 'sUR7EGNDOoc', demo: YT('squat+isometric+hold+wall+sit+quad+tutorial') },
  iron_frog_pump: { name: 'Frog Pump', muscle: 'Glutes', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Lie on back, soles of feet pressed together, knees falling out (frog position). Press hips up using glutes. Small range, constant tension. Bodyweight only — no additional load.', demoId: '5b4TonBLVgM', demo: YT('frog+pump+glute+bodyweight+tutorial+form') },
  iron_diamond_pushup: { name: 'Diamond Push-up', muscle: 'Triceps', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hands form a diamond shape (index fingers and thumbs touching) on the floor. Lower chest to hands, press back up. Tricep-dominant push-up variation. Modify on knees if needed.', demoId: 'PPTj-MW2tcs', demo: YT('diamond+push+up+tricep+form+tutorial') },
  iron_plank_tap: { name: 'High Plank Hand Tap', muscle: 'Abs', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'High plank position. Tap opposite hand to opposite shoulder alternately while keeping hips still. Resist rotation — brace core hard. Slow and controlled.', demoId: '_d9150y7IGs', demo: YT('high+plank+shoulder+tap+anti+rotation+core+tutorial') },
  iron_b_stance_hip_thrust: { name: 'B-Stance Hip Thrust', muscle: 'Glutes', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Most load on the front leg. Rear foot just touches floor for balance only. Drive through front heel. One glute does most of the work. Back supported on bench edge.', demoId: 'OjNdmHWVSek', demo: YT('b+stance+hip+thrust+single+leg+glute+dumbbell+tutorial') },
  iron_tricep_kickback: { name: 'Tricep Kickback', muscle: 'Triceps', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hinge forward, upper arm parallel to floor and pinned to torso. Extend forearm back until arm is straight, squeezing tricep at top. Control return. No swinging.', demoId: 'TsNoEJGyUw0', demo: YT('tricep+kickback+dumbbell+form+tutorial+isolation') },
  iron_shrug: { name: 'DB Shrug', muscle: 'Upper Traps', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Dumbbells at sides. Shrug shoulders straight up toward ears, hold 1 second at top, lower with control. No neck rolling — straight up and down only.', demoId: 'RLHxN6hq8NA', demo: YT('dumbbell+shrug+upper+trap+form+tutorial') },
  iron_overhead_tricep: { name: 'Overhead Tricep Extension', muscle: 'Triceps', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hold one or two DBs overhead with both hands. Lower weight behind head by bending elbows, keeping upper arms vertical and close together. Extend back up fully.', demoId: 'AYqg9S5FrUU', demo: YT('overhead+tricep+extension+dumbbell+form+tutorial') },
  iron_pushup: { name: 'Standard Push-up', muscle: 'Chest', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Hands slightly wider than shoulder-width. Elbows at 45° from body — not flared. Lower chest to floor, press back up. Body in a straight line throughout. Modify on knees if needed.', demoId: 'WDIpL0pjun0', demo: YT('standard+push+up+form+tutorial+chest+triceps') },
  iron_lean_lateral: { name: 'Lean-Away Lateral Raise', muscle: 'Side Delts', unit: 'kg', defaultSets: 4, defaultDuration: 60, defaultReps: 12, perSide: true, cue: 'Hold a fixed support with one hand, lean away to create a long lever. Raise the free arm out to the side. The lean increases range of motion and stretch at the bottom.', demoId: 'H6jPMUzT5cw', demo: YT('lean+away+lateral+raise+cable+dumbbell+tutorial') },
  iron_glute_bridge: { name: 'Glute Bridge Hold', muscle: 'Glutes', unit: 'bw', defaultSets: 4, defaultDuration: 60, defaultReps: 12, cue: 'Floor-based bridge. Drive hips up to full extension and hold, or perform small pulsing movements. No bench needed. Used as the hold/isometric partner in superset pairs.', demoId: 'SOOPAeifETI', demo: YT('glute+bridge+hold+isometric+floor+tutorial') },
};

export const MUSCLE_META = {
  // ── Workout C — Legs / Core ─────────────────────────────────────────
  goblet_squat:    ['Quads',           'Glutes'],
  hip_thrust:      ['Glutes',          'Hamstrings'],
  rdl:             ['Hamstrings',      'Glutes'],
  reverse_lunge:   ['Quads',           'Glutes'],
  sb_ham_curl:     ['Hamstrings',      'Glutes'],
  pallof_press:    ['Obliques',        null],
  farmers_walk:    ['Forearms',        'Upper Traps'],  // ExRx: grip/forearms is the limiting target; core is a stabiliser
  // ── Workout A — Push ────────────────────────────────────────────────
  bb_flat_bench:   ['Chest',           'Triceps'],
  db_bench:        ['Chest',           'Triceps'],
  db_floor_press:  ['Chest',           'Triceps'],
  bb_incline_bench:['Chest',           'Front Delts'],
  // ── Workout B — Pull / Hinge ────────────────────────────────────────
  kb_deadlift:     ['Glutes',          'Hamstrings'],
  chin_up:         ['Lats',            'Biceps'],
  cs_db_row:       ['Lats',            'Biceps'],
  face_pull:       ['Rear Delts',      'Mid Traps'],
  reverse_fly:     ['Rear Delts',      'Mid Traps'],
  db_row_1arm:     ['Lats',            'Biceps'],
  band_row:        ['Lats',            'Biceps'],
  // ── Accessory / Warmup exercises ────────────────────────────────────
  step_ups:        ['Quads',           'Glutes'],
  incline_pushups: ['Chest',           'Triceps'],
  suitcase_carry:  ['Obliques',        'Forearms'],
  split_squat:     ['Quads',           'Glutes'],
  calf_raises:     ['Calves',          null],
  single_leg_bal:  [null,              null],       // balance drill — no primary muscle highlight
  // ── Preset library — Arms ───────────────────────────────────────────
  p_db_bicep_curl:      ['Biceps',      'Forearms'],
  p_barbell_curl:       ['Biceps',      'Forearms'],
  p_hammer_curl:        ['Forearms',    'Biceps'],   // ExRx: brachioradialis (forearms) is the target; biceps is synergist
  p_concentration_curl: ['Biceps',      null],
  p_preacher_curl:      ['Biceps',      'Forearms'], // ExRx: brachioradialis listed as synergist
  // ── Preset library — Triceps ────────────────────────────────────────
  p_tricep_pushdown:    ['Triceps',     null],
  p_overhead_ext:       ['Triceps',     null],
  p_skull_crushers:     ['Triceps',     null],
  p_tricep_dips:        ['Triceps',     'Chest'],
  p_close_grip_bench:   ['Triceps',     'Chest'],
  // ── Preset library — Shoulders ──────────────────────────────────────
  p_lateral_raise:      ['Side Delts',  null],
  p_front_raise:        ['Front Delts', null],
  p_db_shoulder_press:  ['Front Delts', 'Triceps'],  // ExRx: anterior deltoid is primary in overhead pressing
  p_arnold_press:       ['Front Delts', 'Side Delts'],  // ExRx: anterior deltoid is primary in Arnold press
  p_rear_delt_fly:      ['Rear Delts',  'Mid Traps'],
  p_shrugs:             ['Upper Traps', null],
  p_band_ext_rot:       ['Rear Delts',  null],
  // ── Preset library — Chest ──────────────────────────────────────────
  p_push_up:            ['Chest',       'Triceps'],
  p_db_fly:             ['Chest',       'Front Delts'],
  p_incline_db_press:   ['Chest',       'Front Delts'],
  p_chest_dip:          ['Chest',       'Triceps'],
  p_cable_fly:          ['Chest',       'Front Delts'],
  // ── Preset library — Back ───────────────────────────────────────────
  p_pull_up:            ['Lats',        'Biceps'],
  p_lat_pulldown:       ['Lats',        'Biceps'],
  p_seated_cable_row:   ['Lats',        'Biceps'],
  p_t_bar_row:          ['Lats',        'Mid Traps'],
  p_straight_arm_pd:    ['Lats',        null],
  // ── Preset library — Legs ───────────────────────────────────────────
  p_leg_press:          ['Quads',       'Glutes'],
  p_leg_extension:      ['Quads',       null],
  p_seated_leg_curl:    ['Hamstrings',  null],
  p_sumo_squat:         ['Quads',       'Glutes'],
  p_wall_sit:           ['Quads',       null],
  p_cable_kickback:     ['Glutes',      null],
  p_hip_abduction:      ['Glutes',      null],
  p_donkey_kick:        ['Glutes',      null],
  p_clamshell:          ['Glutes',      null],
  // ── Preset library — Core ───────────────────────────────────────────
  p_plank:              ['Abs',         'Obliques'],
  p_side_plank:         ['Obliques',    'Abs'],
  p_dead_bug:           ['Abs',         null],
  p_bird_dog:           ['Spinal Erectors', 'Glutes'],  // ExRx: erector spinae is the target; abs are stabilisers
  p_ab_wheel:           ['Abs',         null],
  p_hanging_knee_raise: ['Abs',         null],       // NOTE: ExRx targets Iliopsoas (hip flexors) — no hip flexors in muscle map; Abs used as closest available
  p_cable_crunch:       ['Abs',         null],
  // ── Priority 1 additions ────────────────────────────────────────────
  p_bb_decline_bench:   ['Chest',       'Triceps'],
  p_incline_db_fly:     ['Chest',       'Front Delts'],
  p_db_tricep_kickback: ['Triceps',     null],
  p_incline_db_curl:    ['Biceps',      'Forearms'],
  p_bb_row:             ['Lats',        'Mid Traps'],
  p_deadlift:           ['Glutes',      'Hamstrings'],  // ExRx: glutes & hamstrings are primary movers in conventional deadlift
  p_db_squat:           ['Quads',       'Glutes'],
  p_walking_lunge:      ['Quads',       'Glutes'],
  p_bb_hip_thrust:      ['Glutes',      'Hamstrings'],

  // ── Iron Series exercises ────────────────────────────────────────────────
  iron_heel_elev_squat:    ['Quads',           'Glutes'],
  iron_bulgarian_split:    ['Quads',           'Glutes'],
  iron_kas_bridge:         ['Glutes',          null],
  iron_sl_rdl:             ['Hamstrings',      'Glutes'],
  iron_bw_kickback:        ['Glutes',          null],
  iron_cyclist_squat:      ['Quads',           null],
  iron_fwd_lunge:          ['Quads',           'Glutes'],
  iron_1_5_goblet:         ['Quads',           'Glutes'],
  iron_squat_pulse:        ['Quads',           null],
  iron_b_stance_rdl:       ['Hamstrings',      'Glutes'],
  iron_sumo_dl:            ['Glutes',          'Quads'],
  iron_banded_abduct:      ['Glutes',          null],
  iron_db_row:             ['Lats',            'Biceps'],
  iron_pronated_row:       ['Lats',            'Mid Traps'],
  iron_supinated_row:      ['Lats',            'Biceps'],
  iron_pullover:           ['Lats',            null],
  iron_zottman:            ['Biceps',          'Forearms'],
  iron_suitcase_squat:     ['Quads',           'Glutes'],
  iron_curtsy_lunge:       ['Glutes',          'Quads'],
  iron_seated_calf:        ['Calves',          null],
  iron_incline_press:      ['Chest',           'Front Delts'],
  iron_bench_dip:          ['Triceps',         'Chest'],
  iron_hip_hinge_hold:     ['Hamstrings',      'Glutes'],
  iron_bw_hyper_ext:       ['Glutes',          'Spinal Erectors'],
  iron_lying_ham_curl:     ['Hamstrings',      null],
  iron_lateral_hold:       ['Side Delts',      null],
  iron_rear_delt_row:      ['Rear Delts',      'Mid Traps'],
  iron_front_raise:        ['Front Delts',     null],
  iron_crossover_stepup:   ['Glutes',          'Quads'],
  iron_squat_hold:         ['Quads',           null],
  iron_frog_pump:          ['Glutes',          null],
  iron_diamond_pushup:     ['Triceps',         'Chest'],
  iron_plank_tap:          ['Abs',             'Obliques'],
  iron_b_stance_hip_thrust:['Glutes',          null],
  iron_tricep_kickback:    ['Triceps',         null],
  iron_shrug:              ['Upper Traps',     null],
  iron_overhead_tricep:    ['Triceps',         null],
  iron_pushup:             ['Chest',           'Triceps'],
  iron_lean_lateral:       ['Side Delts',      null],
  iron_glute_bridge:       ['Glutes',          null],
};

export default { PRESET_LIBRARY, IRON_EXERCISES, MUSCLE_META };


