/** Canonical workout programmes shared by all screens. */

const WORKOUTS = {
  A: {
    title: 'Push — Chest · Shoulders · Triceps',
    exercises: ['bb_flat_bench', 'p_db_fly', 'p_db_shoulder_press', 'p_lateral_raise', 'p_rear_delt_fly', 'p_band_ext_rot', 'p_close_grip_bench', 'p_tricep_pushdown'],
    finisher: [
      { id: 'fin_wall_slides', text: 'Wall slides — 2 × 6 slow (pain-free only)' },
      { id: 'fin_pull_aparts', text: 'Band pull-aparts — 2 × 12' },
    ],
  },
  B: {
    title: 'Pull — Back · Biceps · Hinge',
    exercises: ['kb_deadlift', 'cs_db_row', 'reverse_fly', 'face_pull', 'p_straight_arm_pd', 'p_db_bicep_curl', 'p_hammer_curl'],
    finisher: [
      { id: 'fin_ham_floss', text: 'Hamstring floss (band, lying) — 45 sec each side' },
      { id: 'fin_childs_pose', text: "Child's pose breathing — 60 sec" },
    ],
  },
  C: {
    title: 'Legs + Core',
    exercises: ['goblet_squat', 'p_sumo_squat', 'rdl', 'hip_thrust', 'reverse_lunge', 'sb_ham_curl', 'p_cable_kickback', 'calf_raises', 'p_dead_bug', 'p_plank', 'pallof_press', 'farmers_walk'],
    finisher: [
      { id: 'fin_ext_rotation', text: 'Band external rotation — 2 × 10 each side' },
      { id: 'fin_single_leg', text: 'Single-leg balance — 30 sec each side' },
    ],
  },
};

const IRON_WORKOUTS = [
  { day: 1, title: 'Legs', ytId: 'SCxNnWW2zB8', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Yoga Block'], exercises: ['iron_heel_elev_squat', 'rdl', 'split_squat', 'iron_bulgarian_split', 'p_sumo_squat'] },
  { day: 2, title: 'Upper Body', ytId: 'tczVC2rRO7U', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_shoulder_press', 'iron_db_row', 'db_bench', 'p_lateral_raise', 'iron_pushup'] },
  { day: 3, title: 'Glutes', ytId: '2Qd-LJNJYWA', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['hip_thrust', 'iron_kas_bridge', 'iron_sl_rdl', 'p_sumo_squat', 'iron_bw_kickback'] },
  { day: 4, title: 'Full Body Circuits', ytId: 'xVj2Q2_2EJY', format: '9 moves × 3 rounds / 40s work / 20s rest', defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'], exercises: ['iron_db_row', 'reverse_lunge', 'rdl', 'db_bench', 'p_db_shoulder_press', 'iron_heel_elev_squat', 'p_hammer_curl', 'p_skull_crushers', 'db_row_1arm'] },
  { day: 5, title: 'Arms & Abs', ytId: 'U-OYrmX2-k0', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_bicep_curl', 'iron_overhead_tricep', 'p_hammer_curl', 'iron_diamond_pushup', 'p_plank'] },
  { day: 6, title: 'Quads', ytId: 'UBlcDuodQXM', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'], exercises: ['iron_heel_elev_squat', 'iron_cyclist_squat', 'iron_fwd_lunge', 'iron_1_5_goblet', 'iron_squat_pulse'] },
  { day: 7, title: 'Shoulders & Triceps', ytId: '0i5RILMI1Mk', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'], exercises: ['p_lateral_raise', 'iron_lean_lateral', 'iron_bench_dip', 'p_skull_crushers', 'p_rear_delt_fly'] },
  { day: 8, title: 'Glutes & Hamstrings', ytId: 'CFF4vI0oGPg', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['rdl', 'hip_thrust', 'iron_b_stance_rdl', 'iron_sumo_dl', 'iron_banded_abduct'] },
  { day: 9, title: 'Full Body Cardio', ytId: 'BAtaHTTyfPI', format: 'Continuous interval circuit', defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['iron_db_row', 'goblet_squat', 'reverse_lunge', 'iron_plank_tap'] },
  { day: 10, title: 'Back & Biceps', ytId: 'xPxCcwG56Po', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['iron_pronated_row', 'iron_supinated_row', 'p_hammer_curl', 'iron_pullover', 'iron_zottman'] },
  { day: 11, title: 'Legs + Calves', ytId: 'g4_muCNsPdk', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'], exercises: ['iron_suitcase_squat', 'iron_curtsy_lunge', 'rdl', 'calf_raises', 'iron_seated_calf'] },
  { day: 12, title: 'Chest & Triceps', ytId: 'Hww8Y6GxVbw', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'], exercises: ['db_bench', 'iron_incline_press', 'p_db_fly', 'p_close_grip_bench', 'iron_bench_dip'] },
  { day: 13, title: 'Posterior Chain', ytId: 'ZQfJ36EXX2s', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['rdl', 'db_row_1arm', 'iron_hip_hinge_hold', 'hip_thrust', 'iron_bw_hyper_ext'] },
  { day: 14, title: 'Unilateral Full Body', ytId: 'KAEALlzcMcQ', format: '4 × 60s per side', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'], exercises: ['db_row_1arm', 'iron_sl_rdl', 'step_ups', 'p_db_shoulder_press'] },
  { day: 15, title: 'Shoulders', ytId: 'xbtAVsMdVSY', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_shoulder_press', 'p_lateral_raise', 'iron_front_raise', 'iron_rear_delt_row', 'iron_lateral_hold'] },
  { day: 16, title: 'Hamstrings', ytId: 'knrmFCI4XiI', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['iron_lying_ham_curl', 'rdl', 'iron_hip_hinge_hold'] },
  { day: 17, title: 'Complete Upper Body', ytId: '_UFvhXTN2-U', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['iron_db_row', 'db_bench', 'p_db_shoulder_press', 'p_db_bicep_curl', 'iron_overhead_tricep'] },
  { day: 18, title: 'Glutes Supersets', ytId: 'EN-zuVg4mok', format: 'Supersets — no rest between pairs', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['hip_thrust', 'iron_kas_bridge', 'p_sumo_squat', 'iron_squat_pulse', 'iron_b_stance_hip_thrust', 'iron_glute_bridge'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 19, title: 'Full Body Muscle Building', ytId: 'SjSJU-LOLf8', format: 'Straight sets + supersets mixed', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['goblet_squat', 'db_row_1arm', 'db_bench', 'p_hammer_curl'] },
  { day: 20, title: 'Arms, Abs & Core Supersets', ytId: 'B-XyUrXEaCw', format: 'Supersets — 60s on back-to-back moves', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_bicep_curl', 'p_hammer_curl', 'iron_overhead_tricep', 'iron_tricep_kickback', 'p_dead_bug'], supersets: [[0, 1], [2, 3]] },
  { day: 21, title: 'Legs + Step-ups', ytId: 'ucTDJRJjFQ4', format: '4 × 60s work / 30s rest', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'], exercises: ['step_ups', 'reverse_lunge', 'iron_crossover_stepup', 'goblet_squat'] },
  { day: 22, title: 'Chest & Back Antagonist', ytId: 'dnHSrYHT0Zk', format: 'Antagonist pairs — push immediately to pull', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['db_bench', 'iron_db_row', 'p_db_fly', 'p_rear_delt_fly', 'p_close_grip_bench', 'iron_pronated_row'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 23, title: 'Glutes & Hamstrings Supersets', ytId: 'K-tLY96Jq6o', format: 'Supersets — extended tension blocks', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['rdl', 'iron_hip_hinge_hold', 'hip_thrust', 'iron_glute_bridge', 'p_sumo_squat', 'iron_squat_pulse'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 24, title: 'Full Body Circuits', ytId: 'LubR2sFpT_E', format: 'Continuous circuit rounds', defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['goblet_squat', 'iron_db_row', 'p_lateral_raise', 'reverse_lunge', 'iron_diamond_pushup'] },
  { day: 25, title: 'Shoulders Supersets', ytId: 'ReE9zLhksbc', format: 'Supersets — deltoid continuous fatigue', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_shoulder_press', 'p_lateral_raise', 'iron_front_raise', 'iron_rear_delt_row', 'p_rear_delt_fly', 'iron_shrug'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 26, title: 'Legs Circuits', ytId: 'xefU5YoKMoI', format: 'High density leg circuit', defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'], exercises: ['step_ups', 'split_squat', 'iron_squat_hold', 'rdl'] },
  { day: 27, title: 'Upper Body Antagonist', ytId: 'tfgeRvBRtME', format: 'Antagonist pairs — push vs pull', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['iron_db_row', 'db_bench', 'p_lateral_raise', 'iron_rear_delt_row', 'p_hammer_curl', 'iron_tricep_kickback'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 28, title: 'Iron Glutes', ytId: '9xA0yL0KXkU', format: '4 × constant tension blocks', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'], exercises: ['hip_thrust', 'iron_kas_bridge', 'p_sumo_squat', 'iron_frog_pump'] },
  { day: 29, title: 'Final Full Body', ytId: 'bOJpvux_klI', format: '4 heavy compound sets per movement', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'], exercises: ['iron_heel_elev_squat', 'rdl', 'iron_db_row', 'p_db_shoulder_press', 'suitcase_carry'] },
  { day: 30, title: 'Arms, Abs & Core Finale', ytId: 'P4cMTLqtRII', format: 'High volume sets + finisher track', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'], exercises: ['p_db_bicep_curl', 'iron_overhead_tricep', 'p_hammer_curl', 'p_skull_crushers', 'p_plank'] },
];

module.exports = { WORKOUTS, IRON_WORKOUTS };
