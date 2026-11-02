import React from '../runtime.js';

export const WARMUP = [
  { id: 'wu_stepper',           text: '2 min · Easy stepper or gentle trampoline bounce — get the blood moving' },
  { id: 'wu_cat_cow',           text: '1 min · Cat-cow — 10 slow reps, unloaded, pain-free range · Gentle spinal mobility' },
  { id: 'wu_prone_cobra',       text: '1 min · Prone cobra — lie face down, hands beside chest, lift chest gently · 6 × 5 sec holds · Back extension and disc health' },
  { id: 'wu_hamstring_stretch', text: '30 sec each side · Lying hamstring stretch — on back, loop band or towel around foot, gentle straight-leg pull' },
  { id: 'wu_chest_opener',      text: '1 min · Doorframe chest & shoulder opener — arms at 90° on frame, lean body gently forward · Chest and anterior shoulder' },
  { id: 'wu_pendulum',          text: '30 sec each side · Pendulum swings — lean on bench, arm hangs loose, small gentle circles · Shoulder mobility, important for bursitis' },
  { id: 'wu_pull_aparts',       text: '1 min · Band pull-aparts — 15 reps, light tension · Scapular retraction and upper back activation' },
  { id: 'wu_glute_bridge',      text: '1 min · Glute bridge — 10–12 reps bodyweight · Full hip extension at top' },
];

// ─── STRETCH ROUTINE DATA ───────────────────────────────────────────────────
export const STRETCHES = [
  {
    id: 'str_neck',
    demoId: '54y0JAT46vE',
    imageDir: 'stretches',
    name: 'Neck Side Stretch',
    targets: 'Upper traps · Neck',
    cue: 'Sit or stand tall. Place one hand gently over your head and draw your ear toward your shoulder. Keep your face forward — no rotation. Breathe slowly and hold.',
    bilateral: true,
    suggestedSecs: 30,
  },
  {
    id: 'str_cross_shoulder',
    demoId: 'aIq0fLi8iak',
    imageDir: 'stretches',
    name: 'Cross-Body Shoulder Stretch',
    targets: 'Posterior shoulder · Rotator cuff',
    cue: 'Bring one arm across your chest at shoulder height. Use your other hand to gently pull it closer to your body. Keep your shoulder down, not shrugging. Good for shoulder bursitis recovery.',
    bilateral: true,
    suggestedSecs: 30,
  },
  {
    id: 'str_pec_roller_t',
    demoId: 'OJ4G6gg8Y9I',
    imageDir: 'stretches',
    id2: 'str_pec_roller_w',
    name: 'Pec Stretch on Foam Roller',
    targets: 'Chest · Anterior shoulder',
    cue: 'Lie lengthways along the foam roller so it supports your entire spine. First: T position — arms spread level with shoulders. Then: W position — elbows bent, forearms raised. Let gravity open the chest in each position. Don\'t force your hands to the floor.',
    bilateral: false,
    suggestedSecs: 60,
  },
  {
    id: 'str_upper_back_roller',
    demoId: 'GPblqxpZXbE',
    imageDir: 'stretches',
    name: 'Upper Back Foam Roller',
    targets: 'Thoracic spine · Upper back',
    cue: 'Place the foam roller perpendicular to your spine across your upper back, hips on the floor. Clasp hands behind your head to support your neck. Slowly allow your upper back to extend backwards over the roller. Shift position to find tight spots.',
    bilateral: false,
    suggestedSecs: 60,
  },
  {
    id: 'str_cat_cow_cow',
    demoId: 'MSBOBAIeLqI',
    imageDir: 'stretches',
    id2: 'str_cat_cow_cat',
    name: 'Cat-Cow',
    targets: 'Spine · Lower back · Core',
    cue: 'On hands and knees, wrists under shoulders. Inhale — drop belly, lift head and tailbone (cow). Exhale — round spine toward ceiling, tuck chin and pelvis (cat). Move slowly through 10 full breaths, one breath per rep.',
    bilateral: false,
    suggestedSecs: 60,
  },
  {
    id: 'str_childs_pose',
    demoId: 'yycC1S2l_ic',
    imageDir: 'stretches',
    name: "Child's Pose",
    targets: 'Lower back · Lats · Hips',
    cue: 'Kneel and sit back toward your heels. Reach arms forward along the floor and let your lower back lengthen and relax. For a lat stretch, walk both hands to one side, hold, then the other side.',
    bilateral: false,
    suggestedSecs: 60,
  },
  {
    id: 'str_spinal_rotation',
    demoId: '7GzDGqJ41IQ',
    imageDir: 'stretches',
    name: 'Seated Spinal Rotation',
    targets: 'Thoracic spine · Obliques',
    cue: 'Sit upright with legs crossed or extended. Place hands behind your head or cross arms over your chest. Rotate your torso to one side as far as comfortable, keeping hips facing forward. Hold, then switch sides.',
    bilateral: true,
    suggestedSecs: 30,
  },
  {
    id: 'str_hip_flexor',
    demoId: 'Q4Ko275cluo',
    imageDir: 'stretches',
    name: 'Kneeling Hip Flexor Stretch',
    targets: 'Hip flexors · Quads',
    cue: 'Kneel with one knee on the floor, other foot forward in a lunge. Tuck your pelvis under — bring your hips forward without arching your lower back. Feel the stretch at the front of the rear hip. Hold without leaning forward excessively.',
    bilateral: true,
    suggestedSecs: 45,
  },
  {
    id: 'str_figure_four',
    demoId: '4y4e-bJolHs',
    imageDir: 'stretches',
    name: 'Figure-4 Glute Stretch',
    targets: 'Glutes · Piriformis · Hip',
    cue: 'Lie on your back, knees bent, feet flat. Cross one ankle over the opposite knee to form a figure-4. Pull the uncrossed leg gently toward your chest until you feel the stretch deep in the crossed-leg glute. Hold, then switch sides.',
    bilateral: true,
    suggestedSecs: 45,
  },
  {
    id: 'str_hamstring',
    demoId: 'O4mmCtewAJ8',
    imageDir: 'stretches',
    name: 'Lying Hamstring Stretch',
    targets: 'Hamstrings · Lower back',
    cue: 'Lie on your back, both legs flat. Loop a towel or resistance band around one foot and slowly lift that leg toward the ceiling. Keep the opposite leg flat on the floor. Stop when you feel a gentle stretch down the back of the raised leg. Breathe slowly.',
    bilateral: true,
    suggestedSecs: 45,
  },
  {
    id: 'str_it_band',
    demoId: 'wzDoSQ8-GWY',
    imageDir: 'stretches',
    name: 'IT Band / Lateral Hip Stretch',
    targets: 'IT band · Outer hip · Glutes',
    cue: 'Stand near a wall for balance. Cross one leg behind the other and lean your hips away from the crossed leg — you should feel a stretch along the outside of the front hip and thigh. Keep both feet flat on the floor.',
    bilateral: true,
    suggestedSecs: 30,
  },
  {
    id: 'str_calf_straight',
    demoId: 'iIQx2Cx2NoQ',
    imageDir: 'stretches',
    id2: 'str_calf_bent',
    name: 'Calf Stretch',
    targets: 'Gastrocnemius · Soleus',
    cue: 'Stand in a lunge, hands on a wall. First: back leg straight, heel pressed to the floor — stretches the upper calf (gastroc). Then: slightly bend the back knee — shifts the stretch to the lower calf (soleus). Hold each variation before switching sides.',
    bilateral: true,
    suggestedSecs: 30,
  },
];

// ─── STRETCH LIBRARY (exercises + warm-up + finisher stretches) ────────────
// STRETCHES items are shallow-cloned so applyStretchMeta does not mutate
// the originals used by StretchActive, WarmupActive, and Dashboard.
export const STRETCH_LIBRARY = [
  ...STRETCHES.map(s => ({ ...s })),
  // ── Warm-up mobility stretches ────────────────────────────────────────────
  // wu_cat_cow excluded — duplicate of str_cat_cow_cow above
  { id: 'wu_prone_cobra',       imageDir: 'warmup', bilateral: false, suggestedSecs: 30,
    name: 'Prone Cobra',
    targets: 'Lower back · Spinal extension',
    cue: 'Lie face down, hands beside chest. Gently lift chest off the floor. 6 × 5 sec holds. Back extension and disc health — lift only as high as is comfortable, no pain.' },
  { id: 'wu_hamstring_stretch', imageDir: 'warmup', bilateral: true,  suggestedSecs: 30,
    name: 'Lying Hamstring Stretch',
    targets: 'Hamstrings · Lower back',
    cue: 'Lie on your back. Loop a resistance band or towel around one foot and lift the leg slowly toward the ceiling. Keep the opposite leg flat. Stop at first gentle resistance — no bouncing. 30 sec each side.' },
  { id: 'wu_chest_opener',      imageDir: 'warmup', bilateral: false, suggestedSecs: 60,
    name: 'Doorframe Chest & Shoulder Opener',
    targets: 'Chest · Anterior shoulder',
    cue: 'Stand in a doorframe, arms at 90° on the frame. Lean your body gently forward until you feel a stretch across the chest and front of the shoulders. Keep shoulders down, not shrugging.' },
  { id: 'wu_pendulum',          imageDir: 'warmup', bilateral: true,  suggestedSecs: 30,
    name: 'Pendulum Swings',
    targets: 'Shoulder · Rotator cuff',
    cue: 'Lean on a bench with one hand for support. Let the opposite arm hang loose and make small, gentle circles — gravity does the work. No forced movement. Important for shoulder bursitis recovery. 30 sec each side.' },
  // fin_ham_floss excluded — duplicate of str_hamstring above
  // fin_childs_pose excluded — duplicate of str_childs_pose above

  // ── Additional stretches — full muscle-tendon coverage ─────────────────────
  // Neck
  { id: 'str_neck_rotation', demoId: 'ubQjw0p_WDA',      imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Neck Rotation',
    targets: 'Neck · Upper traps',
    cue: 'Sit or stand tall with shoulders relaxed. Slowly turn your head to look over one shoulder — go only as far as comfortable, no forcing. Hold 5 sec, return to centre, repeat the other side. Stop if any dizziness or pinching.' },
  // Shoulders
  { id: 'str_overhead_triceps', demoId: 'DzlrPqLkPTk',   imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Overhead Triceps Stretch',
    targets: 'Triceps · Shoulder',
    cue: 'Raise one arm overhead and bend the elbow so your hand reaches toward your upper back. Use the opposite hand to gently press the elbow backward. Keep your torso upright — do not arch the lower back. 30 sec each side.' },
  // Chest
  { id: 'str_upward_dog', demoId: 'oICTF88_1vI',         imageDir: 'stretches', bilateral: false, suggestedSecs: 30,
    name: 'Upward Facing Dog',
    targets: 'Chest · Abs · Anterior shoulder',
    cue: 'Lie face down, hands flat beside your lower chest. Press up through your arms, lifting your chest off the floor. Keep legs and feet flat. Open the chest and look forward or slightly upward. Stop if any lower-back discomfort.' },
  { id: 'str_biceps_wall', demoId: 'yJl2ofMYo5U',        imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Biceps Wall Stretch',
    targets: 'Biceps · Chest · Anterior shoulder',
    cue: 'Stand facing a wall. Extend one arm and place your palm flat against the surface with fingers pointing backward. Gently rotate your body away until you feel a stretch along the front of your arm and chest. Keep your shoulder down. 30 sec each side.' },
  // Trunk
  { id: 'str_sideways_bend', demoId: 'Vko-SJok-fk',      imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Standing Side Bend',
    targets: 'Obliques · Lats · Trunk',
    cue: 'Stand tall with feet hip-width apart. Raise one arm overhead and lean slowly to the opposite side — feel the stretch along the side of your trunk and lat. Support with the other hand on your hip. Do not twist. Return upright slowly. 30 sec each side.' },
  // Lower back
  { id: 'str_knee_to_chest', demoId: 'b8zjgr1idXc',      imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Knee to Chest',
    targets: 'Lower back · Glutes',
    cue: 'Lie on your back with knees bent. Draw one knee gently toward your chest, holding behind the thigh (not the knee). Keep the other foot flat on the floor. Feel the stretch in your lower back and glute. 30 sec each side.' },
  { id: 'str_spine_twist', demoId: 'lyhWPzuGUHc',        imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Lying Spine Twist',
    targets: 'Thoracic spine · Obliques',
    caution: 'Slipped disc — rotate from your upper back (thoracic) only. Stop immediately if any lower-back pain or sensation down your legs.',
    cue: 'Lie on your back with knees bent. Let both knees fall slowly to one side — go only as far as comfortable, hips stacked. Focus on rotating from your upper back (thoracic), not your lower back. ⚠️ Stop immediately if any lower-back pain or sensation down your legs. 30 sec each side.' },
  // Hips
  { id: 'str_90_90_hip', demoId: 'FM7-7-a0FLg',          imageDir: 'stretches', bilateral: true,  suggestedSecs: 45,
    name: '90/90 Hip Stretch',
    targets: 'Hip flexors · Glutes · Hip rotators',
    cue: 'Sit on the floor with both legs bent at 90°: front leg across in front, back leg out to the side. Sit tall and lean gently forward over the front shin. Feel the stretch deep in the outer glute and hip. 45 sec each side.' },
  { id: 'str_pigeon', demoId: 'IcCVlpWE-UA',             imageDir: 'stretches', bilateral: true,  suggestedSecs: 45,
    name: 'Pigeon Pose',
    targets: 'Glutes · Hip rotators · Hip flexors',
    caution: 'Skip if you feel any pain in your knee — this is a deep stretch and must never be forced.',
    cue: 'From all-fours, bring one knee forward toward your wrist and let the shin angle across the mat. Extend the back leg straight behind. Sit tall first — if hips are level and comfortable, fold forward gently. Do not force the hip toward the floor. ⚠️ Stop if you feel knee pain. 45 sec each side.' },
  // Legs
  { id: 'str_quad_standing', demoId: 'ZKMYmIqnzrU',      imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Standing Quad Stretch',
    targets: 'Quadriceps · Hip flexors',
    cue: 'Stand near a wall for balance. Bend one knee and hold your ankle behind you — draw the heel toward your glute. Keep knees together and stand tall. Squeeze the glute of the stretching leg for a deeper hip flexor stretch. 30 sec each side.' },
  { id: 'str_forward_fold', demoId: 'imptdV-1wKY',       imageDir: 'stretches', bilateral: false, suggestedSecs: 45,
    name: 'Seated Forward Fold',
    targets: 'Hamstrings · Lower back',
    cue: 'Sit on the floor with both legs extended straight. Hinge from your hips and reach forward along your legs — do not round your lower back. Feel the stretch in your hamstrings. If very tight, sit on a folded towel to tilt the pelvis forward. Hold 45 sec.' },
  // Ankles
  { id: 'str_ankle_circles', demoId: '9tFDZqo-X3o',      imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Ankle Circles',
    targets: 'Ankle · Lower leg',
    cue: 'Sit or lie down. Lift one foot and draw slow, full circles with your toes — 10 clockwise then 10 anti-clockwise. Move through the full comfortable range of the ankle joint. Repeat on the other foot.' },
  { id: 'str_ankle_dorsiflexion', demoId: 'hJtARZbOTDU', imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Wall Ankle Dorsiflexion',
    targets: 'Ankle · Calves',
    cue: 'Stand facing a wall, about 10–15 cm away. Place one foot forward with toes near the wall. Bend your knee and push it toward the wall — heel must stay flat on the floor. If your knee reaches the wall easily, step slightly farther back. 30 sec each side.' },
  // ── Sciatica-specific stretches ───────────────────────────────────────────
  { id: 'str_nerve_floss', demoId: 'A42tSJ_7-CM',        imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Sciatic Nerve Floss',
    targets: 'Sciatic nerve · Neural mobility · Hamstrings',
    cue: 'Sit upright on a chair with feet flat on the floor. Extend one leg out straight while tilting your head back — look up at the ceiling. Then bend the knee back down and drop your chin to your chest at the same time. Keep the movement slow and rhythmic. You should feel a gentle pulling sensation along the back of the leg — not pain. 10–15 reps each side.' },
  { id: 'str_piriformis_seated', demoId: '2E8WWX4cOc4',  imageDir: 'stretches', bilateral: true,  suggestedSecs: 45,
    name: 'Seated Piriformis Stretch',
    targets: 'Piriformis · Glutes · Hip rotators',
    cue: 'Sit tall on a chair with feet flat on the floor. Cross one ankle over the opposite knee — keep your foot flexed to protect the knee. Gently lean forward from the hips (not the waist) until you feel a deep stretch in the outer glute and hip. Keep your back straight. 45 sec each side.' },
  // ── Additional sciatica stretches (from clinical sources) ─────────────────
  { id: 'str_knee_opp_shoulder', demoId: 'ntUXh7qiyr0', imageDir: 'stretches', bilateral: true,  suggestedSecs: 20,
    name: 'Knee to Opposite Shoulder',
    targets: 'Piriformis · Glutes · Sciatic nerve',
    cue: 'Lie on your back with both legs extended. Bend one knee and use both hands to gently pull it diagonally across your body toward the opposite shoulder. Keep your other leg flat and your lower back in contact with the floor. Feel the deep stretch in the outer glute and hip. 20 sec each side, 3 reps.' },
  { id: 'str_double_knee_chest', demoId: 'w-UlWQhoFhw', imageDir: 'stretches', bilateral: false, suggestedSecs: 30,
    name: 'Double Knee to Chest',
    targets: 'Lower back · Glutes · Lumbar decompression',
    cue: 'Lie on your back. Bend both knees and draw them toward your chest together, holding behind your thighs (not your knees). Gently rock side to side if comfortable. Feel the stretch across the lower back. 30 sec.' },
  { id: 'str_nerve_glide_supine', demoId: 'PS65UMDTBvw', imageDir: 'stretches', bilateral: true, suggestedSecs: 30,
    name: 'Supine Sciatic Nerve Glide',
    targets: 'Sciatic nerve · Neural mobility · Hamstrings',
    cue: 'Lie on your back. Bend one knee and hold the back of that thigh with both hands. Gently straighten the knee until you feel a pull in the back of the leg. From there, slowly pump your ankle — toes toward you, then away — without bending the knee. Keep the movement controlled. You should feel a gentle sliding sensation along the back of the leg, not sharp pain. 10 reps × 3 sec, 2 sets each side.' },
  { id: 'str_trunk_rotations', demoId: 'LdLDEz9deYU',   imageDir: 'stretches', bilateral: false, suggestedSecs: 60,
    name: 'Lower Trunk Rotations',
    targets: 'Lower back · Lumbar mobility · Hip rotators',
    caution: 'Slipped disc — use only a pain-free range. Stop immediately if any lower-back pain or sensation down your legs. This is gentle rhythmic mobilisation, not a forced rotation.',
    cue: 'Lie on your back with knees bent and feet flat. Keeping your shoulders on the floor, gently let both knees rock to one side — go only as far as comfortable. Return to centre and rock to the other side. Slow, rhythmic motion — not a stretch, just a gentle roll. 20 reps total (10 each side).' },
  // ── Cross-legged sitting stretches ───────────────────────────────────────
  { id: 'str_butterfly', demoId: 'dF2olILOtjM',         imageDir: 'stretches', bilateral: false, suggestedSecs: 45,
    name: 'Butterfly Stretch',
    targets: 'Inner thigh · Adductors · Hip external rotators',
    cue: 'Sit tall on the floor with the soles of your feet together and your heels drawn in toward your body. Let your knees fall gently toward the floor — do not force them down. To deepen, hinge slightly forward from the hips with a straight back. If very tight, sit on a folded blanket to tilt your pelvis forward. 45 sec.' },
  { id: 'str_deep_squat', demoId: 'LQMi1nASEQk',        imageDir: 'stretches', bilateral: false, suggestedSecs: 45,
    name: 'Deep Squat Hold',
    targets: 'Hips · Adductors · Hip flexors · Ankles',
    caution: 'Slipped disc — keep your spine absolutely neutral. No rounding of the lower back. Use a doorframe or chair for support and stop immediately if any lower-back pain or leg sensation.',
    cue: 'Stand with feet slightly wider than shoulder-width, toes turned out 30–45°. Hold a doorframe or chair for support. Slowly lower into a squat, keeping heels on the floor if possible. Keep your chest up and spine neutral — do not round your lower back. Breathe slowly and let your hips sink deeper with each exhale. If heels rise, place a folded mat under them. 45 sec.' },
  { id: 'str_lateral_lunge', demoId: 'LUW7HkkUvfU',     imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Lateral Lunge Stretch',
    targets: 'Inner thigh · Adductors · Hip flexors',
    cue: 'Stand with feet roughly twice shoulder-width apart, toes pointing forward. Keeping both feet flat on the floor, slowly bend one knee and shift your weight to that side — lower until you feel a deep stretch in the inner thigh of the straight leg. Keep your bent knee tracking over your toes and your chest upright. 30 sec each side.' },
  { id: 'str_pilates_saw', demoId: 'GKOmzE5yXPI',       imageDir: 'stretches', bilateral: true,  suggestedSecs: 30,
    name: 'Pilates Saw',
    targets: 'Hamstrings · Inner thigh · Thoracic rotation · Posture',
    cue: 'Sit on the floor with legs extended wide apart and arms out to the sides at shoulder height. Sit as tall as possible — do not slouch. Inhale to prepare, then exhale as you rotate your torso toward one leg and reach the opposite hand past the outside of that foot (the "saw" motion). Keep both hips grounded. Inhale back to centre. 4–5 reps each side, holding each reach for 2–3 breaths.' },
];

// ─── WARMUP GROUPS — 8 fixed muscle-group slots ────────────────────────────
// options: curated list of STRETCH_LIBRARY IDs suitable for this group.
// defaultId: used when no saved config exists.
export const WARMUP_GROUPS = [
  {
    id: 'neck', label: 'Neck', emoji: '🧠',
    defaultId: { A: 'str_neck_rotation', B: 'str_neck_rotation', C: 'str_neck_rotation' },
    options: ['str_neck_rotation', 'str_neck'],
  },
  {
    id: 'shoulders', label: 'Shoulders', emoji: '💪',
    // A (Push): pendulum loosens the joint before pressing; B (Pull): same — scapular prep; C (Legs): same
    defaultId: { A: 'wu_pendulum', B: 'wu_pendulum', C: 'wu_pendulum' },
    options: ['wu_pendulum', 'str_cross_shoulder', 'str_overhead_triceps'],
  },
  {
    id: 'chest', label: 'Chest', emoji: '🫁',
    // A (Push): chest opener primes pec/anterior delt for pressing; B (Pull): biceps wall stretch
    // targets the biceps/anterior chain loaded during rows & curls; C (Legs): upward dog opens hip
    // flexors and thoracic spine before squatting
    defaultId: { A: 'wu_chest_opener', B: 'str_biceps_wall', C: 'str_upward_dog' },
    options: ['wu_chest_opener', 'str_upward_dog', 'str_biceps_wall'],
  },
  {
    id: 'trunk', label: 'Trunk', emoji: '🔄',
    defaultId: { A: 'str_cat_cow_cow', B: 'str_cat_cow_cow', C: 'str_cat_cow_cow' },
    options: ['str_cat_cow_cow', 'str_sideways_bend', 'str_spinal_rotation', 'str_pilates_saw'],
  },
  {
    id: 'lowerback', label: 'Lower Back', emoji: '🔻',
    // A & B: prone cobra activates thoracic extensors; C (Legs/hinge day): child's pose
    // decompresses the lumbar spine before deadlifts, squats, and hip thrusts
    defaultId: { A: 'wu_prone_cobra', B: 'wu_prone_cobra', C: 'str_childs_pose' },
    options: ['wu_prone_cobra', 'str_knee_to_chest', 'str_double_knee_chest', 'str_childs_pose'],
  },
  {
    id: 'hips', label: 'Hips', emoji: '🦋',
    // A (Push): figure-four keeps hip/sciatica coverage on a session that doesn't load hips;
    // B (Pull): hip-flexor stretch counters the anterior tilt loaded by deadlifts;
    // C (Legs): 90/90 opens both hip internal & external rotation — critical before squats/lunges
    defaultId: { A: 'str_figure_four', B: 'str_hip_flexor', C: 'str_90_90_hip' },
    options: ['str_figure_four', 'str_pigeon', 'str_90_90_hip', 'str_piriformis_seated', 'str_butterfly', 'str_hip_flexor', 'str_knee_opp_shoulder'],
  },
  {
    id: 'legs', label: 'Legs', emoji: '🦵',
    // Hamstring stretch retained across all workouts — core sciatica/hamstring care requirement
    defaultId: { A: 'wu_hamstring_stretch', B: 'wu_hamstring_stretch', C: 'wu_hamstring_stretch' },
    options: ['wu_hamstring_stretch', 'str_hamstring', 'str_quad_standing', 'str_forward_fold', 'str_it_band', 'str_lateral_lunge'],
  },
  {
    id: 'ankles', label: 'Ankles', emoji: '🦶',
    // A & B: circles for general ankle mobility; C (Legs): dorsiflexion prep is critical for
    // squat depth and lunge stability
    defaultId: { A: 'str_ankle_circles', B: 'str_ankle_circles', C: 'str_ankle_dorsiflexion' },
    options: ['str_ankle_circles', 'str_ankle_dorsiflexion', 'str_calf_straight'],
  },
];

// Returns the 8-element stretch-ID array for a given workout ('A', 'B', or 'C').
// Falls back to the per-workout group default if a slot has no saved value.
export function getWarmupConfig(workout) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  const saved = raw[workout] || [];
  return WARMUP_GROUPS.map((group, i) => saved[i] || group.defaultId[workout] || group.defaultId.A);
}

// Saves a single slot choice.
export function saveWarmupChoice(workout, slotIndex, stretchId) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  const saved = raw[workout] ? [...raw[workout]] : WARMUP_GROUPS.map(g => g.defaultId[workout] || g.defaultId.A);
  saved[slotIndex] = stretchId;
  raw[workout] = saved;
  localStorage.setItem('il_warmup_config', JSON.stringify(raw));
}

// Resets one workout's warm-up config to all defaults.
export function resetWarmupConfig(workout) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  delete raw[workout];
  localStorage.setItem('il_warmup_config', JSON.stringify(raw));
}

// ─── STRETCH ROUTINE GROUPS ───────────────────────────────────────────────
// 12 slots matching the current STRETCHES order. Each slot has a curated
// options list from STRETCH_LIBRARY. Single global config — not per-workout.
export const STRETCH_GROUPS = [
  {
    id: 'neck', label: 'Neck', emoji: '🧠',
    defaultId: 'str_neck',
    options: ['str_neck', 'str_neck_rotation'],
  },
  {
    id: 'shoulders', label: 'Shoulders', emoji: '💪',
    defaultId: 'str_cross_shoulder',
    options: ['str_cross_shoulder', 'str_overhead_triceps', 'wu_pendulum'],
  },
  {
    id: 'chest', label: 'Chest', emoji: '🫁',
    defaultId: 'str_pec_roller_t',
    options: ['str_pec_roller_t', 'wu_chest_opener', 'str_upward_dog', 'str_biceps_wall'],
  },
  {
    id: 'upperback', label: 'Upper Back', emoji: '🔙',
    defaultId: 'str_upper_back_roller',
    options: ['str_upper_back_roller', 'wu_prone_cobra'],
  },
  {
    id: 'trunk', label: 'Trunk', emoji: '🔄',
    defaultId: 'str_cat_cow_cow',
    options: ['str_cat_cow_cow', 'str_sideways_bend', 'str_pilates_saw'],
  },
  {
    id: 'lowerback', label: 'Lower Back', emoji: '🔻',
    defaultId: 'str_childs_pose',
    options: ['str_childs_pose', 'str_knee_to_chest', 'str_double_knee_chest', 'str_spine_twist'],
  },
  {
    id: 'spine', label: 'Spine / Rotation', emoji: '🌀',
    defaultId: 'str_spinal_rotation',
    options: ['str_spinal_rotation', 'str_trunk_rotations', 'str_pilates_saw'],
  },
  {
    id: 'hipflexors', label: 'Hip Flexors', emoji: '🏃',
    defaultId: 'str_hip_flexor',
    options: ['str_hip_flexor', 'str_90_90_hip', 'str_lateral_lunge', 'str_deep_squat'],
  },
  {
    id: 'hips', label: 'Hips / Glutes', emoji: '🦋',
    defaultId: 'str_figure_four',
    options: ['str_figure_four', 'str_pigeon', 'str_piriformis_seated', 'str_butterfly', 'str_knee_opp_shoulder'],
  },
  {
    id: 'hamstrings', label: 'Hamstrings', emoji: '🦵',
    defaultId: 'str_hamstring',
    options: ['str_hamstring', 'wu_hamstring_stretch', 'str_forward_fold', 'str_nerve_glide_supine'],
  },
  {
    id: 'itband', label: 'IT Band', emoji: '🦴',
    defaultId: 'str_it_band',
    options: ['str_it_band', 'str_lateral_lunge'],
  },
  {
    id: 'calves', label: 'Calves / Ankles', emoji: '🦶',
    defaultId: 'str_calf_straight',
    options: ['str_calf_straight', 'str_ankle_circles', 'str_ankle_dorsiflexion'],
  },
];

// Returns the 12-element stretch-ID array for the routine.
// Falls back to each group's defaultId for any unset slot.
export function getStretchConfig() {
  const raw = JSON.parse(localStorage.getItem('il_stretch_config') || '[]');
  return STRETCH_GROUPS.map((group, i) => raw[i] || group.defaultId);
}

// Saves a single slot choice to il_stretch_config.
export function saveStretchChoice(slotIndex, stretchId) {
  const raw = JSON.parse(localStorage.getItem('il_stretch_config') || '[]');
  const saved = Array.isArray(raw) && raw.length === 12
    ? [...raw]
    : STRETCH_GROUPS.map(g => g.defaultId);
  saved[slotIndex] = stretchId;
  localStorage.setItem('il_stretch_config', JSON.stringify(saved));
}

// Clears the stretch config — next load will use all defaults.
export function resetStretchConfig() {
  localStorage.removeItem('il_stretch_config');
}

// Returns a human-readable duration string for a stretch.
export function fmtStretchDur(s) {
  if (!s) return '';
  return s.bilateral ? `${s.suggestedSecs}s each side` : `${s.suggestedSecs}s`;
}

// Muscle highlight mapping for MuscleDiagram.
// "primary" = main anatomical area being stretched / mobilised (not activation).
// Only names from DISPLAY_TO_SVG_IDS are valid here.
export const STRETCH_MUSCLE_META = {
  str_neck:             ['Upper Traps',     null],
  str_cross_shoulder:   ['Rear Delts',      'Mid Traps'],
  str_pec_roller_t:     ['Chest',           'Front Delts'],
  str_upper_back_roller:['Mid Traps',       'Spinal Erectors'],
  str_cat_cow_cow:      ['Spinal Erectors', 'Abs'],
  str_childs_pose:      ['Lats',            'Spinal Erectors'],
  str_spinal_rotation:  ['Obliques',        'Spinal Erectors'],
  str_hip_flexor:       ['Quads',           null],
  str_figure_four:      ['Glutes',          null],
  str_hamstring:        ['Hamstrings',      'Spinal Erectors'],
  str_it_band:          ['Glutes',          null],
  str_calf_straight:    ['Calves',          null],
  // wu_cat_cow excluded — duplicate of str_cat_cow_cow
  wu_prone_cobra:       ['Spinal Erectors', 'Abs'],
  wu_hamstring_stretch: ['Hamstrings',      'Spinal Erectors'],
  wu_chest_opener:      ['Chest',           'Front Delts'],
  wu_pendulum:          ['Rear Delts',      null],
  // fin_ham_floss excluded — duplicate of str_hamstring
  // fin_childs_pose excluded — duplicate of str_childs_pose
  // Additional stretches — full muscle-tendon coverage
  str_neck_rotation:      ['Upper Traps',     null],
  str_overhead_triceps:   ['Triceps',         null],
  str_upward_dog:         ['Abs',             'Chest'],
  str_biceps_wall:        ['Biceps',          'Chest'],
  str_sideways_bend:      ['Obliques',        'Lats'],
  str_knee_to_chest:      ['Spinal Erectors', 'Glutes'],
  str_spine_twist:        ['Obliques',        'Spinal Erectors'],
  str_90_90_hip:          ['Glutes',          null],
  str_pigeon:             ['Glutes',          null],
  str_quad_standing:      ['Quads',           null],
  str_forward_fold:       ['Hamstrings',      'Spinal Erectors'],
  str_ankle_circles:      ['Calves',          null],
  str_ankle_dorsiflexion: ['Calves',          null],
  // Sciatica-specific
  str_nerve_floss:          ['Hamstrings',      null],
  str_piriformis_seated:    ['Glutes',          null],
  // Additional sciatica (clinical sources)
  str_knee_opp_shoulder:    ['Glutes',          null],
  str_double_knee_chest:    ['Spinal Erectors', 'Glutes'],
  str_nerve_glide_supine:   ['Hamstrings',      null],
  str_trunk_rotations:      ['Spinal Erectors', 'Obliques'],
  // Cross-legged sitting
  str_butterfly:            ['Glutes',          null],   // adductors not in SVG — glutes closest
  str_deep_squat:           ['Glutes',          'Quads'],
  str_lateral_lunge:        ['Glutes',          'Quads'], // adductors not in SVG
  str_pilates_saw:          ['Hamstrings',      'Obliques'],
};

// IDs of stretches that directly address sciatica nerve pain.
// This set drives the s.sciatica flag (applied in applyStretchMeta)
// and the Sciatica filter toggle in the Stretches tab.
export const STRETCH_SCIATICA_IDS = new Set([
  'str_figure_four',       // piriformis — compresses sciatic nerve
  'str_childs_pose',       // lumbar decompression
  'str_hamstring',         // tight hamstrings contribute to sciatica
  'wu_hamstring_stretch',  // same
  'wu_prone_cobra',        // lumbar extension (McKenzie method)
  'str_knee_to_chest',     // lumbar decompression
  'str_pigeon',            // deep piriformis
  'str_90_90_hip',         // piriformis / hip external rotators
  'str_forward_fold',      // hamstring + neural tension
  'str_nerve_floss',       // direct sciatic nerve mobilisation (seated)
  'str_piriformis_seated', // piriformis
  // Clinical additions (OAH PDF + Healthline):
  'str_knee_opp_shoulder', // piriformis pull toward opposite shoulder
  'str_double_knee_chest', // bilateral lumbar decompression
  'str_nerve_glide_supine',// supine sciatic nerve glide (pump ankle)
  'str_trunk_rotations',   // gentle lumbar mobilisation (wig wags)
]);

// IDs of stretches that help achieve comfortable cross-legged floor sitting.
// Covers adductors, hip external rotation, hip flexors, hamstrings (pelvic tilt),
// and thoracic extension (to prevent slouching).
export const STRETCH_CROSS_LEGGED_IDS = new Set([
  'str_figure_four',       // piriformis / hip external rotation
  'str_piriformis_seated', // piriformis / hip external rotation
  'str_pigeon',            // deep hip external rotation
  'str_90_90_hip',         // hip external rotation
  'str_hip_flexor',        // hip flexors
  'str_hamstring',         // hamstrings → tight = posterior pelvic tilt = slouch
  'wu_hamstring_stretch',  // same
  'str_forward_fold',      // hamstrings
  'str_childs_pose',       // general hip / lower back mobility
  'str_knee_to_chest',     // hip flexor / back decompression
  'str_butterfly',         // adductors — the primary missing ingredient
  'str_deep_squat',        // comprehensive hip joint opener
  'str_lateral_lunge',     // adductors from standing angle
  'str_pilates_saw',       // seated wide-leg reach — trains upright posture
]);


export function applyStretchMeta() {
  STRETCH_LIBRARY.forEach(s => {
    const [p, sec] = STRETCH_MUSCLE_META[s.id] || [null, null];
    s.primary = p ? [p] : [];
    s.secondary = sec ? [sec] : [];
    s.sciatica = STRETCH_SCIATICA_IDS.has(s.id);
    s.cross_legged = STRETCH_CROSS_LEGGED_IDS.has(s.id);
  });
}

applyStretchMeta();

export default {
  WARMUP,
  STRETCHES,
  STRETCH_LIBRARY,
  WARMUP_GROUPS,
  STRETCH_GROUPS,
  STRETCH_MUSCLE_META,
  STRETCH_SCIATICA_IDS,
  STRETCH_CROSS_LEGGED_IDS,
  getWarmupConfig,
  saveWarmupChoice,
  resetWarmupConfig,
  getStretchConfig,
  saveStretchChoice,
  resetStretchConfig,
  fmtStretchDur,
  applyStretchMeta,
};

