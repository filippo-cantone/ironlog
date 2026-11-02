import React, { useState, useEffect, useRef, useCallback } from './runtime.js';
import sessionDomain from './domain/session.js';
import progressionDomain from './domain/progression.js';
import healthDomain from './domain/health.js';
import storageDomain from './storage/localStore.js';
import syncDomain from './integrations/supabase.js';
import theme from './ui/theme.js';
import chartDomain from './ui/charts/metrics.js';
import Nav from './ui/Nav.jsx';
import ProgressScreen from './screens/Progress.jsx';
import RidesScreen from './screens/Rides.jsx';

const { migrateSession, migrateSessions } = sessionDomain;
const { detectPRs, checkOverloadNudges } = progressionDomain;
const { emptyHealthData, mergeHealthData } = healthDomain;
const { safeParse, validateBackup } = storageDomain;
const { shouldRestoreCloud } = syncDomain;
const { C, st, dash } = theme;
const { smoothLinePath, chartColorKey, metricChartColorKey, metricStatusColor, gradientStopsForPoints: chartGradientStops } = chartDomain;

// ═══════════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════════
const EXERCISE_ICONS = {
  db_bench: <><line x1="6" y1="23" x2="26" y2="23" /><circle cx="12" cy="18" r="2" /><line x1="14" y1="18" x2="21" y2="18" /><line x1="17" y1="17" x2="17" y2="10" /><line x1="22" y1="17" x2="22" y2="10" /><line x1="14" y1="10" x2="25" y2="10" /><line x1="14" y1="23" x2="10" y2="27" /><line x1="20" y1="23" x2="24" y2="27" /></>,
  bb_flat_bench: <><line x1="5" y1="23" x2="27" y2="23" /><circle cx="12" cy="18" r="2" /><line x1="14" y1="18" x2="21" y2="18" /><line x1="17" y1="17" x2="17" y2="10" /><line x1="22" y1="17" x2="22" y2="10" /><line x1="8" y1="9" x2="28" y2="9" /><line x1="8" y1="7" x2="8" y2="11" /><line x1="28" y1="7" x2="28" y2="11" /></>,
  bb_incline_bench: <><line x1="6" y1="25" x2="22" y2="14" /><circle cx="12" cy="19" r="2" /><line x1="14" y1="18" x2="20" y2="15" /><line x1="18" y1="15" x2="16" y2="9" /><line x1="21" y1="14" x2="24" y2="9" /><line x1="11" y1="8" x2="29" y2="8" /><line x1="11" y1="6" x2="11" y2="10" /><line x1="29" y1="6" x2="29" y2="10" /></>,
  db_floor_press: <><line x1="5" y1="25" x2="27" y2="25" /><circle cx="11" cy="20" r="2" /><line x1="13" y1="20" x2="21" y2="20" /><line x1="16" y1="19" x2="16" y2="11" /><line x1="22" y1="19" x2="22" y2="11" /><line x1="14" y1="11" x2="24" y2="11" /><line x1="20" y1="20" x2="25" y2="25" /></>,
  incline_pushups: <><line x1="21" y1="18" x2="29" y2="18" /><line x1="24" y1="18" x2="24" y2="26" /><circle cx="7" cy="13" r="2" /><line x1="9" y1="14" x2="19" y2="18" /><line x1="19" y1="18" x2="23" y2="18" /><line x1="11" y1="15" x2="7" y2="24" /><line x1="16" y1="17" x2="13" y2="25" /></>,
  p_push_up: <><line x1="5" y1="25" x2="27" y2="25" /><circle cx="7" cy="17" r="2" /><line x1="9" y1="18" x2="21" y2="21" /><line x1="21" y1="21" x2="25" y2="25" /><line x1="14" y1="19" x2="12" y2="25" /><line x1="19" y1="21" x2="18" y2="25" /></>,
  p_db_fly: <><line x1="6" y1="23" x2="26" y2="23" /><circle cx="13" cy="18" r="2" /><line x1="15" y1="18" x2="20" y2="18" /><path d="M17 17c-4-4-7-5-10-5" /><path d="M20 17c4-4 7-5 10-5" /><line x1="7" y1="12" x2="5" y2="10" /><line x1="29" y1="12" x2="27" y2="10" /></>,
  p_incline_db_press: <><line x1="7" y1="25" x2="22" y2="14" /><circle cx="12" cy="19" r="2" /><line x1="14" y1="18" x2="20" y2="15" /><line x1="18" y1="16" x2="20" y2="10" /><line x1="22" y1="14" x2="25" y2="10" /><line x1="19" y1="10" x2="21" y2="8" /><line x1="24" y1="10" x2="26" y2="8" /></>,
  p_chest_dip: <><line x1="9" y1="10" x2="9" y2="26" /><line x1="23" y1="10" x2="23" y2="26" /><line x1="7" y1="12" x2="13" y2="12" /><line x1="19" y1="12" x2="25" y2="12" /><circle cx="16" cy="9" r="2" /><line x1="16" y1="11" x2="16" y2="18" /><line x1="16" y1="13" x2="11" y2="15" /><line x1="16" y1="13" x2="21" y2="15" /><line x1="16" y1="18" x2="13" y2="25" /><line x1="16" y1="18" x2="20" y2="25" /></>,
  p_cable_fly: <><line x1="4" y1="4" x2="4" y2="26" /><line x1="28" y1="4" x2="28" y2="26" /><circle cx="16" cy="7" r="2" /><line x1="16" y1="9" x2="16" y2="19" /><path d="M16 12c-5 1-8 3-10 7" /><path d="M16 12c5 1 8 3 10 7" /><line x1="16" y1="19" x2="12" y2="27" /><line x1="16" y1="19" x2="20" y2="27" /></>,
  p_close_grip_bench: <><line x1="5" y1="23" x2="27" y2="23" /><circle cx="12" cy="18" r="2" /><line x1="14" y1="18" x2="21" y2="18" /><line x1="18" y1="17" x2="18" y2="10" /><line x1="20" y1="17" x2="20" y2="10" /><line x1="10" y1="9" x2="28" y2="9" /><line x1="10" y1="7" x2="10" y2="11" /><line x1="28" y1="7" x2="28" y2="11" /></>,
  p_lateral_raise: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="7" y2="11" /><line x1="16" y1="11" x2="25" y2="11" /><line x1="6" y1="10" x2="6" y2="13" /><line x1="26" y1="10" x2="26" y2="13" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_front_raise: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="16" y2="4" /><line x1="16" y1="11" x2="23" y2="14" /><line x1="15" y1="3" x2="18" y2="3" /><line x1="24" y1="13" x2="24" y2="16" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_db_shoulder_press: <><line x1="11" y1="25" x2="21" y2="25" /><circle cx="16" cy="6" r="2.2" /><line x1="16" y1="8" x2="16" y2="17" /><line x1="16" y1="11" x2="12" y2="7" /><line x1="16" y1="11" x2="20" y2="7" /><line x1="12" y1="7" x2="12" y2="3" /><line x1="20" y1="7" x2="20" y2="3" /><line x1="10" y1="3" x2="14" y2="3" /><line x1="18" y1="3" x2="22" y2="3" /></>,
  p_arnold_press: <><line x1="11" y1="25" x2="21" y2="25" /><circle cx="16" cy="6" r="2.2" /><line x1="16" y1="8" x2="16" y2="17" /><path d="M16 11c-3 0-5-2-5-4" /><path d="M16 11c3 0 5-2 5-4" /><path d="M11 7c0-3 2-4 4-5" /><path d="M21 7c0-3-2-4-4-5" /><line x1="16" y1="17" x2="13" y2="25" /><line x1="16" y1="17" x2="19" y2="25" /></>,
  p_rear_delt_fly: <><circle cx="12" cy="9" r="2" /><line x1="14" y1="10" x2="21" y2="16" /><line x1="20" y1="16" x2="13" y2="16" /><line x1="20" y1="16" x2="27" y2="16" /><line x1="12" y1="16" x2="10" y2="19" /><line x1="28" y1="16" x2="30" y2="19" /><line x1="21" y1="16" x2="16" y2="25" /><line x1="21" y1="16" x2="24" y2="25" /></>,
  p_shrugs: <><circle cx="16" cy="5" r="2.2" /><path d="M12 10c1-2 7-2 8 0" /><line x1="16" y1="8" x2="16" y2="18" /><line x1="16" y1="11" x2="11" y2="18" /><line x1="16" y1="11" x2="21" y2="18" /><line x1="10" y1="18" x2="10" y2="22" /><line x1="22" y1="18" x2="22" y2="22" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  face_pull: <><line x1="28" y1="7" x2="28" y2="25" /><circle cx="14" cy="8" r="2.2" /><line x1="14" y1="10" x2="14" y2="20" /><line x1="14" y1="13" x2="20" y2="9" /><line x1="14" y1="13" x2="20" y2="15" /><line x1="20" y1="9" x2="28" y2="10" /><line x1="20" y1="15" x2="28" y2="12" /><line x1="14" y1="20" x2="10" y2="28" /><line x1="14" y1="20" x2="18" y2="28" /></>,
  reverse_fly: <><circle cx="12" cy="9" r="2" /><line x1="14" y1="10" x2="21" y2="16" /><line x1="20" y1="16" x2="13" y2="16" /><line x1="20" y1="16" x2="27" y2="16" /><line x1="12" y1="16" x2="10" y2="19" /><line x1="28" y1="16" x2="30" y2="19" /><line x1="21" y1="16" x2="16" y2="25" /><line x1="21" y1="16" x2="24" y2="25" /></>,
  p_tricep_pushdown: <><line x1="24" y1="4" x2="24" y2="13" /><circle cx="14" cy="7" r="2.2" /><line x1="14" y1="9" x2="14" y2="20" /><line x1="14" y1="12" x2="20" y2="12" /><line x1="20" y1="12" x2="24" y2="10" /><line x1="19" y1="12" x2="19" y2="21" /><line x1="14" y1="20" x2="10" y2="28" /><line x1="14" y1="20" x2="18" y2="28" /></>,
  p_overhead_ext: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="10" x2="12" y2="4" /><line x1="16" y1="10" x2="20" y2="4" /><line x1="12" y1="4" x2="16" y2="13" /><line x1="20" y1="4" x2="16" y2="13" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_skull_crushers: <><line x1="6" y1="23" x2="26" y2="23" /><circle cx="12" cy="18" r="2" /><line x1="14" y1="18" x2="21" y2="18" /><line x1="17" y1="17" x2="15" y2="12" /><line x1="22" y1="17" x2="24" y2="12" /><line x1="14" y1="12" x2="25" y2="12" /><line x1="20" y1="23" x2="24" y2="27" /></>,
  p_tricep_dips: <><line x1="6" y1="15" x2="19" y2="15" /><line x1="8" y1="15" x2="8" y2="25" /><line x1="19" y1="15" x2="19" y2="25" /><circle cx="20" cy="12" r="2" /><line x1="19" y1="14" x2="16" y2="20" /><line x1="16" y1="20" x2="25" y2="20" /><line x1="17" y1="17" x2="19" y2="15" /><line x1="25" y1="20" x2="28" y2="25" /></>,
  db_row_1arm: <><line x1="7" y1="18" x2="18" y2="18" /><line x1="10" y1="18" x2="10" y2="25" /><circle cx="14" cy="9" r="2" /><line x1="16" y1="10" x2="23" y2="16" /><line x1="18" y1="14" x2="12" y2="18" /><line x1="23" y1="16" x2="23" y2="23" /><line x1="23" y1="23" x2="25" y2="23" /><line x1="23" y1="16" x2="28" y2="25" /></>,
  cs_db_row: <><line x1="8" y1="22" x2="24" y2="14" /><circle cx="14" cy="16" r="2" /><line x1="16" y1="16" x2="22" y2="14" /><line x1="18" y1="17" x2="17" y2="24" /><line x1="22" y1="14" x2="22" y2="22" /><line x1="16" y1="24" x2="18" y2="24" /><line x1="21" y1="22" x2="23" y2="22" /></>,
  band_row: <><line x1="26" y1="8" x2="26" y2="25" /><circle cx="10" cy="11" r="2" /><line x1="10" y1="13" x2="10" y2="22" /><line x1="10" y1="16" x2="18" y2="16" /><line x1="18" y1="16" x2="26" y2="12" /><line x1="18" y1="16" x2="26" y2="20" /><line x1="10" y1="22" x2="6" y2="27" /><line x1="10" y1="22" x2="16" y2="27" /></>,
  chin_up: <><line x1="7" y1="5" x2="25" y2="5" /><circle cx="16" cy="9" r="2.2" /><line x1="16" y1="11" x2="16" y2="20" /><line x1="16" y1="12" x2="11" y2="5" /><line x1="16" y1="12" x2="21" y2="5" /><line x1="16" y1="20" x2="12" y2="28" /><line x1="16" y1="20" x2="20" y2="28" /></>,
  p_pull_up: <><line x1="7" y1="5" x2="25" y2="5" /><circle cx="16" cy="11" r="2.2" /><line x1="16" y1="13" x2="16" y2="21" /><line x1="16" y1="14" x2="10" y2="5" /><line x1="16" y1="14" x2="22" y2="5" /><line x1="16" y1="21" x2="12" y2="28" /><line x1="16" y1="21" x2="20" y2="28" /></>,
  p_lat_pulldown: <><line x1="8" y1="5" x2="24" y2="5" /><circle cx="16" cy="9" r="2.2" /><line x1="16" y1="11" x2="16" y2="21" /><line x1="16" y1="13" x2="11" y2="8" /><line x1="16" y1="13" x2="21" y2="8" /><line x1="11" y1="8" x2="8" y2="5" /><line x1="21" y1="8" x2="24" y2="5" /><line x1="10" y1="25" x2="22" y2="25" /></>,
  p_seated_cable_row: <><line x1="27" y1="7" x2="27" y2="24" /><circle cx="10" cy="12" r="2" /><line x1="10" y1="14" x2="13" y2="22" /><line x1="13" y1="17" x2="21" y2="17" /><line x1="21" y1="17" x2="27" y2="14" /><line x1="13" y1="22" x2="8" y2="26" /><line x1="13" y1="22" x2="20" y2="26" /></>,
  p_t_bar_row: <><circle cx="12" cy="9" r="2" /><line x1="14" y1="10" x2="22" y2="16" /><line x1="22" y1="16" x2="16" y2="24" /><line x1="22" y1="16" x2="26" y2="24" /><line x1="18" y1="13" x2="23" y2="18" /><line x1="12" y1="24" x2="30" y2="17" /><line x1="29" y1="15" x2="31" y2="19" /></>,
  p_straight_arm_pd: <><line x1="25" y1="4" x2="25" y2="15" /><circle cx="14" cy="7" r="2.2" /><line x1="14" y1="9" x2="14" y2="20" /><line x1="14" y1="12" x2="22" y2="8" /><line x1="22" y1="8" x2="25" y2="6" /><line x1="14" y1="15" x2="22" y2="21" /><line x1="14" y1="20" x2="10" y2="28" /><line x1="14" y1="20" x2="18" y2="28" /></>,
  p_db_bicep_curl: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="11" y2="16" /><line x1="11" y1="16" x2="13" y2="10" /><line x1="13" y1="10" x2="15" y2="10" /><line x1="16" y1="11" x2="21" y2="18" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_barbell_curl: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="12" y2="17" /><line x1="16" y1="11" x2="20" y2="17" /><line x1="10" y1="15" x2="22" y2="15" /><line x1="10" y1="13" x2="10" y2="17" /><line x1="22" y1="13" x2="22" y2="17" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_hammer_curl: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="11" y2="17" /><line x1="11" y1="17" x2="13" y2="12" /><line x1="13" y1="11" x2="13" y2="14" /><line x1="16" y1="11" x2="21" y2="18" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /></>,
  p_concentration_curl: <><line x1="9" y1="24" x2="23" y2="24" /><circle cx="14" cy="8" r="2" /><line x1="14" y1="10" x2="18" y2="18" /><line x1="18" y1="18" x2="13" y2="22" /><line x1="13" y1="22" x2="15" y2="16" /><line x1="15" y1="16" x2="17" y2="16" /><line x1="18" y1="18" x2="24" y2="24" /></>,
  p_preacher_curl: <><line x1="8" y1="24" x2="24" y2="16" /><line x1="10" y1="25" x2="23" y2="25" /><circle cx="12" cy="9" r="2" /><line x1="12" y1="11" x2="16" y2="18" /><line x1="16" y1="18" x2="21" y2="16" /><line x1="21" y1="16" x2="18" y2="12" /><line x1="18" y1="12" x2="20" y2="11" /></>,
  kb_deadlift: <><rect x="13" y="21" width="6" height="5" rx="2" /><path d="M14 21c0-3 4-3 4 0" /><circle cx="16" cy="7" r="2.2" /><line x1="16" y1="9" x2="21" y2="16" /><line x1="21" y1="16" x2="17" y2="21" /><line x1="21" y1="16" x2="25" y2="25" /><line x1="17" y1="21" x2="10" y2="25" /><line x1="8" y1="27" x2="22" y2="27" /></>,
  rdl: <><circle cx="10.5" cy="8" r="1.8" fill="#243244" /><path d="M12.2 9.1l8.3 5.2-2.6 3.7-8.3-5.2z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><path d="M15.5 13.4l-4.1 9.7M20.3 14.5l4.3 10.1M11.5 23.2h4.7M24.5 24.6h4.2" stroke="#243244" strokeWidth="1.25" /><path d="M18 16.8l-2.2 5.8M21.3 16.1l-2.2 5.8" stroke="#243244" strokeWidth="1.25" /><rect x="13.8" y="21.6" width="3.5" height="2.5" rx=".6" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><rect x="17.1" y="21" width="3.5" height="2.5" rx=".6" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /></>,
  goblet_squat: <><circle cx="15.5" cy="5.2" r="1.9" fill="#243244" /><path d="M13.5 8.2c1.2-.8 3.6-.8 4.8 0l1.2 5.3-2.1 3.3h-3.6l-2.1-3.3z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><rect x="12.6" y="11.2" width="6.4" height="4.2" rx="1" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><path d="M13.2 13.2l-5.5 5.4 3.7 6.6M18.9 13.2l5.4 5.4-3.7 6.6" stroke="#243244" strokeWidth="1.25" /><path d="M11.4 25.2H7.6M20.6 25.2h3.8M13.2 10.2l-2.8 3M18.9 10.2l2.8 3" stroke="#243244" strokeWidth="1.25" /></>,
  reverse_lunge: <><circle cx="14.8" cy="5.4" r="1.9" fill="#243244" /><path d="M13.1 8.2c1.2-.8 3.6-.8 4.8 0l.7 8.8-2.2 2.2h-3.1l-1.5-5.5z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><path d="M13.1 13.1l-4.2 4.2M18 13.1l4.4 3.4" stroke="#243244" strokeWidth="1.25" /><path d="M16 18.8l-5.3 7.1h-4M16.5 18.8l7.2 4.5 4.4-.1" stroke="#243244" strokeWidth="1.25" /><path d="M23.7 23.3v3.2" stroke="#5b9df5" strokeWidth="1.2" /></>,
  split_squat: <><circle cx="15" cy="5" r="2.2" /><line x1="15" y1="7" x2="15" y2="17" /><line x1="15" y1="17" x2="9" y2="25" /><line x1="15" y1="17" x2="22" y2="25" /><line x1="8" y1="25" x2="13" y2="25" /><line x1="21" y1="25" x2="27" y2="25" /><line x1="15" y1="11" x2="10" y2="15" /><line x1="15" y1="11" x2="20" y2="15" /></>,
  step_ups: <><line x1="17" y1="22" x2="29" y2="22" /><line x1="19" y1="22" x2="19" y2="27" /><circle cx="12" cy="6" r="2.2" /><line x1="12" y1="8" x2="14" y2="17" /><line x1="14" y1="17" x2="20" y2="22" /><line x1="14" y1="17" x2="10" y2="27" /><line x1="12" y1="11" x2="8" y2="15" /><line x1="12" y1="11" x2="17" y2="14" /></>,
  sb_ham_curl: <><circle cx="24" cy="22.6" r="5.2" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1.1" /><path d="M20 22.6c2.4-1.5 5.3-1.5 8 0" stroke="#5b9df5" strokeWidth=".9" /><circle cx="7.8" cy="17.2" r="1.8" fill="#243244" /><path d="M9.6 17.2l8.8-1.2 5.7 3.1-1.8 3.1-4.9-2.7-8.2 1.4z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><path d="M13.1 19.9l-5.1 4.5M17.8 19.4l2.1 4.4" stroke="#243244" strokeWidth="1.25" /><line x1="4.5" y1="26.5" x2="29" y2="26.5" stroke="#d9e4ef" strokeWidth="1" /></>,
  calf_raises: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="12" y2="16" /><line x1="16" y1="11" x2="20" y2="16" /><line x1="16" y1="18" x2="13" y2="27" /><line x1="16" y1="18" x2="20" y2="27" /><line x1="12" y1="27" x2="16" y2="25" /><line x1="19" y1="27" x2="23" y2="25" /></>,
  single_leg_bal: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="10" y2="13" /><line x1="16" y1="11" x2="22" y2="13" /><line x1="16" y1="18" x2="15" y2="28" /><line x1="16" y1="18" x2="23" y2="22" /><line x1="13" y1="28" x2="18" y2="28" /></>,
  p_leg_press: <><line x1="8" y1="24" x2="18" y2="16" /><circle cx="10" cy="17" r="2" /><line x1="12" y1="17" x2="18" y2="20" /><line x1="18" y1="20" x2="25" y2="12" /><line x1="24" y1="5" x2="29" y2="16" /><line x1="18" y1="20" x2="22" y2="25" /><line x1="22" y1="25" x2="28" y2="25" /></>,
  p_leg_extension: <><line x1="7" y1="22" x2="19" y2="22" /><line x1="19" y1="22" x2="19" y2="27" /><circle cx="12" cy="12" r="2" /><line x1="12" y1="14" x2="16" y2="21" /><line x1="16" y1="21" x2="27" y2="18" /><line x1="27" y1="18" x2="29" y2="20" /><line x1="16" y1="21" x2="11" y2="24" /></>,
  p_seated_leg_curl: <><line x1="7" y1="20" x2="19" y2="20" /><line x1="19" y1="20" x2="19" y2="27" /><circle cx="12" cy="11" r="2" /><line x1="12" y1="13" x2="16" y2="20" /><line x1="16" y1="20" x2="24" y2="25" /><line x1="24" y1="25" x2="21" y2="28" /><line x1="16" y1="20" x2="10" y2="24" /></>,
  p_sumo_squat: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="15" /><line x1="16" y1="10" x2="12" y2="14" /><line x1="16" y1="10" x2="20" y2="14" /><line x1="16" y1="15" x2="9" y2="24" /><line x1="16" y1="15" x2="23" y2="24" /><line x1="9" y1="24" x2="5" y2="26" /><line x1="23" y1="24" x2="27" y2="26" /><circle cx="16" cy="18" r="2" /></>,
  p_wall_sit: <><line x1="24" y1="5" x2="24" y2="28" /><circle cx="18" cy="8" r="2" /><line x1="18" y1="10" x2="20" y2="18" /><line x1="20" y1="18" x2="12" y2="18" /><line x1="12" y1="18" x2="12" y2="26" /><line x1="20" y1="18" x2="24" y2="18" /><line x1="12" y1="26" x2="18" y2="26" /></>,
  hip_thrust: <><rect x="3.5" y="16.7" width="10.5" height="3.8" rx="1" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><line x1="6" y1="20.5" x2="6" y2="26.5" stroke="#5b9df5" strokeWidth="1" /><line x1="12" y1="20.5" x2="12" y2="26.5" stroke="#5b9df5" strokeWidth="1" /><circle cx="11.5" cy="13.2" r="1.8" fill="#243244" /><path d="M13 14.1l8.4 2.4 2.7 4.8-3.3 2.1-2.4-4.2-7-1.7z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><rect x="17.3" y="14.4" width="7.3" height="2.5" rx=".8" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><path d="M20.8 23.4h-5.6M24 21.2l4.2 5.2M28.2 26.4h-4.7" stroke="#243244" strokeWidth="1.25" /></>,
  p_cable_kickback: <><line x1="25" y1="6" x2="25" y2="27" /><circle cx="12" cy="12" r="2" /><line x1="14" y1="13" x2="20" y2="18" /><line x1="20" y1="18" x2="14" y2="24" /><line x1="20" y1="18" x2="28" y2="12" /><line x1="14" y1="16" x2="9" y2="22" /><line x1="28" y1="12" x2="25" y2="14" /></>,
  p_hip_abduction: <><circle cx="16" cy="8" r="2" /><line x1="16" y1="10" x2="16" y2="19" /><line x1="16" y1="14" x2="11" y2="17" /><line x1="16" y1="14" x2="21" y2="17" /><line x1="16" y1="19" x2="9" y2="25" /><line x1="16" y1="19" x2="23" y2="25" /><path d="M10 23c4 3 8 3 12 0" /></>,
  p_donkey_kick: <><circle cx="10" cy="12" r="2" /><line x1="12" y1="13" x2="19" y2="18" /><line x1="19" y1="18" x2="13" y2="24" /><line x1="19" y1="18" x2="25" y2="12" /><line x1="25" y1="12" x2="25" y2="7" /><line x1="12" y1="16" x2="8" y2="24" /></>,
  p_clamshell: <><circle cx="10" cy="17" r="2" /><line x1="12" y1="17" x2="20" y2="20" /><line x1="20" y1="20" x2="26" y2="25" /><line x1="20" y1="20" x2="26" y2="15" /><path d="M18 21c3-2 5-4 8-6" /><line x1="5" y1="26" x2="28" y2="26" /></>,
  pallof_press: <><line x1="28" y1="7" x2="28" y2="25" stroke="#d9e4ef" strokeWidth="1.2" /><path d="M18.2 13.2h9.2" stroke="#5b9df5" strokeWidth="1" strokeDasharray="1.8 1.4" /><circle cx="11.5" cy="6.2" r="1.9" fill="#243244" /><path d="M9.8 9c1.2-.8 3.5-.8 4.8 0l1.1 10.4h-6.6z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><path d="M14.5 12.9h7.2M21.7 12.9l-1.8 1.9M21.7 12.9l-1.8-1.9" stroke="#243244" strokeWidth="1.25" /><path d="M11.5 19.4L8.5 27M13.4 19.4l4.2 7.6" stroke="#243244" strokeWidth="1.25" /></>,
  farmers_walk: <><circle cx="16" cy="5.3" r="1.9" fill="#243244" /><path d="M14.2 8.1c1.2-.8 3.6-.8 4.8 0l.8 10.3h-6.4z" fill="#e8f0fe" stroke="#243244" strokeWidth="1.25" /><path d="M13.8 11.7l-4.6 5.6M19.4 11.7l4.6 5.7" stroke="#243244" strokeWidth="1.25" /><rect x="6.6" y="17" width="4.4" height="6.3" rx=".8" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><rect x="21.4" y="17.2" width="4.4" height="6.3" rx=".8" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><path d="M15.2 18.4l-4.4 8.1h-3.4M18.1 18.4l5.7 7.6h3.5" stroke="#243244" strokeWidth="1.25" /></>,
  suitcase_carry: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="18" /><line x1="16" y1="11" x2="10" y2="18" /><line x1="16" y1="11" x2="21" y2="14" /><rect x="7" y="18" width="4" height="5" rx="1" /><line x1="16" y1="18" x2="12" y2="27" /><line x1="16" y1="18" x2="21" y2="26" /></>,
  p_plank: <><line x1="5" y1="25" x2="27" y2="25" /><circle cx="8" cy="18" r="2" /><line x1="10" y1="19" x2="23" y2="22" /><line x1="10" y1="20" x2="8" y2="25" /><line x1="17" y1="21" x2="16" y2="25" /><line x1="23" y1="22" x2="27" y2="25" /></>,
  p_side_plank: <><line x1="6" y1="26" x2="27" y2="26" /><circle cx="9" cy="17" r="2" /><line x1="11" y1="18" x2="24" y2="21" /><line x1="13" y1="19" x2="10" y2="26" /><line x1="24" y1="21" x2="28" y2="26" /><line x1="16" y1="16" x2="20" y2="10" /></>,
  p_dead_bug: <><circle cx="16" cy="17" r="2" /><line x1="16" y1="19" x2="16" y2="24" /><line x1="16" y1="19" x2="9" y2="13" /><line x1="16" y1="19" x2="24" y2="13" /><line x1="16" y1="24" x2="10" y2="28" /><line x1="16" y1="24" x2="23" y2="28" /><line x1="6" y1="29" x2="28" y2="29" /></>,
  p_bird_dog: <><circle cx="10" cy="12" r="2" /><line x1="12" y1="13" x2="19" y2="18" /><line x1="12" y1="13" x2="5" y2="9" /><line x1="19" y1="18" x2="27" y2="14" /><line x1="19" y1="18" x2="13" y2="25" /><line x1="12" y1="16" x2="8" y2="24" /></>,
  p_ab_wheel: <><circle cx="10" cy="12" r="2" /><line x1="12" y1="13" x2="20" y2="19" /><line x1="20" y1="19" x2="26" y2="19" /><circle cx="27" cy="20" r="2" /><line x1="20" y1="19" x2="14" y2="26" /><line x1="14" y1="26" x2="9" y2="26" /></>,
  p_hanging_knee_raise: <><line x1="7" y1="5" x2="25" y2="5" /><circle cx="16" cy="9" r="2.2" /><line x1="16" y1="11" x2="16" y2="19" /><line x1="16" y1="12" x2="11" y2="5" /><line x1="16" y1="12" x2="21" y2="5" /><line x1="16" y1="19" x2="12" y2="23" /><line x1="16" y1="19" x2="21" y2="23" /><line x1="12" y1="23" x2="20" y2="23" /></>,
  p_cable_crunch: <><line x1="23" y1="4" x2="23" y2="13" /><circle cx="15" cy="10" r="2" /><path d="M15 12c1 5 4 8 8 9" /><line x1="15" y1="14" x2="21" y2="13" /><line x1="21" y1="13" x2="23" y2="9" /><line x1="21" y1="21" x2="16" y2="27" /><line x1="21" y1="21" x2="26" y2="27" /></>,
  p_band_ext_rot: <><circle cx="13" cy="5" r="2.2" /><line x1="13" y1="7" x2="13" y2="16" /><line x1="13" y1="11" x2="8" y2="14" /><line x1="13" y1="16" x2="10" y2="25" /><line x1="13" y1="16" x2="18" y2="24" /><line x1="13" y1="11" x2="13" y2="18" /><line x1="13" y1="18" x2="22" y2="18" /><path d="M22 18 Q26 14 24 10" strokeDasharray="2 1.5" /><line x1="24" y1="10" x2="27" y2="9" /></>,
  // ── Priority 1 additions ─────────────────────────────────────────────
  p_bb_decline_bench: <><line x1="5" y1="26" x2="28" y2="20" /><circle cx="9" cy="23" r="2" /><line x1="11" y1="22" x2="22" y2="19" /><line x1="17" y1="18" x2="15" y2="11" /><line x1="22" y1="19" x2="25" y2="12" /><line x1="13" y1="10" x2="27" y2="10" /><line x1="13" y1="8" x2="13" y2="12" /><line x1="27" y1="8" x2="27" y2="12" /></>,
  p_incline_db_fly: <><line x1="7" y1="25" x2="22" y2="14" /><circle cx="12" cy="19" r="2" /><line x1="14" y1="18" x2="20" y2="15" /><path d="M17 16c-3-4-6-5-9-5" /><path d="M20 15c3-3 6-4 9-3" /><line x1="8" y1="11" x2="6" y2="9" /><line x1="28" y1="12" x2="30" y2="10" /></>,
  p_db_tricep_kickback: <><circle cx="9" cy="9" r="2" /><line x1="11" y1="10" x2="21" y2="16" /><line x1="21" y1="16" x2="15" y2="24" /><line x1="21" y1="16" x2="27" y2="24" /><line x1="16" y1="13" x2="19" y2="10" /><line x1="19" y1="10" x2="26" y2="8" /><line x1="25" y1="7" x2="28" y2="7" /></>,
  p_incline_db_curl: <><line x1="8" y1="25" x2="22" y2="14" /><circle cx="11" cy="15" r="2" /><line x1="13" y1="16" x2="17" y2="22" /><line x1="16" y1="19" x2="12" y2="26" /><line x1="11" y1="13" x2="16" y2="14" /><line x1="16" y1="14" x2="21" y2="19" /><line x1="21" y1="19" x2="23" y2="18" /></>,
  p_bb_hip_thrust: <><rect x="3.5" y="16.7" width="10.5" height="3.8" rx="1" fill="#dbeafe" stroke="#5b9df5" strokeWidth="1" /><line x1="6" y1="20.5" x2="6" y2="26.5" /><line x1="12" y1="20.5" x2="12" y2="26.5" /><circle cx="11.5" cy="13.2" r="1.8" /><line x1="13" y1="14" x2="21" y2="17" /><line x1="19" y1="16" x2="22" y2="22" /><line x1="22" y1="22" x2="28" y2="22" /><line x1="17" y1="17" x2="28" y2="17" /><line x1="28" y1="15" x2="28" y2="19" /></>,
  p_db_squat: <><circle cx="16" cy="5" r="2.2" /><line x1="16" y1="7" x2="16" y2="16" /><line x1="16" y1="10" x2="10" y2="14" /><line x1="16" y1="10" x2="22" y2="14" /><rect x="8" y="13" width="3" height="4" rx=".5" /><rect x="21" y="13" width="3" height="4" rx=".5" /><line x1="16" y1="16" x2="11" y2="25" /><line x1="16" y1="16" x2="21" y2="25" /><line x1="9" y1="25" x2="14" y2="25" /><line x1="19" y1="25" x2="24" y2="25" /></>,
  p_bb_row: <><circle cx="10" cy="9" r="2" /><line x1="12" y1="10" x2="21" y2="16" /><line x1="21" y1="16" x2="15" y2="25" /><line x1="21" y1="16" x2="25" y2="25" /><line x1="14" y1="12" x2="13" y2="19" /><line x1="6" y1="17" x2="23" y2="13" /><line x1="6" y1="15" x2="6" y2="19" /><line x1="23" y1="11" x2="23" y2="15" /></>,
  p_deadlift: <><circle cx="13" cy="8" r="2" /><line x1="15" y1="9" x2="20" y2="17" /><line x1="15" y1="9" x2="12" y2="14" /><line x1="20" y1="17" x2="15" y2="25" /><line x1="20" y1="17" x2="23" y2="25" /><line x1="7" y1="21" x2="26" y2="21" /><line x1="7" y1="19" x2="7" y2="23" /><line x1="26" y1="19" x2="26" y2="23" /></>,
  p_walking_lunge: <><circle cx="15" cy="5" r="2.2" /><line x1="15" y1="7" x2="15" y2="16" /><line x1="15" y1="10" x2="10" y2="14" /><line x1="15" y1="10" x2="20" y2="14" /><line x1="15" y1="16" x2="8" y2="24" /><line x1="15" y1="16" x2="22" y2="22" /><line x1="7" y1="24" x2="12" y2="24" /><line x1="22" y1="22" x2="21" y2="27" /></>,
  _fallback: <><circle cx="16" cy="4" r="2.2" /><line x1="16" y1="6.2" x2="16" y2="17" /><line x1="16" y1="10" x2="10" y2="14" /><line x1="10" y1="14" x2="8" y2="13" /><line x1="8" y1="12" x2="8" y2="15" /><line x1="16" y1="17" x2="12" y2="25" /><line x1="16" y1="17" x2="20" y2="25" /></>,
};

const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      try {
        window.lucide.createIcons({ nameAttr: 'data-lucide', rootNode: ref.current });
      } catch(e) {}
    }
  }, [name]);
  return (
    <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <i data-lucide={name} width={size} height={size} color={color} strokeWidth={strokeWidth} />
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MUSCLE DIAGRAM  (inline anatomical SVGs — front + rear)
// ═══════════════════════════════════════════════════════════════════════
const ANATOMY_COLOURS = {
  primary: '#5B8DEF',
  secondary: '#B8A7FF',
  neutral: '#D2D1D1',
};

const DISPLAY_TO_SVG_IDS = {
  'Chest': ['pectoralis_major'],
  'Front Delts': ['anterior_deltoid'],
  'Side Delts': ['lateral_deltoid'],
  'Biceps': ['biceps_brachii'],
  'Forearms': ['forearm_flexors', 'forearm_extensors'],
  'Abs': ['rectus_abdominis'],
  'Obliques': ['external_obliques'],
  'Quads': ['quadriceps'],
  'Calves': ['front_lower_leg', 'gastrocnemius'],
  'Rear Delts': ['posterior_deltoid'],
  'Lats': ['latissimus_dorsi'],
  'Mid Traps': ['middle_trapezius_rhomboids'],
  'Upper Traps': ['upper_trapezius'],
  'Triceps': ['triceps_brachii'],
  'Spinal Erectors': ['erector_spinae'],
  'Glutes': ['gluteus_maximus'],
  'Hamstrings': ['hamstrings'],
};

function MuscleDiagram({ primary = [], secondary = [], size = 'medium' }) {
  const frontRef = useRef(null);
  const rearRef = useRef(null);
  const viewSize = { small: 100, medium: 160, large: 220 }[size] || 160;
  const toSvgIdSet = (names) => new Set(
    (Array.isArray(names) ? names : [])
      .flatMap(name => DISPLAY_TO_SVG_IDS[name] || [])
  );

  useEffect(() => {
    const primaryIds = toSvgIdSet(primary);
    const secondaryIds = toSvgIdSet(secondary);
    [frontRef.current, rearRef.current].forEach(root => {
      if (!root) return;
      const svg = root.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
      }
      root.querySelectorAll('[data-muscle]').forEach(path => {
        const muscleName = path.getAttribute('data-muscle');
        if (primaryIds.has(muscleName)) path.setAttribute('fill', ANATOMY_COLOURS.primary);
        else if (secondaryIds.has(muscleName)) path.setAttribute('fill', ANATOMY_COLOURS.secondary);
        else path.setAttribute('fill', ANATOMY_COLOURS.neutral);
      });
    });
  }, [primary.join('|'), secondary.join('|')]);

  const viewStyle = {
    width: viewSize,
    flex: '0 0 auto',
    lineHeight: 0,
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: Math.max(8, Math.round(viewSize * 0.08)) }}>
      <div ref={frontRef} style={viewStyle} dangerouslySetInnerHTML={{ __html: FRONT_MUSCLE_SVG }} />
      <div ref={rearRef} style={viewStyle} dangerouslySetInnerHTML={{ __html: REAR_MUSCLE_SVG }} />
    </div>
  );
}

const PNG_EXERCISE_ICON_IDS = new Set([
  // Default workout exercises
  'band_row', 'bb_flat_bench', 'bb_incline_bench', 'calf_raises', 'chin_up',
  'cs_db_row', 'db_bench', 'db_floor_press', 'db_row_1arm', 'face_pull', 'farmers_walk',
  'goblet_squat', 'hip_thrust', 'incline_pushups', 'kb_deadlift',
  'pallof_press', 'rdl', 'reverse_fly', 'reverse_lunge', 'sb_ham_curl',
  'single_leg_bal', 'split_squat', 'step_ups', 'suitcase_carry',
  // Preset library exercises
  'p_ab_wheel', 'p_arnold_press', 'p_band_ext_rot',
  'p_barbell_curl', 'p_bb_decline_bench', 'p_bb_hip_thrust', 'p_bb_row',
  'p_bird_dog', 'p_cable_crunch', 'p_cable_fly',
  'p_cable_kickback', 'p_chest_dip', 'p_clamshell', 'p_close_grip_bench',
  'p_concentration_curl', 'p_db_bicep_curl', 'p_db_fly', 'p_db_shoulder_press',
  'p_db_squat', 'p_db_tricep_kickback', 'p_dead_bug', 'p_deadlift',
  'p_donkey_kick', 'p_front_raise',
  'p_hammer_curl', 'p_hanging_knee_raise', 'p_hip_abduction', 'p_incline_db_curl',
  'p_incline_db_fly', 'p_incline_db_press', 'p_lat_pulldown', 'p_lateral_raise',
  'p_leg_extension', 'p_leg_press', 'p_overhead_ext', 'p_plank', 'p_preacher_curl',
  'p_pull_up', 'p_push_up', 'p_rear_delt_fly', 'p_seated_cable_row',
  'p_seated_leg_curl', 'p_shrugs', 'p_side_plank', 'p_skull_crushers',
  'p_straight_arm_pd', 'p_sumo_squat', 'p_t_bar_row', 'p_tricep_dips',
  'p_tricep_pushdown', 'p_walking_lunge', 'p_wall_sit',
  // Iron Series exercises
  'iron_heel_elev_squat', 'iron_bulgarian_split', 'iron_db_row', 'iron_pushup',
  'iron_kas_bridge', 'iron_sl_rdl', 'iron_bw_kickback', 'iron_overhead_tricep',
  'iron_diamond_pushup', 'iron_cyclist_squat', 'iron_fwd_lunge', 'iron_1_5_goblet',
  'iron_squat_pulse', 'iron_lean_lateral', 'iron_bench_dip',
  'iron_b_stance_rdl', 'iron_sumo_dl', 'iron_banded_abduct', 'iron_plank_tap',
  'iron_pronated_row', 'iron_supinated_row', 'iron_pullover', 'iron_zottman',
  'iron_suitcase_squat', 'iron_curtsy_lunge', 'iron_seated_calf',
  'iron_incline_press', 'iron_hip_hinge_hold', 'iron_bw_hyper_ext',
  'iron_front_raise', 'iron_lying_ham_curl', 'iron_lateral_hold',
  'iron_rear_delt_row', 'iron_crossover_stepup', 'iron_squat_hold',
  'iron_frog_pump', 'iron_b_stance_hip_thrust', 'iron_tricep_kickback',
  'iron_shrug', 'iron_glute_bridge',
]);

const ExerciseIcon = ({ id, size = 36 }) => {
  const hasPng = PNG_EXERCISE_ICON_IDS.has(id);
  const paths = EXERCISE_ICONS[id] || EXERCISE_ICONS._fallback;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#f1f7ff',
      border: '1px solid #d9e8fb',
      display: 'flex', overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {hasPng ? (
        <img
          src={`assets/icons/${id}.png?v=${APP_BUILD}`}
          width={size * 0.78}
          height={size * 0.78}
          alt=""
        />
      ) : (
        <svg viewBox="0 0 32 32" width={size * 0.8} height={size * 0.8}
          fill="none" stroke={C.amber} strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round">
          {paths}
        </svg>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// WORKOUT DATA
// ═══════════════════════════════════════════════════════════════════════
const WARMUP = [
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
const STRETCHES = [
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
const STRETCH_LIBRARY = [
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
const WARMUP_GROUPS = [
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
function getWarmupConfig(workout) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  const saved = raw[workout] || [];
  return WARMUP_GROUPS.map((group, i) => saved[i] || group.defaultId[workout] || group.defaultId.A);
}

// Saves a single slot choice.
function saveWarmupChoice(workout, slotIndex, stretchId) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  const saved = raw[workout] ? [...raw[workout]] : WARMUP_GROUPS.map(g => g.defaultId[workout] || g.defaultId.A);
  saved[slotIndex] = stretchId;
  raw[workout] = saved;
  localStorage.setItem('il_warmup_config', JSON.stringify(raw));
}

// Resets one workout's warm-up config to all defaults.
function resetWarmupConfig(workout) {
  const raw = JSON.parse(localStorage.getItem('il_warmup_config') || '{}');
  delete raw[workout];
  localStorage.setItem('il_warmup_config', JSON.stringify(raw));
}

// ─── STRETCH ROUTINE GROUPS ───────────────────────────────────────────────
// 12 slots matching the current STRETCHES order. Each slot has a curated
// options list from STRETCH_LIBRARY. Single global config — not per-workout.
const STRETCH_GROUPS = [
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
function getStretchConfig() {
  const raw = JSON.parse(localStorage.getItem('il_stretch_config') || '[]');
  return STRETCH_GROUPS.map((group, i) => raw[i] || group.defaultId);
}

// Saves a single slot choice to il_stretch_config.
function saveStretchChoice(slotIndex, stretchId) {
  const raw = JSON.parse(localStorage.getItem('il_stretch_config') || '[]');
  const saved = Array.isArray(raw) && raw.length === 12
    ? [...raw]
    : STRETCH_GROUPS.map(g => g.defaultId);
  saved[slotIndex] = stretchId;
  localStorage.setItem('il_stretch_config', JSON.stringify(saved));
}

// Clears the stretch config — next load will use all defaults.
function resetStretchConfig() {
  localStorage.removeItem('il_stretch_config');
}

// Returns a human-readable duration string for a stretch.
function fmtStretchDur(s) {
  if (!s) return '';
  return s.bilateral ? `${s.suggestedSecs}s each side` : `${s.suggestedSecs}s`;
}

// Muscle highlight mapping for MuscleDiagram.
// "primary" = main anatomical area being stretched / mobilised (not activation).
// Only names from DISPLAY_TO_SVG_IDS are valid here.
const STRETCH_MUSCLE_META = {
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
const STRETCH_SCIATICA_IDS = new Set([
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
const STRETCH_CROSS_LEGGED_IDS = new Set([
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

const YT = q => `https://www.youtube.com/results?search_query=${q}`;

const EXERCISES = {
  goblet_squat:       { name: 'Goblet Squat',               muscle: 'Legs',    unit: 'kg',   defaultReps: 8,  defaultSets: 3, repMax: 8,  cue: '2 sec down, 1 sec pause, drive up. Use KB or DB held at chest.',                                                                   demoId: '7-80HiXX1K8', demo: YT('goblet+squat+tutorial+form+how+to') },
  db_bench:           { name: 'DB Bench Press',              muscle: 'Push',    unit: 'kg',   defaultReps: 8,  defaultSets: 3, repMax: 8,  cue: 'Elbows 30–45° from body, not flared. Flat or slight incline — choose what shoulders tolerate best.',                                demoId: 'ufl6HV5NN9g', demo: YT('dumbbell+bench+press+form+tutorial') },
  db_row_1arm:        { name: 'One-Arm DB Row',              muscle: 'Pull',    unit: 'kg',   defaultReps: 10, defaultSets: 3, repMax: 10, cue: 'Bench-supported. Torso parallel to floor. No twisting.',                               perSide: true,              demoId: 'H8jf3DwlIlo', demo: YT('one+arm+dumbbell+row+proper+form+tutorial') },
  step_ups:           { name: 'Step-Ups',                    muscle: 'Legs',    unit: 'kg',   defaultReps: 8,  defaultSets: 3, repMax: 8,  cue: 'Drive through heel. Control descent. Bodyweight or light load.',                        perSide: true, canBW: true, demoId: '5ksu8nrdVIE', demo: YT('step+ups+exercise+proper+form+tutorial') },
  pallof_press:       { name: 'Pallof Press',                muscle: 'Core',    unit: 'band', defaultReps: 10, defaultSets: 2, repMax: 10, cue: 'Anti-rotation. Brace core. Resist the pull.',                                           perSide: true,              demoId: 'i0EJHxQC79c', demo: YT('pallof+press+tutorial+how+to+anti+rotation') },
  kb_deadlift:        { name: 'KB Deadlift (Raised Height)', muscle: 'Hinge',   unit: 'kg',   defaultReps: 8,  defaultSets: 3, repMax: 8,  cue: 'KB on plates/platform to reduce depth. Neutral spine. Push the floor away. Conservative — do not rush depth progression.',           demoId: 'mtWrHZo54cg', demo: YT('kettlebell+deadlift+form+tutorial+beginners'), caution: 'Slipped disc — stop immediately if lower back pain or any sensation radiating down your legs.' },
  hip_thrust:         { name: 'Hip Thrust / Glute Bridge',   muscle: 'Glutes',  unit: 'kg',   defaultReps: 10, defaultSets: 3, repMax: 10, cue: 'Start bodyweight. Add DB/KB across hips when comfortable. Full hip extension at top.',                        canBW: true, demoId: 'fv6EfDZ0E28', demo: YT('hip+thrust+glute+bridge+form+tutorial') },
  incline_pushups:    { name: 'Incline Push-Ups',            muscle: 'Push',    unit: 'bw',   defaultReps: 8,  defaultSets: 3, repMax: 12, cue: 'Hands on bench. Stop 1–2 reps before failure. Lower incline gradually as strength improves.',                                       demoId: 'o-3rhEHTDhg', demo: YT('incline+push+ups+form+tutorial+how+to') },
  band_row:           { name: 'Band Row',                    muscle: 'Pull',    unit: 'band', defaultReps: 12, defaultSets: 3, repMax: 12, cue: 'Squeeze shoulder blades down and back. Control the return.',                                                                        demoId: 'LSkyinhmA8k', demo: YT('resistance+band+row+exercise+form+tutorial') },
  suitcase_carry:     { name: 'Suitcase Carry / Hold',       muscle: 'Core',    unit: 'kg',   defaultReps: null, defaultDuration: 25, defaultSets: 4, repMax: null, cue: 'Stand tall, do not lean. Walk 5m down and back, or hold if no space.',  isTimed: true, perSide: true, demoId: '9xjSFwKIehY', demo: YT('suitcase+carry+exercise+form+tutorial+core') },
  split_squat:        { name: 'Split Squat',                 muscle: 'Legs',    unit: 'kg',   defaultReps: 8,  defaultSets: 3, repMax: 8,  cue: 'Shallow range if hips/knees complain. Bodyweight first, then add load.',                 perSide: true, canBW: true, demoId: 'zCsZwLeXrCg', demo: YT('split+squat+how+to+form+tutorial+beginners') },
  db_floor_press:     { name: 'DB Floor Press',              muscle: 'Push',    unit: 'kg',   defaultReps: 9,  defaultSets: 3, repMax: 10, cue: 'Shoulder-friendly: limited range on floor. Keep elbows at 45°.',                                                                    demoId: 'UBmpZ7l5Nlk', demo: YT('dumbbell+floor+press+form+tutorial') },
  cs_db_row:          { name: 'Chest-Supported DB Row',      muscle: 'Pull',    unit: 'kg',   defaultReps: 10, defaultSets: 3, repMax: 10, cue: 'Face down on incline bench. No momentum. Full scapular retraction.',                                                                demoId: '09wri23R4SU', demo: YT('chest+supported+dumbbell+row+incline+bench+tutorial') },
  sb_ham_curl:        { name: 'Swiss Ball Hamstring Curl',   muscle: 'Legs',    unit: 'bw',   defaultReps: 8,  defaultSets: 3, repMax: 10, cue: 'Small range to start. Swap for glute bridge if cramping occurs.',                                                                   demoId: 'XkESHgkTdFw', demo: YT('swiss+ball+hamstring+curl+tutorial+how+to') },
  calf_raises:        { name: 'Calf Raises',                 muscle: 'Legs',    unit: 'bw',   defaultReps: 12, defaultSets: 2, repMax: 15, cue: 'Full range, slow descent. Can add weight when easy.',                                                                               demoId: 'QgrGg9pGSZ8', demo: YT('calf+raises+proper+form+tutorial') },
  single_leg_bal:     { name: 'Single-Leg Balance',          muscle: 'Balance', unit: 'bw',   defaultReps: null, defaultDuration: 25, defaultSets: 2, repMax: null, cue: '20–30 sec each side. Eyes closed to progress.',                   isTimed: true, perSide: true, demoId: 'Dtgh2_LFkBQ', demo: YT('single+leg+balance+exercise+tutorial+proprioception') },
  bb_flat_bench:      { name: 'Barbell Flat Bench Press',    muscle: 'Push',    unit: 'kg',   defaultReps: 6,   defaultSets: 3, repMax: 8,  cue: 'Elbows 45° from body. Bar lowers to mid-chest. Drive up explosively. Use safety pins or spotter.', demoId: 'M7OU_kSMzhs', demo: YT('barbell+bench+press+proper+form+tutorial') },
  bb_incline_bench:   { name: 'Barbell Incline Bench Press', muscle: 'Push',    unit: 'kg',   defaultReps: 6,   defaultSets: 3, repMax: 8,  cue: 'Low incline only (20–30°). Higher angles approach overhead press — avoid for shoulder bursitis. Elbows at 45°.', demoId: 'nK_2opu-_RE', demo: YT('barbell+incline+bench+press+form+tutorial'), caution: 'Shoulder bursitis — low incline only (20–30°). Stop if you feel any shoulder impingement.' },
  chin_up:            { name: 'Chin-Up',                     muscle: 'Pull',    unit: 'bw',   defaultReps: 4,   defaultSets: 3, repMax: 8,  cue: 'Underhand grip, shoulder-width or narrower only. No wide grip — aggravates shoulder bursitis. Start with band assistance or negatives. Full hang, chin over bar.', canBW: true, pullupTracking: true, demoId: '8q9dUmZTLVc', demo: YT('chin+up+form+band+assisted+beginners+underhand'), caution: 'Shoulder bursitis — shoulder-width or narrower grip only. No wide grip. Stop if impingement.' },
  face_pull:          { name: 'Face Pull',                   muscle: 'Pull',    unit: 'band', defaultReps: 15,  defaultSets: 3, repMax: 20, cue: 'Band at face height. Pull to forehead, elbows high and wide. Finish with external rotation. Essential for shoulder health.', demoId: 'OIMUU2Q-upU', demo: YT('face+pull+band+form+shoulder+health+tutorial') },
  reverse_fly:        { name: 'Reverse Fly',                 muscle: 'Pull',    unit: 'kg',   defaultReps: 15,  defaultSets: 3, repMax: 15, cue: 'Hinge forward or lie face-down on incline bench. Light weight only. Lead with elbows back and out. Rear delts, not traps.', demoId: '3ab5egHsnRk', demo: YT('reverse+fly+rear+delt+dumbbell+form+tutorial') },
  rdl:                { name: 'Romanian Deadlift',           muscle: 'Hinge',   unit: 'kg',   defaultReps: 8,   defaultSets: 3, repMax: 10, cue: 'Neutral spine throughout — no rounding. Hinge at hips, soft knee bend. Bar stays close to legs. Stop well before hamstring pull. Conservative range.', demoId: 'amLSSb8cXok', demo: YT('romanian+deadlift+form+tutorial+neutral+spine+beginners'), caution: 'Slipped disc — neutral spine only, no rounding. Stop before any lower back tightness or hamstring pull.' },
  reverse_lunge:      { name: 'Reverse Lunge',               muscle: 'Legs',    unit: 'kg',   defaultReps: 8,   defaultSets: 3, repMax: 10, cue: 'Step back, lower rear knee toward floor. Torso upright. Drive through front heel to return. Safer for lower back than forward lunges.', perSide: true, canBW: true, demoId: 'ufjvjxrGyFM', demo: YT('reverse+lunge+proper+form+dumbbell+tutorial') },
  farmers_walk:       { name: "Farmer's Walk",               muscle: 'Core',    unit: 'kg',   defaultReps: null, defaultDuration: 20, defaultSets: 3, repMax: null, cue: 'Stand tall, brace core hard, do not lean. Walk 5m each way. KB or DB. Builds anti-lateral-flexion core strength and grip.', isTimed: true, demoId: '4d-4gKn_lKk', demo: YT('farmers+walk+exercise+form+core+grip+tutorial') },
};

const WORKOUTS = {
  A: {
    title: 'Push — Chest · Shoulders · Triceps',
    exercises: [
      'bb_flat_bench',      // Chest / Triceps
      'p_db_fly',           // Chest / Shoulders — isolation, fills chest gap
      'p_db_shoulder_press',// Shoulders / Triceps
      'p_lateral_raise',    // Shoulders — lateral head
      'p_rear_delt_fly',    // Shoulders / Back — balances pushing, shoulder health
      'p_band_ext_rot',     // Shoulders — rotator cuff, critical for bursitis
      'p_close_grip_bench', // Triceps / Chest
      'p_tricep_pushdown',  // Triceps — band, door anchor
    ],
    finisher: [
      { id: 'fin_wall_slides', text: 'Wall slides — 2 × 6 slow (pain-free only)' },
      { id: 'fin_pull_aparts', text: 'Band pull-aparts — 2 × 12' },
    ],
  },
  B: {
    title: 'Pull — Back · Biceps · Hinge',
    exercises: [
      'kb_deadlift',        // Hinge / Glutes — raised height
      'cs_db_row',          // Back / Biceps — chest supported
      'reverse_fly',        // Back / Shoulders — rear delt, posterior chain
      'face_pull',          // Shoulders / Back — band, door anchor, shoulder health
      'p_straight_arm_pd',  // Back / Shoulders — lat isolation, door anchor high hook
      'p_db_bicep_curl',    // Biceps / Forearms
      'p_hammer_curl',      // Biceps / Forearms — neutral grip
    ],
    finisher: [
      { id: 'fin_ham_floss',   text: 'Hamstring floss (band, lying) — 45 sec each side' },
      { id: 'fin_childs_pose', text: "Child's pose breathing — 60 sec" },
    ],
  },
  C: {
    title: 'Legs + Core',
    exercises: [
      'goblet_squat',       // Legs / Glutes
      'p_sumo_squat',       // Legs / Glutes — inner thigh, previously untrained
      'rdl',                // Hinge / Glutes
      'hip_thrust',         // Glutes / Legs
      'reverse_lunge',      // Legs / Glutes
      'sb_ham_curl',        // Legs / Core — hamstring isolation
      'p_cable_kickback',   // Glutes / Legs — ankle strap, door anchor low hook
      'calf_raises',        // Legs — previously untrained
      'p_dead_bug',         // Core — deep abs, spine neutral, safe for lower back
      'p_plank',            // Core — isometric abs, full body stability
      'pallof_press',       // Core — anti-rotation, band
      'farmers_walk',       // Core / Forearms
    ],
    finisher: [
      { id: 'fin_ext_rotation', text: 'Band external rotation — 2 × 10 each side' },
      { id: 'fin_single_leg',   text: 'Single-leg balance — 30 sec each side' },
    ],
  },
};

// ─── IRON SERIES WORKOUTS — 30-day dumbbell programme ──────────────────────
// ytId: direct YouTube video ID. supersets: adjacent exercise index pairs.
// equipment: items to set up before starting (sourced from original video descriptions).
const IRON_WORKOUTS = [
  { day: 1,  title: 'Legs',                      ytId: 'SCxNnWW2zB8', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Yoga Block'],   exercises: ['iron_heel_elev_squat', 'rdl', 'split_squat', 'iron_bulgarian_split', 'p_sumo_squat'] },
  { day: 2,  title: 'Upper Body',                 ytId: 'tczVC2rRO7U', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_shoulder_press', 'iron_db_row', 'db_bench', 'p_lateral_raise', 'iron_pushup'] },
  { day: 3,  title: 'Glutes',                     ytId: '2Qd-LJNJYWA', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['hip_thrust', 'iron_kas_bridge', 'iron_sl_rdl', 'p_sumo_squat', 'iron_bw_kickback'] },
  { day: 4,  title: 'Full Body Circuits',         ytId: 'xVj2Q2_2EJY', format: '9 moves × 3 rounds / 40s work / 20s rest', defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'],                     exercises: ['iron_db_row', 'reverse_lunge', 'rdl', 'db_bench', 'p_db_shoulder_press', 'iron_heel_elev_squat', 'p_hammer_curl', 'p_skull_crushers', 'db_row_1arm'] },
  { day: 5,  title: 'Arms & Abs',                 ytId: 'U-OYrmX2-k0', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_bicep_curl', 'iron_overhead_tricep', 'p_hammer_curl', 'iron_diamond_pushup', 'p_plank'] },
  { day: 6,  title: 'Quads',                      ytId: 'UBlcDuodQXM', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'],                     exercises: ['iron_heel_elev_squat', 'iron_cyclist_squat', 'iron_fwd_lunge', 'iron_1_5_goblet', 'iron_squat_pulse'] },
  { day: 7,  title: 'Shoulders & Triceps',        ytId: '0i5RILMI1Mk', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'],                  exercises: ['p_lateral_raise', 'iron_lean_lateral', 'iron_bench_dip', 'p_skull_crushers', 'p_rear_delt_fly'] },
  { day: 8,  title: 'Glutes & Hamstrings',        ytId: 'CFF4vI0oGPg', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['rdl', 'hip_thrust', 'iron_b_stance_rdl', 'iron_sumo_dl', 'iron_banded_abduct'] },
  { day: 9,  title: 'Full Body Cardio',           ytId: 'BAtaHTTyfPI', format: 'Continuous interval circuit',              defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['iron_db_row', 'goblet_squat', 'reverse_lunge', 'iron_plank_tap'] },
  { day: 10, title: 'Back & Biceps',              ytId: 'xPxCcwG56Po', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['iron_pronated_row', 'iron_supinated_row', 'p_hammer_curl', 'iron_pullover', 'iron_zottman'] },
  { day: 11, title: 'Legs + Calves',              ytId: 'g4_muCNsPdk', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'],                     exercises: ['iron_suitcase_squat', 'iron_curtsy_lunge', 'rdl', 'calf_raises', 'iron_seated_calf'] },
  { day: 12, title: 'Chest & Triceps',            ytId: 'Hww8Y6GxVbw', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'],                  exercises: ['db_bench', 'iron_incline_press', 'p_db_fly', 'p_close_grip_bench', 'iron_bench_dip'] },
  { day: 13, title: 'Posterior Chain',            ytId: 'ZQfJ36EXX2s', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['rdl', 'db_row_1arm', 'iron_hip_hinge_hold', 'hip_thrust', 'iron_bw_hyper_ext'] },
  { day: 14, title: 'Unilateral Full Body',       ytId: 'KAEALlzcMcQ', format: '4 × 60s per side',                         defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'],                  exercises: ['db_row_1arm', 'iron_sl_rdl', 'step_ups', 'p_db_shoulder_press'] },
  { day: 15, title: 'Shoulders',                  ytId: 'xbtAVsMdVSY', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_shoulder_press', 'p_lateral_raise', 'iron_front_raise', 'iron_rear_delt_row', 'iron_lateral_hold'] },
  { day: 16, title: 'Hamstrings',                 ytId: 'knrmFCI4XiI', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['iron_lying_ham_curl', 'rdl', 'iron_hip_hinge_hold'] },
  { day: 17, title: 'Complete Upper Body',        ytId: '_UFvhXTN2-U', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['iron_db_row', 'db_bench', 'p_db_shoulder_press', 'p_db_bicep_curl', 'iron_overhead_tricep'] },
  { day: 18, title: 'Glutes Supersets',           ytId: 'EN-zuVg4mok', format: 'Supersets — no rest between pairs',         defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['hip_thrust', 'iron_kas_bridge', 'p_sumo_squat', 'iron_squat_pulse', 'iron_b_stance_hip_thrust', 'iron_glute_bridge'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 19, title: 'Full Body Muscle Building',  ytId: 'SjSJU-LOLf8', format: 'Straight sets + supersets mixed',           defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['goblet_squat', 'db_row_1arm', 'db_bench', 'p_hammer_curl'] },
  { day: 20, title: 'Arms, Abs & Core Supersets', ytId: 'B-XyUrXEaCw', format: 'Supersets — 60s on back-to-back moves',     defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_bicep_curl', 'p_hammer_curl', 'iron_overhead_tricep', 'iron_tricep_kickback', 'p_dead_bug'], supersets: [[0, 1], [2, 3]] },
  { day: 21, title: 'Legs + Step-ups',            ytId: 'ucTDJRJjFQ4', format: '4 × 60s work / 30s rest',                  defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'],                  exercises: ['step_ups', 'reverse_lunge', 'iron_crossover_stepup', 'goblet_squat'] },
  { day: 22, title: 'Chest & Back Antagonist',    ytId: 'dnHSrYHT0Zk', format: 'Antagonist pairs — push immediately to pull', defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                 exercises: ['db_bench', 'iron_db_row', 'p_db_fly', 'p_rear_delt_fly', 'p_close_grip_bench', 'iron_pronated_row'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 23, title: 'Glutes & Hamstrings Supersets', ytId: 'K-tLY96Jq6o', format: 'Supersets — extended tension blocks',    defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['rdl', 'iron_hip_hinge_hold', 'hip_thrust', 'iron_glute_bridge', 'p_sumo_squat', 'iron_squat_pulse'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 24, title: 'Full Body Circuits',         ytId: 'LubR2sFpT_E', format: 'Continuous circuit rounds',                defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['goblet_squat', 'iron_db_row', 'p_lateral_raise', 'reverse_lunge', 'iron_diamond_pushup'] },
  { day: 25, title: 'Shoulders Supersets',        ytId: 'ReE9zLhksbc', format: 'Supersets — deltoid continuous fatigue',    defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_shoulder_press', 'p_lateral_raise', 'iron_front_raise', 'iron_rear_delt_row', 'p_rear_delt_fly', 'iron_shrug'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 26, title: 'Legs Circuits',              ytId: 'xefU5YoKMoI', format: 'High density leg circuit',                 defaultSets: 3, defaultDuration: 40, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench'],                  exercises: ['step_ups', 'split_squat', 'iron_squat_hold', 'rdl'] },
  { day: 27, title: 'Upper Body Antagonist',      ytId: 'tfgeRvBRtME', format: 'Antagonist pairs — push vs pull',           defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['iron_db_row', 'db_bench', 'p_lateral_raise', 'iron_rear_delt_row', 'p_hammer_curl', 'iron_tricep_kickback'], supersets: [[0, 1], [2, 3], [4, 5]] },
  { day: 28, title: 'Iron Glutes',                ytId: '9xA0yL0KXkU', format: '4 × constant tension blocks',              defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Chair or Bench', 'Glute Band'],    exercises: ['hip_thrust', 'iron_kas_bridge', 'p_sumo_squat', 'iron_frog_pump'] },
  { day: 29, title: 'Final Full Body',            ytId: 'bOJpvux_klI', format: '4 heavy compound sets per movement',        defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat', 'Yoga Block'],                     exercises: ['iron_heel_elev_squat', 'rdl', 'iron_db_row', 'p_db_shoulder_press', 'suitcase_carry'] },
  { day: 30, title: 'Arms, Abs & Core Finale',    ytId: 'P4cMTLqtRII', format: 'High volume sets + finisher track',         defaultSets: 4, defaultDuration: 60, equipment: ['Dumbbells', 'Exercise Mat'],                                    exercises: ['p_db_bicep_curl', 'iron_overhead_tricep', 'p_hammer_curl', 'p_skull_crushers', 'p_plank'] },
];

// ═══════════════════════════════════════════════════════════════════════
// SUPABASE SYNC
// ═══════════════════════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://bhlbebdmuodscdgcwkyb.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobGJlYmRtdW9kc2NkZ2N3a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDY2MjEsImV4cCI6MjA5MzEyMjYyMX0.0Z6eLhcbVZIuSA9V_l4z9IRPbdrlfAlY6UOh8lvJFDU';
const IRONLOG_UID   = 'ba29275d-ad25-48b4-9d7d-43a5ad8124cf';
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

async function pushSession(session) {
  if (!db) return;
  try {
    await db.from('ironlog_sessions').upsert({
      id: session.id, user_id: IRONLOG_UID,
      workout: session.workout, date: session.date,
      data: session, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (e) { console.warn('IronLog sync (session):', e); }
}

async function pushRide(ride) {
  if (!db) return;
  try {
    await db.from('ironlog_rides').upsert({
      id: ride.id, user_id: IRONLOG_UID,
      data: ride, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (e) { console.warn('IronLog sync (ride):', e); }
}

async function pullSessions(localSessions) {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from('ironlog_sessions')
      .select('data')
      .eq('user_id', IRONLOG_UID)
      .order('date', { ascending: false });
    if (error || !data) return null;
    // Only restore if cloud has more sessions — guards against iOS localStorage purge
    if (shouldRestoreCloud(localSessions, data)) return data.map(r => r.data);
  } catch (e) { console.warn('IronLog restore (sessions):', e); }
  return null;
}

async function pullRides(localRides) {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from('ironlog_rides')
      .select('data')
      .eq('user_id', IRONLOG_UID)
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    if (shouldRestoreCloud(localRides, data)) return data.map(r => r.data);
  } catch (e) { console.warn('IronLog restore (rides):', e); }
  return null;
}

async function pullHealthMetrics() {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from('health_metrics')
      .select('metric, date, value')
      .order('date', { ascending: true });
    if (error || !data || !data.length) return null;
    const result = {
      hrv: [], restingHr: [], steps: [], activeCal: [], cardio: [], sleep: [], bloodOxygen: [],
      sleepDeep: [], sleepRem: [], sleepCore: [], sleepAwake: [], sleepInBed: [], sleepEfficiency: [],
    };
    const keyMap = {
      hrv: 'hrv', resting_hr: 'restingHr', steps: 'steps', active_cal: 'activeCal', cardio: 'cardio', sleep: 'sleep', blood_oxygen: 'bloodOxygen',
      sleep_deep: 'sleepDeep', sleep_rem: 'sleepRem', sleep_core: 'sleepCore', sleep_awake: 'sleepAwake',
      sleep_in_bed: 'sleepInBed', sleep_efficiency: 'sleepEfficiency',
    };
    data.forEach(row => {
      const key = keyMap[row.metric];
      if (key) result[key].push({ date: row.date, value: Number(row.value) });
    });
    return result;
  } catch (e) { console.warn('IronLog restore (health):', e); }
  return null;
}

async function pullWatchWorkouts() {
  if (!db) return { matches: [], workouts: [], samples: [], ecg: [] };
  try {
    const [matchRes, workoutRes, sampleRes, ecgRes] = await Promise.all([
      db.from('ironlog_watch_matches')
        .select('*')
        .order('session_start_at', { ascending: false }),
      db.from('apple_workouts')
        .select('source_id,name,local_date,start_at,end_at,duration_sec,active_energy_kcal,avg_heart_rate,max_heart_rate,intensity')
        .order('start_at', { ascending: false })
        .limit(30),
      db.from('apple_workout_samples')
        .select('*')
        .order('sample_at', { ascending: false })
        .limit(3000),
      db.from('ecg_readings')
        .select('local_date,start_at,classification,average_heart_rate')
        .order('start_at', { ascending: false })
        .limit(5),
    ]);
    if (matchRes.error) console.warn('IronLog restore (watch matches):', matchRes.error);
    if (workoutRes.error) console.warn('IronLog restore (watch workouts):', workoutRes.error);
    if (sampleRes.error) console.warn('IronLog restore (watch samples):', sampleRes.error);
    if (ecgRes.error) console.warn('IronLog restore (ecg):', ecgRes.error);
    return {
      matches: matchRes.data || [],
      workouts: workoutRes.data || [],
      samples: sampleRes.data || [],
      ecg: ecgRes.data || [],
    };
  } catch (e) { console.warn('IronLog restore (watch):', e); }
  return { matches: [], workouts: [], samples: [], ecg: [] };
}

async function pushHealthMetrics(healthData) {
  if (!db) return;
  try {
    const keyMap = {
      hrv: 'hrv', restingHr: 'resting_hr', steps: 'steps', activeCal: 'active_cal', cardio: 'cardio', sleep: 'sleep', bloodOxygen: 'blood_oxygen',
      sleepDeep: 'sleep_deep', sleepRem: 'sleep_rem', sleepCore: 'sleep_core', sleepAwake: 'sleep_awake',
      sleepInBed: 'sleep_in_bed', sleepEfficiency: 'sleep_efficiency',
    };
    const rows = [];
    const now = new Date().toISOString();
    Object.entries(keyMap).forEach(([stateKey, metricName]) => {
      (healthData[stateKey] || []).forEach(r => {
        if (r?.date && Number.isFinite(Number(r.value))) {
          rows.push({ metric: metricName, date: r.date, value: Number(r.value), updated_at: now });
        }
      });
    });
    if (!rows.length) return;
    await db.from('health_metrics').upsert(rows, { onConflict: 'metric,date' });
  } catch (e) { console.warn('IronLog sync (health):', e); }
}

// ═══════════════════════════════════════════════════════════════════════
// STORAGE  (localStorage — works in any browser)
// ═══════════════════════════════════════════════════════════════════════
async function load(key) {
  try { return safeParse(localStorage.getItem(key), null); }
  catch { return null; }
}
async function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════
const pad = n => String(n).padStart(2, '0');
const fmtTimer = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fmtDate = iso => new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShortDate = iso => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

function nextWorkout(sessions) {
  const done = sessions.filter(s => s.completed);
  if (!done.length) return 'A';
  const last = done[done.length - 1].workout;
  return { A: 'B', B: 'C', C: 'A' }[last] || 'A';
}

function nextIronDay(sessions) {
  const done = sessions.filter(s => s.completed && s.workout?.startsWith('IRON_'));
  if (!done.length) return 1;
  const last = done[done.length - 1].workout;
  const lastDay = parseInt(last.split('_')[1], 10);
  return lastDay >= 30 ? 1 : lastDay + 1;
}

function getIronWorkout(day) {
  return IRON_WORKOUTS.find(w => w.day === day) || IRON_WORKOUTS[0];
}

function workoutDisplay(sess) {
  const isIron = sess?.workout?.startsWith('IRON_');
  if (!isIron) return {
    badge: sess?.workout || '',
    title: WORKOUTS[sess?.workout]?.title || sess?.workout || '',
  };
  const day = parseInt(sess.workout.split('_')[1], 10);
  return {
    badge: `🔩 ${day}`,
    title: `Iron Series — Day ${day}`,
    subtitle: getIronWorkout(day).title,
  };
}

function getLastLogged(sessions, exId) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ex = sessions[i].exercises?.find(e => e.id === exId);
    if (ex?.sets?.length) return ex;
  }
  return null;
}

function buildSession(workoutKey, prevSessions, allExercises = EXERCISES, workoutCustom = {}, workoutHidden = {}, preStartSwaps = {}) {
  if (workoutKey?.startsWith('IRON_')) {
    const dayNum = parseInt(workoutKey.split('_')[1], 10);
    const ironWkt = getIronWorkout(dayNum);
    const exercises = ironWkt.exercises.map(exId => {
      const def = allExercises[exId];
      if (!def) return null;
      const last = getLastLogged(prevSessions, exId);
      const sets = Array.from({ length: ironWkt.defaultSets }, (_, i) => {
        const ls = last?.sets?.[i] || last?.sets?.[0];
        return {
          weight: ls?.weight ?? '',
          reps: ls?.reps ?? (def.defaultReps || ''),
          duration: '',
          rpe: null, pain: null, done: false,
        };
      });
      return { id: exId, sets, notes: '' };
    }).filter(Boolean);
    return {
      id: Date.now().toString(),
      workout: workoutKey,
      date: new Date().toISOString(),
      startTime: Date.now(),
      energy: null,
      exercises,
      notes: '',
      completed: false,
      phase: 'energy',
      currentExerciseIndex: 0,
    };
  }

  const wkt = WORKOUTS[workoutKey];
  const extraIds = workoutCustom[workoutKey] || [];
  const hiddenIds = new Set(workoutHidden[workoutKey] || []);
  // Apply swaps: replace flagged IDs with their chosen replacements
  const rawIds = [...wkt.exercises, ...extraIds].filter(id => !hiddenIds.has(id));
  const swappedIds = rawIds.map(id => preStartSwaps[id] || id);
  // Deduplicate (swap target may already appear in custom extras)
  const exerciseIds = [...new Set(swappedIds)];
  const exercises = exerciseIds.map(exId => {
    const def = allExercises[exId] || EXERCISES[exId];
    if (!def) return null;
    const last = getLastLogged(prevSessions, exId);
    const numSets = last?.sets?.length || def.defaultSets;
    const sets = Array.from({ length: numSets }, (_, i) => {
      const ls = last?.sets?.[i] || last?.sets?.[0];
      const base = {
        weight: ls?.weight ?? '',
        reps: ls?.reps ?? (def.defaultReps || ''),
        duration: ls?.duration ?? (def.defaultDuration || ''),
        rpe: null, pain: null, done: false,
      };
      if (def.pullupTracking) {
        base.mode = ls?.mode ?? 'bw';
        base.band = ls?.band ?? '';
      }
      return base;
    });
    return { id: exId, sets, notes: '' };
  }).filter(Boolean);
  return {
    id: Date.now().toString(),
    workout: workoutKey,
    date: new Date().toISOString(),
    startTime: Date.now(),
    energy: null,
    exercises,
    notes: '',
    completed: false,
    phase: 'energy',
    currentExerciseIndex: 0,
  };
}

function weekStart() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function weekMondayStart() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function computeCoachRecommendation(sessions, rides, override = null) {
  const SWAP_MAP = {
    rdl:           { name: 'Hip Thrust',              id: 'hip_thrust' },
    kb_deadlift:   { name: 'Hip Thrust',              id: 'hip_thrust' },
    p_bb_row:      { name: 'Chest-Supported DB Row',  id: 'cs_db_row' },
    chin_up:       { name: 'Band Row',                id: 'band_row' },
    goblet_squat:  { name: 'Reverse Lunge',           id: 'reverse_lunge' },
  };
  const HINGE_IDS = new Set(['rdl', 'kb_deadlift']);

  const completed = [...sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const last = completed[completed.length - 1] || null;

  // Determine workout
  const workout = override || (last ? ({ A: 'B', B: 'C', C: 'A' }[last.workout] || 'A') : 'A');
  const wkt = WORKOUTS[workout];

  const reasons = [];
  const noteFragments = [];
  const flags = [];

  // Signal: days since last session
  if (last) {
    const daysSince = Math.floor((Date.now() - new Date(last.date)) / 86400000);
    if (daysSince >= 4) {
      noteFragments.push(`${daysSince} days since your last session.`);
      reasons.push(`Last session was ${daysSince} days ago — ease in, RPE 6 max for first two exercises.`);
    }
  }

  // Signal: average RPE last session
  if (last) {
    const doneSets = (last.exercises || []).flatMap(ex => (ex.sets || []).filter(s => s.done));
    const rpeVals = doneSets.map(s => Number(s.rpe)).filter(v => !isNaN(v) && v > 0);
    if (rpeVals.length > 0) {
      const avg = rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length;
      if (avg >= 8) {
        noteFragments.push('High effort last session.');
        reasons.push(`Average RPE was ${avg.toFixed(1)} last session — train at RPE 6–7 today.`);
      }
    }
  }

  // Signal: ride within last 48 hours
  const now = Date.now();
  const recentRide = rides.some(r => (now - new Date(r.date).getTime()) < 48 * 3600000);
  if (recentRide) {
    reasons.push('Rode in the last 48 hours — keep hinge movements light.');
    wkt.exercises.forEach(exId => {
      if (!HINGE_IDS.has(exId)) return;
      if (flags.some(f => f.exerciseId === exId)) return;
      const def = EXERCISES[exId] || PRESET_LIBRARY[exId];
      const sw = SWAP_MAP[exId];
      flags.push({
        exerciseId: exId,
        exerciseName: def?.name || exId,
        modification: 'Rode recently — keep weight raised and light. Prioritise pull movements.',
        swap: sw?.name || null,
        swapId: sw?.id || null,
      });
    });
  }

  // Signal: pain >= 3 on any workout exercise last session
  if (last) {
    (last.exercises || []).forEach(ex => {
      if (!wkt.exercises.includes(ex.id)) return;
      if (flags.some(f => f.exerciseId === ex.id)) return;
      const hasPain = (ex.sets || []).some(s => Number(s.pain) >= 3);
      if (!hasPain) return;
      const def = EXERCISES[ex.id] || PRESET_LIBRARY[ex.id];
      const sw = SWAP_MAP[ex.id];
      flags.push({
        exerciseId: ex.id,
        exerciseName: def?.name || ex.id,
        modification: 'Pain logged last session — keep weight conservative, increase range only if pain-free.',
        swap: sw?.name || null,
        swapId: sw?.id || null,
      });
      reasons.push(`Pain ≥ 3 logged on ${def?.name || ex.id} last session.`);
    });
  }

  // Compose note
  let note;
  if (noteFragments.length === 0 && flags.length === 0) {
    note = 'Good recovery. Train at your planned intensity today.';
  } else if (noteFragments.length > 0 && flags.length > 0) {
    note = noteFragments.join(' ') + ' Some exercises flagged — see adjustments below.';
  } else if (noteFragments.length > 0) {
    note = noteFragments.join(' ') + ' Take it steady today.';
  } else {
    note = 'All signals normal. Some exercises flagged below — review before starting.';
  }

  if (reasons.length === 0) reasons.push('No flags from the last 7 days. Good to go.');

  return { workout, headline: wkt.title, note, reasons, flags };
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH DATA HELPERS
// ═══════════════════════════════════════════════════════════════════════

// Weekly volume for last 6 weeks (Mon–Sun). Volume = weight × reps for done kg sets.
// Includes Iron Series sessions — Iron exercises looked up in IRON_EXERCISES.
function healthWeeklyVolume(sessions) {
  const completed = sessions.filter(s => s.completed);
  const thisMonday = weekMondayStart();
  const weeks = [];
  for (let w = 5; w >= 0; w--) {
    const start = new Date(thisMonday.getTime() - w * 7 * 86400000);
    const end   = new Date(start.getTime() + 7 * 86400000);
    const label = w === 0 ? 'Now' : `W-${w}`;
    const volume = completed
      .filter(s => { const d = new Date(s.date); return d >= start && d < end; })
      .reduce((total, s) =>
        total + (s.exercises || []).reduce((t2, ex) => {
          const def = EXERCISES[ex.id] || PRESET_LIBRARY[ex.id] || IRON_EXERCISES[ex.id] || {};
          if (def.unit !== 'kg') return t2;
          return t2 + ex.sets.filter(set => set.done).reduce((t3, set) =>
            t3 + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
        }, 0), 0);
    weeks.push({ label, volume, isCurrent: w === 0 });
  }
  return weeks;
}

// Volume this week split by workout type: Push (A), Pull (B), Legs+Core (C)
function healthVolumeByGroup(sessions) {
  const weekStart = weekMondayStart();
  const completed = sessions.filter(s => s.completed && !s.workout?.startsWith('IRON_'));
  const groups = { A: 0, B: 0, C: 0 };
  completed
    .filter(s => new Date(s.date) >= weekStart && (s.workout === 'A' || s.workout === 'B' || s.workout === 'C'))
    .forEach(s => {
      const vol = (s.exercises || []).reduce((t, ex) => {
        const def = EXERCISES[ex.id] || PRESET_LIBRARY[ex.id] || {};
        if (def.unit !== 'kg') return t;
        return t + ex.sets.filter(set => set.done).reduce((t2, set) =>
          t2 + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
      }, 0);
      groups[s.workout] = (groups[s.workout] || 0) + vol;
    });
  const labels = { A: 'Push', B: 'Pull', C: 'Legs + Core' };
  const colors  = { A: '#5B8DEF', B: '#1f9d8a', C: '#7c6ee6' };
  return ['A', 'B', 'C']
    .map(k => ({ key: k, label: labels[k], volume: groups[k], color: colors[k] }))
    .filter(g => g.volume > 0)
    .sort((a, b) => b.volume - a.volume);
}

// 28-day consistency: trained days heatmap + stats
// Format a Date object as YYYY-MM-DD in LOCAL time (not UTC)
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function healthConsistency(sessions) {
  const completed = sessions.filter(s => s.completed);
  // Use local date so a 5am workout doesn't appear on the previous UTC day
  const trainedDates = new Set(
    completed.map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean)
  );
  const now = new Date();
  const todayStr = localDateStr(now);

  // Start from the Monday 4 weeks ago (local calendar) so columns align with M-T-W-T-F-S-S
  const dowOffset = (now.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const start = new Date(now);
  start.setDate(now.getDate() - dowOffset - 21); // Monday 4 weeks ago
  start.setHours(12, 0, 0, 0); // use noon to avoid DST edge cases

  const days = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = localDateStr(d);
    days.push({ dateStr, trained: trainedDates.has(dateStr), isToday: dateStr === todayStr });
  }

  // Streak: count consecutive trained days ending today (or yesterday if today not done yet)
  const todayIdx = days.findIndex(d => d.isToday);
  let startIdx = todayIdx >= 0 ? todayIdx : days.length - 1;
  if (startIdx >= 0 && !days[startIdx].trained) startIdx--; // today not done yet — look from yesterday
  let streak = 0;
  for (let i = startIdx; i >= 0; i--) {
    if (days[i].trained) streak++;
    else break;
  }

  const totalThisMonth = days.filter(d => d.trained).length;
  return { days, streak, totalThisMonth };
}

// kg exercises that hit their all-time max within the last 30 days
function healthRecentPRs(sessions, allExercises) {
  const completed = sessions.filter(s => s.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const exerciseMaxes = {};
  completed.forEach(sess => {
    (sess.exercises || []).forEach(ex => {
      const def = allExercises[ex.id];
      if (!def || def.unit !== 'kg') return;
      const sessionMax = Math.max(0, ...ex.sets.filter(s => s.done).map(s => Number(s.weight) || 0));
      if (!sessionMax) return;
      if (!exerciseMaxes[ex.id] || sessionMax > exerciseMaxes[ex.id].weight) {
        exerciseMaxes[ex.id] = { weight: sessionMax, date: sess.date, name: def.name };
      }
    });
  });
  return Object.values(exerciseMaxes)
    .filter(pr => new Date(pr.date) >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

// Average RPE per session for last 10 completed non-Iron sessions
function healthRPETrend(sessions) {
  return sessions
    .filter(s => s.completed && !s.workout?.startsWith('IRON_'))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10)
    .map(s => {
      const allRpe = (s.exercises || []).flatMap(ex =>
        ex.sets.filter(set => set.done && set.rpe).map(set => Number(set.rpe))
      );
      const avg = allRpe.length ? allRpe.reduce((a, b) => a + b, 0) / allRpe.length : null;
      return { label: s.date?.slice(5, 10) || '', avgRpe: avg ? Math.round(avg * 10) / 10 : null };
    })
    .filter(d => d.avgRpe !== null);
}

const HEALTH_METRICS = [
  { id: 'hrv', key: 'hrv', storage: 'il_health_hrv', title: 'HRV', subtitle: 'Heart Rate Variability', unit: 'ms', type: 'line', days: 30, color: C.green, note: 'Higher HRV usually means better recovery.', avgLine: true },
  { id: 'resting_hr', key: 'restingHr', storage: 'il_health_resting_hr', title: 'Resting HR', subtitle: 'Resting Heart Rate', unit: 'bpm', type: 'line', days: 30, color: C.blue, lowBetter: true },
  { id: 'steps', key: 'steps', storage: 'il_health_steps', title: 'Steps', subtitle: 'Daily Total', unit: 'steps', type: 'bar', days: 14, color: C.green, target: 8000 },
  { id: 'active_cal', key: 'activeCal', storage: 'il_health_active_cal', title: 'Active Calories', subtitle: 'Daily Total', unit: 'kcal', type: 'bar', days: 14, color: C.amber },
  { id: 'blood_oxygen', key: 'bloodOxygen', storage: 'il_health_blood_oxygen', title: 'Blood Oxygen', subtitle: 'SpO2', unit: '%', type: 'line', days: 30, color: C.purple, sparse: true },
  { id: 'cardio', key: 'cardio', storage: 'il_health_cardio', title: 'Cardio Fitness', subtitle: 'VO2 Max Estimate', unit: 'mL/kg/min', type: 'line', days: 180, color: C.purple, sparse: true },
];

function normaliseHealthReading(item, i) {
  if (!item || typeof item !== 'object') throw new Error(`Reading ${i + 1} is not an object.`);
  const date = typeof item.date === 'string' ? item.date.trim().slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Reading ${i + 1} needs a YYYY-MM-DD date.`);
  const value = Number(String(item.value ?? '').trim().replace(/,/g, ''));
  if (!Number.isFinite(value)) throw new Error(`Reading ${i + 1} needs a single numeric value.`);
  return { date, value: Math.round(value * 100) / 100 };
}

function normaliseHealthReadings(input) {
  if (Array.isArray(input)) {
    return input.map(normaliseHealthReading).sort((a, b) => a.date.localeCompare(b.date));
  }

  if (input && typeof input === 'object' && typeof input.dates === 'string' && typeof input.values === 'string') {
    const dates = input.dates.split(/\r?\n/);
    const values = input.values.split(/\r?\n/);
    const rows = [];
    const rowCount = Math.max(dates.length, values.length);
    for (let i = 0; i < rowCount; i++) {
      const date = (dates[i] || '').trim();
      const value = (values[i] || '').trim();
      if (!date && !value) continue;
      if (!date || !value) throw new Error(`Shortcut row ${i + 1} needs both a date and value.`);
      rows.push(normaliseHealthReading({ date, value }, i));
    }
    if (!rows.length) throw new Error('Shortcut JSON did not contain any readings.');
    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }

  throw new Error('JSON must be either an array of {date, value} objects or an object with dates and values strings.');
}

// Parse a Health Auto Export JSON file and return supported metric arrays at once
const HEALTH_EXPORT_MAP = {
  heart_rate_variability: 'hrv',
  hrv:                    'hrv',
  resting_heart_rate:     'restingHr',
  resting_hr:             'restingHr',
  step_count:             'steps',
  steps:                  'steps',
  active_energy:          'activeCal',
  active_calories:        'activeCal',
  blood_oxygen_saturation:'bloodOxygen',
  blood_oxygen:           'bloodOxygen',
  oxygen_saturation:      'bloodOxygen',
  vo2_max:                'cardio',
  vo2max:                 'cardio',
  vo2_maximum:            'cardio',
  cardio:                 'cardio',
  cardio_fitness:         'cardio',
  cardio_fitness_vo2_max: 'cardio',
  oxygen_consumption:     'cardio',
  sleep_analysis:         'sleep',
  sleep:                  'sleep',
  sleep_deep:             'sleepDeep',
  sleep_rem:              'sleepRem',
  sleep_core:             'sleepCore',
  sleep_awake:            'sleepAwake',
  sleep_in_bed:           'sleepInBed',
  sleep_efficiency:       'sleepEfficiency',
};

function healthExportValue(metricName, entry) {
  if (['sleep_analysis', 'sleep', 'sleep_deep', 'sleep_rem', 'sleep_core', 'sleep_awake', 'sleep_in_bed', 'sleep_efficiency'].includes(metricName)) {
    if (metricName === 'sleep_deep') return Number(entry.deep);
    if (metricName === 'sleep_rem') return Number(entry.rem);
    if (metricName === 'sleep_core') return Number(entry.core);
    if (metricName === 'sleep_awake') return Number(entry.awake);
    if (metricName === 'sleep_in_bed') return Number(entry.inBed);
    if (metricName === 'sleep_efficiency') {
      const total = Number(entry.totalSleep ?? entry.asleep);
      const awake = Number(entry.awake);
      const inBed = Number(entry.inBed);
      const denominator = Number.isFinite(inBed) && inBed > 0
        ? inBed
        : (Number.isFinite(total) && Number.isFinite(awake) ? total + awake : null);
      return Number.isFinite(total) && Number.isFinite(denominator) && denominator > 0 ? (total / denominator) * 100 : null;
    }
    const direct = [entry.totalSleep, entry.asleep, entry.sleep, entry.duration, entry.qty];
    for (const candidate of direct) {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const stages = Number(entry.core || 0) + Number(entry.deep || 0) + Number(entry.rem || 0);
    return stages > 0 ? stages : null;
  }

  let value = Number(entry.qty ?? entry.value ?? entry.total ?? entry.average ?? entry.avg);
  if (!Number.isFinite(value)) return null;
  if (metricName === 'active_energy') value = value / 4.184; // kJ → kcal
  if (['blood_oxygen_saturation', 'blood_oxygen', 'oxygen_saturation'].includes(metricName) && value <= 1) value = value * 100;
  return value;
}

function expandSleepExportMetric(metric) {
  if (!['sleep_analysis', 'sleep'].includes(metric.name)) return [metric];
  return [
    metric,
    { ...metric, name: 'sleep_deep' },
    { ...metric, name: 'sleep_rem' },
    { ...metric, name: 'sleep_core' },
    { ...metric, name: 'sleep_awake' },
    { ...metric, name: 'sleep_in_bed' },
    { ...metric, name: 'sleep_efficiency' },
  ];
}

function combineHealthExportEntries(metricName, entries) {
  if (!entries.length || !['sleep_analysis', 'sleep'].includes(metricName)) return entries;
  const byDate = {};
  entries.forEach(entry => {
    byDate[entry.date] = { date: entry.date, value: Math.round(((byDate[entry.date]?.value || 0) + Number(entry.value)) * 10) / 10 };
  });
  return Object.values(byDate);
}

function parseHealthAutoExport(parsed) {
  const metrics = parsed?.data?.metrics;
  if (!Array.isArray(metrics)) return null; // not this format
  const result = {};
  metrics.flatMap(expandSleepExportMetric).forEach(metric => {
    const key = HEALTH_EXPORT_MAP[metric.name];
    if (!key) return;
    const entries = (metric.data || [])
      .map(entry => {
        const date = typeof entry.date === 'string' ? entry.date.slice(0, 10) : '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        const value = healthExportValue(metric.name, entry);
        if (!Number.isFinite(value)) return null;
        return { date, value: Math.round(value * 10) / 10 };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
    const combined = combineHealthExportEntries(metric.name, entries);
    if (combined.length) result[key] = combined;
  });
  return Object.keys(result).length ? result : null;
}

function mergeHealthReadings(existing, incoming) {
  const byDate = {};
  (existing || []).forEach(r => {
    if (r?.date && Number.isFinite(Number(r.value))) byDate[r.date] = { date: r.date, value: Number(r.value) };
  });
  incoming.forEach(r => { byDate[r.date] = r; });
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function lastNDaysReadings(readings, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (days - 1) * 86400000);
  return (readings || []).filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d >= start && d <= today;
  });
}

function healthSevenDayTrend(readings) {
  const recent = lastNDaysReadings(readings, 14);
  const prev = recent.slice(0, Math.max(0, recent.length - 7));
  const last = recent.slice(-7);
  const avg = arr => arr.length ? arr.reduce((s, r) => s + Number(r.value), 0) / arr.length : null;
  const prevAvg = avg(prev);
  const lastAvg = avg(last);
  if (prevAvg == null || lastAvg == null) return null;
  return Math.round((lastAvg - prevAvg) * 10) / 10;
}

function healthWorkoutCorrelation(sessions, hrvReadings) {
  const byDate = new Map((hrvReadings || []).map(r => [r.date, Number(r.value)]));
  const trained = new Set(sessions.filter(s => s.completed).map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean));
  const recent = lastNDaysReadings(hrvReadings, 30).filter(r => byDate.has(r.date));
  const workout = recent.filter(r => trained.has(r.date)).map(r => Number(r.value));
  const rest = recent.filter(r => !trained.has(r.date)).map(r => Number(r.value));
  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
  const workoutAvg = avg(workout);
  const restAvg = avg(rest);
  if (workoutAvg == null || restAvg == null || !restAvg) return null;
  return {
    workoutAvg: Math.round(workoutAvg * 10) / 10,
    restAvg: Math.round(restAvg * 10) / 10,
    pct: Math.round(((workoutAvg - restAvg) / restAvg) * 100),
  };
}

// "2026-05-30" → "May 30"
function fmtHealthDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

// HRV recovery status relative to rolling average
function hrvStatus(latest, avg) {
  if (!latest || !avg) return null;
  const ratio = latest / avg;
  if (ratio >= 1.05) return { label: 'GOOD', color: C.green };
  if (ratio >= 0.88) return { label: 'FAIR', color: C.amber };
  return { label: 'LOW', color: C.red };
}

function HealthLineChart({ data, metric, height = 136, trainedDates }) {
  const vals = data.map(d => Number(d.value)).filter(Number.isFinite);
  if (!vals.length) return null;
  const W = 320, H = height, pad = { top: 14, right: 14, bottom: 28, left: 34 };
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
  const span = rawMax === rawMin ? 1 : rawMax - rawMin;
  const yMin = rawMin - span * 0.12;
  const yMax = rawMax + span * 0.12;
  const xOf = i => pad.left + (data.length < 2 ? 0.5 : i / (data.length - 1)) * (W - pad.left - pad.right);
  const yOf = v => pad.top + (H - pad.top - pad.bottom) - ((v - yMin) / (yMax - yMin)) * (H - pad.top - pad.bottom);
  const points = data.map((d, i) => `${xOf(i)},${yOf(Number(d.value))}`);
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const avgY = yOf(avg);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }}>
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke={C.border} />
      <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke={C.border} />
      {metric.avgLine && (
        <>
          <line x1={pad.left} y1={avgY} x2={W - pad.right} y2={avgY} stroke={C.muted} strokeDasharray="4,4" />
          <text x={W - pad.right} y={avgY - 4} fill={C.muted} fontSize={8} textAnchor="end" fontFamily={C.fMono}>avg</text>
        </>
      )}
      {points.length >= 2 && <polyline points={points.join(' ')} fill="none" stroke={metric.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
      {data.map((d, i) => {
        const val = Number(d.value);
        const better = metric.lowBetter ? val <= avg : val >= avg;
        const fill = metric.avgLine ? (better ? C.green : val < avg * 0.85 ? C.red : C.amber) : metric.color;
        const isWorkout = trainedDates?.has(d.date);
        return (
          <g key={d.date}>
            <circle cx={xOf(i)} cy={yOf(val)} r={4} fill={fill} />
            {isWorkout && <polygon points={`${xOf(i)},${H - pad.bottom + 6} ${xOf(i) - 4},${H - pad.bottom + 14} ${xOf(i) + 4},${H - pad.bottom + 14}`} fill={C.amber} opacity={0.8} />}
          </g>
        );
      })}
      <text x={pad.left} y={11} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{Math.round(yMax * 10) / 10}</text>
      {data.length > 1 && (
        <>
          <text x={pad.left} y={H - 3} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{fmtHealthDate(data[0].date)}</text>
          <text x={W - pad.right} y={H - 3} fill={C.muted} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{fmtHealthDate(data[data.length - 1].date)}</text>
        </>
      )}
    </svg>
  );
}

function HealthBarChart({ data, metric, height = 136, trainedDates }) {
  const vals = data.map(d => Number(d.value)).filter(Number.isFinite);
  if (!vals.length) return null;
  const W = 320, H = height, pad = { top: 12, right: 12, bottom: 28, left: 28 };
  const target = metric.target;
  const maxVal = Math.max(...vals, target || 0, 1);
  const innerH = H - pad.top - pad.bottom;
  const yOf = v => pad.top + innerH - (v / maxVal) * innerH;
  const gap = 4;
  const barW = ((W - pad.left - pad.right) - gap * (data.length - 1)) / Math.max(data.length, 1);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }}>
      <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke={C.border} />
      {target && (
        <>
          <line x1={pad.left} y1={yOf(target)} x2={W - pad.right} y2={yOf(target)} stroke={C.muted} strokeDasharray="4,4" />
          <text x={W - pad.right} y={yOf(target) - 4} fill={C.muted} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{target.toLocaleString()}</text>
        </>
      )}
      {data.map((d, i) => {
        const val = Number(d.value);
        const cx = pad.left + i * (barW + gap) + barW / 2;
        const x = pad.left + i * (barW + gap);
        const y = yOf(val);
        const ratio = target ? val / target : 1;
        const fill = target ? (ratio >= 1 ? C.green : ratio >= 0.7 ? C.amber : C.red) : metric.color;
        const isWorkout = trainedDates?.has(d.date);
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={Math.max(2, barW)} height={Math.max(2, H - pad.bottom - y)} rx={3} fill={fill} />
            {isWorkout && <polygon points={`${cx},${H - pad.bottom + 6} ${cx - 4},${H - pad.bottom + 14} ${cx + 4},${H - pad.bottom + 14}`} fill={C.amber} opacity={0.8} />}
          </g>
        );
      })}
      <text x={pad.left} y={H - 3} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{fmtHealthDate(data[0].date)}</text>
      <text x={W - pad.right} y={H - 3} fill={C.muted} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{fmtHealthDate(data[data.length - 1].date)}</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DATA EXPORT / IMPORT  (JSON file — works on any device, any host)
// ═══════════════════════════════════════════════════════════════════════
function exportData(data) {
  const payload = JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    sessions: data.sessions,
    rides: data.rides,
    customExercises: data.customExercises,
    workoutCustom: data.workoutCustom,
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `IronLog-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('File is not valid JSON.')); }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}


function FontLoader() {
  useEffect(() => {
    if (document.getElementById('ironlog-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ironlog-fonts'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// PRE-START SCREEN
// ═══════════════════════════════════════════════════════════════════════
function PreStartScreen({ selectedWorkout, coachRec, preStartSwaps, setPreStartSwaps, allExercises, sessions, workoutCustom, workoutHidden, setActiveSession, setView }) {
  const wkt = WORKOUTS[selectedWorkout];
  const extraIds = workoutCustom[selectedWorkout] || [];
  const hiddenIds = new Set((workoutHidden || {})[selectedWorkout] || []);
  const exerciseCount = [...wkt.exercises, ...extraIds].filter(id => !hiddenIds.has(id)).length;

  function handleStartSession() {
    const session = buildSession(selectedWorkout, sessions, allExercises, workoutCustom, workoutHidden, preStartSwaps);
    setActiveSession(session);
    setPreStartSwaps({});
    setView('workout');
  }

  function toggleSwap(flag) {
    setPreStartSwaps(prev => {
      if (prev[flag.exerciseId]) {
        const next = { ...prev };
        delete next[flag.exerciseId];
        return next;
      }
      return { ...prev, [flag.exerciseId]: flag.swapId };
    });
  }

  return (
    <div style={{ padding: '16px 16px 100px', minHeight: '100vh', background: C.bg }}>
      {/* Back */}
      <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: C.fMono, padding: 0, marginBottom: 20, display: 'block' }}>
        ← Back
      </button>

      {/* Workout badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 52, fontFamily: C.fDisplay, fontWeight: 700, color: C.amber, lineHeight: 1, flexShrink: 0 }}>
          {selectedWorkout}
        </div>
        <div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 20, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{wkt.title}</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.fMono, marginTop: 3 }}>{exerciseCount} exercises</div>
        </div>
      </div>

      {/* Flags or all-clear */}
      {coachRec.flags.length === 0 ? (
        <div style={{ ...st.card(), borderLeft: `3px solid ${C.green}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase', color: C.green, letterSpacing: 1, marginBottom: 4 }}>All clear</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Good recovery since last session. No modifications needed.</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...st.label, marginBottom: 10 }}>Today's adjustments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coachRec.flags.map(flag => {
              const isSwapped = !!preStartSwaps[flag.exerciseId];
              const swapDef = isSwapped ? (allExercises[flag.swapId] || EXERCISES[flag.swapId]) : null;
              return (
                <div key={flag.exerciseId} style={{ ...st.card(), borderLeft: `3px solid ${isSwapped ? C.blue : C.amber}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: C.fDisplay, textTransform: 'uppercase', marginBottom: 8 }}>
                    {flag.exerciseName}
                  </div>
                  {isSwapped ? (
                    <div>
                      <div style={{ fontSize: 13, color: C.blue, marginBottom: 8 }}>⇄ Swapped → {swapDef?.name || flag.swap}</div>
                      <button onClick={() => toggleSwap(flag)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11 }}>↩ Undo swap</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, marginBottom: flag.swapId ? 10 : 0 }}>
                        ⚠️ {flag.modification}
                      </div>
                      {flag.swapId && (
                        <button onClick={() => toggleSwap(flag)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 12 }}>
                          ⇄ Swap it out → {flag.swap}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      <button style={{ ...st.btn(), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} onClick={handleStartSession}>
        <Icon name="play" size={16} /> Start Session
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// RECOVERY DASHBOARD — computations + components
// ═══════════════════════════════════════════════════════════════════════

function getLatestReading(readings) {
  return readings?.length ? readings[readings.length - 1] : null;
}
function rollingAvg(readings, days = 14) {
  const recent = lastNDaysReadings(readings, days);
  if (!recent.length) return null;
  return recent.reduce((s, r) => s + Number(r.value), 0) / recent.length;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function readingOnDate(readings, date) {
  return (readings || []).find(r => r?.date === date) || null;
}

function scoreAgainstTarget(value, target, spread, higherBetter = true) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || !Number.isFinite(spread) || spread <= 0) return 50;
  const delta = higherBetter ? value - target : target - value;
  return clamp(50 + (delta / spread) * 15, 0, 100);
}

function scoreSleepComponent(value, target, spread, higherBetter = true) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || !Number.isFinite(spread) || spread <= 0) return 75;
  const delta = higherBetter ? value - target : target - value;
  return clamp(75 + (delta / spread) * 15, 0, 100);
}

function computeSleepScore(healthData) {
  const total = healthData?.sleep || [];
  const latest = getLatestReading(total);
  if (!latest) return null;
  const date = latest.date;
  const totalSleep = Number(latest.value);
  const inBed = Number(readingOnDate(healthData?.sleepInBed, date)?.value);
  const deep = Number(readingOnDate(healthData?.sleepDeep, date)?.value);
  const rem = Number(readingOnDate(healthData?.sleepRem, date)?.value);
  const core = Number(readingOnDate(healthData?.sleepCore, date)?.value);
  const awake = Number(readingOnDate(healthData?.sleepAwake, date)?.value);
  const exportedEfficiency = Number(readingOnDate(healthData?.sleepEfficiency, date)?.value);
  const inferredInBed = Number.isFinite(inBed) && inBed > 0
    ? inBed
    : (Number.isFinite(awake) && Number.isFinite(totalSleep) ? totalSleep + awake : null);
  const efficiency = Number.isFinite(exportedEfficiency)
    ? exportedEfficiency
    : (Number.isFinite(inferredInBed) && inferredInBed > 0 ? (totalSleep / inferredInBed) * 100 : null);

  const total7 = lastNDaysReadings(total, 7).map(r => Number(r.value)).filter(Number.isFinite);
  const deep7 = lastNDaysReadings(healthData?.sleepDeep || [], 7).map(r => Number(r.value)).filter(Number.isFinite);
  const rem7 = lastNDaysReadings(healthData?.sleepRem || [], 7).map(r => Number(r.value)).filter(Number.isFinite);
  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const totalTarget = total7.length >= 3 ? avg(total7) : 7.5;
  const deepTarget = deep7.length >= 3 ? avg(deep7) : 1.1;
  const remTarget = rem7.length >= 3 ? avg(rem7) : 1.5;

  const totalScore = scoreSleepComponent(totalSleep, totalTarget, 1.5, true);
  const efficiencyScore = Number.isFinite(efficiency) ? scoreSleepComponent(efficiency, 88, 8, true) : 75;
  const deepScore = Number.isFinite(deep) ? scoreSleepComponent(deep, deepTarget, 0.45, true) : 75;
  const remScore = Number.isFinite(rem) ? scoreSleepComponent(rem, remTarget, 0.55, true) : 75;
  const awakeScore = Number.isFinite(awake) ? scoreSleepComponent(awake, 0.6, 0.45, false) : 75;

  const score = Math.round(clamp(
    totalScore * 0.35 + efficiencyScore * 0.20 + deepScore * 0.20 + remScore * 0.15 + awakeScore * 0.10,
    0, 100
  ));
  const label = score >= 60 ? 'Good' : score >= 38 ? 'Fair' : 'Low';
  const color = score >= 60 ? C.green : score >= 38 ? C.amber : C.red;
  const parts = [
    Number.isFinite(totalSleep) ? `${Math.round(totalSleep * 10) / 10} h asleep` : null,
    Number.isFinite(deep) ? `${Math.round(deep * 10) / 10} h deep` : null,
    Number.isFinite(rem) ? `${Math.round(rem * 10) / 10} h REM` : null,
    Number.isFinite(awake) ? `${Math.round(awake * 10) / 10} h awake` : null,
  ].filter(Boolean);

  return {
    date, score, label, color, totalSleep, inBed, deep, rem, core, awake, efficiency,
    components: { totalScore, efficiencyScore, deepScore, remScore, awakeScore },
    summary: parts.join(' · '),
    hasStages: [deep, rem, core, awake, inBed, efficiency].some(Number.isFinite),
  };
}

// Recovery score — methodology based on sports science consensus (Buchheit 2014, Plews 2013):
//   • 7-day rolling mean + SD baseline
//   • SD-band z-score: score = clamp(50 + zCombined × 15, 0–100)
//   • Automatically uses a 3-factor formula when sleep data is present,
//     falls back to 2-factor when it isn't (e.g. watch not worn overnight)
//
//   WITH sleep:    HRV 40% + RHR 30% + Sleep 30%  (matches Oura/WHOOP weighting)
//   WITHOUT sleep: HRV 70% + RHR 30%              (estimate only)
function computeRecovery(healthData) {
  const hrv   = healthData?.hrv       || [];
  const rhr   = healthData?.restingHr || [];
  const slp   = healthData?.sleep     || [];
  const sleepScore = computeSleepScore(healthData);

  const todayHRV   = Number(getLatestReading(hrv)?.value) || 0;
  const todayRHR   = Number(getLatestReading(rhr)?.value) || 0;
  const todaySleep = Number(getLatestReading(slp)?.value) || 0;

  const hrv7 = lastNDaysReadings(hrv, 7).map(r => Number(r.value));
  const rhr7 = lastNDaysReadings(rhr, 7).map(r => Number(r.value));
  const slp7 = lastNDaysReadings(slp, 7).map(r => Number(r.value));

  if (hrv7.length < 3 || rhr7.length < 3 || !todayHRV || !todayRHR) return null;

  const avg  = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const sdev = (arr, m) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);

  const mHRV = avg(hrv7);  const sHRV = sdev(hrv7, mHRV) || mHRV * 0.10;
  const mRHR = avg(rhr7);  const sRHR = sdev(rhr7, mRHR) || mRHR * 0.10;

  const zHRV = (todayHRV - mHRV) / sHRV;  // higher HRV = positive = good
  const zRHR = (mRHR - todayRHR) / sRHR;  // lower  RHR = positive = good (inverted)

  // Use sleep if Health Auto Export supplied last night's reading. With <3 nights,
  // it is scored against conservative targets until a personal baseline exists.
  const hasSleep = !!sleepScore && todaySleep > 0;

  let zCombined, formula;
  if (hasSleep) {
    const zSleep = (sleepScore.score - 75) / 15;
    zCombined = zHRV * 0.40 + zRHR * 0.30 + zSleep * 0.30;
    formula   = sleepScore.hasStages ? 'hrv+rhr+sleep-quality' : 'hrv+rhr+sleep-duration';
  } else {
    zCombined = zHRV * 0.70 + zRHR * 0.30;
    formula   = 'hrv+rhr';
  }

  const score = Math.round(clamp(50 + zCombined * 15, 0, 100));
  const label = score >= 60 ? 'Good' : score >= 38 ? 'Fair' : 'Low';
  const color = score >= 60 ? C.green : score >= 38 ? C.amber : C.red;

  return {
    score, label, color, formula,
    todayHRV, todayRHR, todaySleep: hasSleep ? todaySleep : null, sleepScore,
    meanHRV:  Math.round(mHRV * 10) / 10,
    meanRHR:  Math.round(mRHR * 10) / 10,
    zHRV:     Math.round(zHRV * 10) / 10,
    zRHR:     Math.round(zRHR * 10) / 10,
    dataPoints: Math.min(hrv7.length, rhr7.length),
  };
}

// Fatigue — measures accumulated workload, NOT the same signals as recovery score.
// 4 independent components from session data:
//
//  1. Recent density  (0–35 pts): sessions in the last 4 days
//  2. Consecutive run (0–25 pts): days in a row from the LAST session backward
//  3. Recent RPE      (0–25 pts): average effort across last 3 sessions' sets
//  4. Pain flag       (0–15 pts): any pain ≥ 2 logged in last 3 sessions
//
// Low < 30 · Moderate 30–59 · High ≥ 60
function computeFatigue(healthData, sessions) {
  const now = new Date();

  const completedSessions = sessions.filter(s => s.completed);
  const trainedSet = new Set(
    completedSessions.map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean)
  );

  // --- 1. Sessions in the last 4 days (0–35 pts, 9 pts each) ---
  let recent4 = 0;
  for (let i = 0; i < 4; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    if (trainedSet.has(localDateStr(d))) recent4++;
  }
  const densityPts = Math.min(35, recent4 * 9);

  // --- 2. Consecutive days from last training session, counted backward (0–25 pts) ---
  // Counts from the most recent training day, not from today —
  // so a rest day after a training streak doesn't reset the count.
  const sortedTrainDates = [...trainedSet].sort().reverse();
  let consec = 0;
  if (sortedTrainDates.length) {
    const lastTrain = new Date(sortedTrainDates[0] + 'T00:00:00');
    for (let i = 0; i < 14; i++) {
      const d = new Date(lastTrain); d.setDate(lastTrain.getDate() - i);
      if (trainedSet.has(localDateStr(d))) consec++;
      else break;
    }
  }
  const consecPts = Math.min(25, consec * 5);

  // --- 3. Average RPE across all sets in last 3 sessions (0–25 pts) ---
  const last3 = [...completedSessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  const allRPEs = last3.flatMap(s =>
    (s.exercises || []).flatMap(ex =>
      ex.sets.filter(set => set.done && Number(set.rpe) > 0).map(set => Number(set.rpe))
    )
  );
  const avgRPE = allRPEs.length ? allRPEs.reduce((s, v) => s + v, 0) / allRPEs.length : 0;
  // RPE 5 → 0 pts, RPE 7.5 → 12.5 pts, RPE 10 → 25 pts
  const rpePts = avgRPE > 0 ? Math.min(25, Math.max(0, ((avgRPE - 5) / 5) * 25)) : 0;

  // --- 4. Pain flag in last 3 sessions (0–15 pts) ---
  const maxPain = last3.flatMap(s =>
    (s.exercises || []).flatMap(ex =>
      ex.sets.filter(set => set.done).map(set => Number(set.pain) || 0)
    )
  ).reduce((max, v) => Math.max(max, v), 0);
  const painPts = maxPain >= 3 ? 15 : maxPain >= 2 ? 8 : 0;

  const level = Math.min(100, Math.round(densityPts + consecPts + rpePts + painPts));
  const label = level < 30 ? 'Low' : level < 60 ? 'Moderate' : 'High';
  const color = level < 30 ? C.green : level < 60 ? C.amber : C.red;
  return { level, label, color };
}

// Training Load — uses session duration, not volume.
// Volume (sets×reps×weight) breaks for bodyweight/Iron Series sessions where weight≈0.
// Duration is honest across all session types.
// Formula: (this week's total session time / 4-week avg weekly session time) × 50
//   50% = exactly your average week → sits in the Optimal zone
//   75% = 50% above average → High
//   25% = half your average  → Low
// Fallback to active calories if no session history.
function computeTrainingLoad(sessions, activeCal) {
  const DEFAULT_DURATION = 45; // assumed minutes when session has no duration recorded
  const ws = weekMondayStart();
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);

  const weekSessions   = sessions.filter(s => s.completed && new Date(s.date) >= ws);
  const recentSessions = sessions.filter(s => s.completed && new Date(s.date) >= cutoff);

  // Only use the duration method if we have at least 4 completed sessions in history
  if (recentSessions.length >= 4) {
    const weekTime   = weekSessions.reduce((s, sess)   => s + (Number(sess.duration) || DEFAULT_DURATION), 0);
    const totalTime  = recentSessions.reduce((s, sess) => s + (Number(sess.duration) || DEFAULT_DURATION), 0);
    const avgWeekTime = totalTime / 4;
    return Math.min(100, Math.round((weekTime / avgWeekTime) * 50));
  }

  // Fallback: active calories proxy (today vs 7-day rolling average)
  const todayCal = Number(getLatestReading(activeCal)?.value) || 0;
  const avgCal   = rollingAvg(activeCal, 7) || 0;
  if (todayCal && avgCal) return Math.min(100, Math.round((todayCal / avgCal) * 50));
  return null;
}

function computeTrendInsight(healthData) {
  const hrv = healthData?.hrv || [];
  const rhr = healthData?.restingHr || [];
  const tHRV = Number(getLatestReading(hrv)?.value) || 0;
  const bHRV = rollingAvg(hrv, 14) || 0;
  const tRHR = Number(getLatestReading(rhr)?.value) || 0;
  const bRHR = rollingAvg(rhr, 14) || 0;
  if (!tHRV || !bHRV || !tRHR || !bRHR) return null;
  const hrvOk = tHRV >= bHRV * 0.95;
  const rhrOk = tRHR <= bRHR * 1.05;
  if (hrvOk && rhrOk)   return 'HRV is above your average and resting HR is stable. You are ready to train.';
  if (!hrvOk && rhrOk)  return 'HRV is slightly below your average. Consider a moderate session today.';
  if (hrvOk && !rhrOk)  return 'Resting HR is elevated. Listen to your body and consider reducing intensity.';
  return 'HRV is below average and resting HR is elevated. Consider lighter movement or a recovery day.';
}

function summarizeWatchEffort(watchData) {
  const matches = watchData?.matches || [];
  const workouts = watchData?.workouts || [];
  const ecg = watchData?.ecg || [];
  const latestMatch = matches[0] || null;
  const latestWorkout = workouts[0] || null;
  const latestEcg = ecg[0] || null;
  const ws = weekMondayStart();
  const weekMatches = matches.filter(m => new Date(m.session_start_at) >= ws);
  const weekWorkouts = workouts.filter(w => new Date(w.start_at) >= ws);
  const hardCount = weekMatches.filter(m => m.effort_label === 'hard').length;
  const moderateCount = weekMatches.filter(m => m.effort_label === 'moderate').length;
  const totalKcal = weekWorkouts.reduce((s, w) => s + (Number(w.active_energy_kcal) || 0), 0);
  const totalMinutes = weekWorkouts.reduce((s, w) => s + ((Number(w.duration_sec) || 0) / 60), 0);
  return {
    latestMatch,
    latestWorkout,
    latestEcg,
    weekMatches,
    hardCount,
    moderateCount,
    totalKcal: Math.round(totalKcal),
    totalMinutes: Math.round(totalMinutes),
    hasRecentHard: hardCount > 0,
  };
}

function sampleTimeMs(sample) {
  const raw = sample?.sample_at || sample?.start_at || sample?.timestamp || sample?.time || sample?.date;
  const ms = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function sampleHeartRate(sample) {
  const value = sample?.heart_rate ?? sample?.heartRate ?? sample?.avg_heart_rate ?? sample?.value;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sampleValue(sample) {
  const value = sample?.value ?? sample?.qty ?? sample?.quantity ?? sample?.amount;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sampleType(sample) {
  return String(sample?.sample_type || sample?.type || sample?.metric || '').toLowerCase();
}

function sampleSourceId(sample) {
  return sample?.source_id || sample?.workout_source_id || sample?.workout_id || sample?.uuid || null;
}

function matchSourceId(match) {
  return match?.source_id || match?.watch_source_id || match?.workout_source_id || match?.apple_workout_source_id || null;
}

function getSessionWatchMatch(watchData, session) {
  if (!session) return null;
  const matches = watchData?.matches || [];
  const sessionStart = Number(session.startTime) || new Date(session.date).getTime();
  return matches.find(m => {
    if ([m.session_id, m.ironlog_session_id, m.local_session_id].some(id => id && String(id) === String(session.id))) return true;
    const mStart = new Date(m.session_start_at || m.start_at || m.ironlog_start_at || '').getTime();
    return Number.isFinite(mStart) && Number.isFinite(sessionStart) && Math.abs(mStart - sessionStart) < 15 * 60000;
  }) || null;
}

function setWindowMs(set) {
  const start = set?.setStartedAt ? new Date(set.setStartedAt).getTime() : null;
  const end = set?.setCompletedAt ? new Date(set.setCompletedAt).getTime() : null;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

function exerciseWindowMs(exercise) {
  const directStart = exercise?.exerciseStartedAt ? new Date(exercise.exerciseStartedAt).getTime() : null;
  const directEnd = exercise?.exerciseCompletedAt ? new Date(exercise.exerciseCompletedAt).getTime() : null;
  const setWindows = (exercise?.sets || []).map(setWindowMs).filter(Boolean);
  const start = Number.isFinite(directStart) ? directStart : Math.min(...setWindows.map(w => w.start));
  const end = Number.isFinite(directEnd) ? directEnd : Math.max(...setWindows.map(w => w.end));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

function sessionWindowMs(session) {
  if (!session) return null;
  const starts = [Number(session.startTime), session.date ? new Date(session.date).getTime() : null]
    .filter(Number.isFinite);
  const ends = [
    session.completedAt ? new Date(session.completedAt).getTime() : null,
    session.duration && starts.length ? starts[0] + Number(session.duration) * 60000 : null,
  ].filter(Number.isFinite);
  const exerciseWindows = (session.exercises || []).map(exerciseWindowMs).filter(Boolean);
  const start = exerciseWindows.length ? Math.min(starts[0] || Infinity, ...exerciseWindows.map(w => w.start)) : starts[0];
  const end = exerciseWindows.length ? Math.max(ends[0] || 0, ...exerciseWindows.map(w => w.end)) : ends[0];
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

function getWatchWorkoutForSession(watchData, session) {
  if (!watchData || !session) return null;
  const match = getSessionWatchMatch(watchData, session);
  const sourceId = matchSourceId(match);
  const workouts = watchData.workouts || [];
  if (sourceId) {
    const direct = workouts.find(w => String(w.source_id || w.id || '') === String(sourceId));
    if (direct) return direct;
  }
  const sessionWindow = sessionWindowMs(session);
  if (!sessionWindow) return null;
  return workouts.find(w => {
    const start = new Date(w.start_at || w.startAt || '').getTime();
    const end = new Date(w.end_at || w.endAt || '').getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    const overlap = Math.min(sessionWindow.end, end) - Math.max(sessionWindow.start, start);
    return overlap > 10 * 60000;
  }) || null;
}

function watchSourceForSession(watchData, session) {
  const match = getSessionWatchMatch(watchData, session);
  const workout = getWatchWorkoutForSession(watchData, session);
  return matchSourceId(match) || workout?.source_id || null;
}

function filterWorkoutSamples(watchData, { sourceId, type, start, end } = {}) {
  return (watchData?.samples || [])
    .map(sample => ({ sample, t: sampleTimeMs(sample), value: sampleValue(sample), hr: sampleHeartRate(sample), type: sampleType(sample) }))
    .filter(row => {
      if (!row.t) return false;
      if (sourceId && String(sampleSourceId(row.sample)) !== String(sourceId)) return false;
      if (type && row.type !== type) return false;
      if (Number.isFinite(start) && row.t < start) return false;
      if (Number.isFinite(end) && row.t > end) return false;
      return true;
    })
    .sort((a, b) => a.t - b.t);
}

function confidenceFromSamples(sampleCount, minutes, shortWindow = false) {
  if (shortWindow) return { key: 'short', label: 'Timestamp too short', color: C.amber };
  if (sampleCount >= 3 && sampleCount / Math.max(1, minutes) >= 0.6) return { key: 'high', label: 'Good sample', color: C.green };
  if (sampleCount >= 2) return { key: 'medium', label: 'Limited sample', color: C.blue };
  if (sampleCount === 1) return { key: 'low', label: 'Single sample', color: C.amber };
  return { key: 'none', label: 'No Watch sample', color: C.muted };
}

function effortLabel(avgHr, maxHr) {
  if (!Number.isFinite(avgHr) && !Number.isFinite(maxHr)) return { label: 'No effort data', color: C.muted };
  if (maxHr >= 145 || avgHr >= 132) return { label: 'Hard effort', color: C.red };
  if (maxHr >= 130 || avgHr >= 115) return { label: 'Moderate effort', color: C.amber };
  return { label: 'Easy effort', color: C.green };
}

function setEffortStats(set, watchData, sourceId) {
  const window = setWindowMs(set);
  if (!window) return { status: 'missing', confidence: confidenceFromSamples(0, 0), effort: effortLabel(null, null), sampleCount: 0 };
  const durationSec = Math.round((window.end - window.start) / 1000);
  const shortWindow = durationSec < 15;
  const hrSamples = filterWorkoutSamples(watchData, { sourceId, type: 'heart_rate', start: window.start, end: window.end });
  const energySamples = filterWorkoutSamples(watchData, { sourceId, type: 'active_energy', start: window.start, end: window.end });
  const hrs = hrSamples.map(s => s.hr).filter(Number.isFinite);
  const avgHr = hrs.length ? Math.round(hrs.reduce((s, v) => s + v, 0) / hrs.length) : null;
  const maxHr = hrs.length ? Math.round(Math.max(...hrs)) : null;
  const kcal = energySamples.length
    ? Math.round((energySamples.reduce((s, row) => s + (row.value || 0), 0) / 4.184) * 10) / 10
    : null;
  const minutes = Math.max(1, Math.ceil(durationSec / 60));
  const confidence = confidenceFromSamples(hrs.length, minutes, shortWindow);
  const effort = effortLabel(avgHr, maxHr);
  return { status: hrs.length ? 'ok' : 'missing', durationSec, avgHr, maxHr, kcal, sampleCount: hrs.length, energySampleCount: energySamples.length, confidence, effort };
}

function exerciseEffortStats(exercise, watchData, session, allExercises = EXERCISES) {
  const sourceId = watchSourceForSession(watchData, session);
  const window = exerciseWindowMs(exercise);
  const doneSets = (exercise?.sets || []).filter(set => set.done);
  const setStats = doneSets.map((set, i) => ({ setNo: i + 1, set, ...setEffortStats(set, watchData, sourceId) }));
  if (!window) {
    return {
      status: 'missing',
      confidence: confidenceFromSamples(0, 0),
      effort: effortLabel(null, null),
      setStats,
      sampleCount: 0,
      sourceId,
      volume: doneSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
      avgRpe: null,
      pain: Math.max(0, ...doneSets.map(set => Number(set.pain) || 0)),
      name: allExercises?.[exercise.id]?.name || exercise.id,
    };
  }
  const hrSamples = filterWorkoutSamples(watchData, { sourceId, type: 'heart_rate', start: window.start, end: window.end });
  const energySamples = filterWorkoutSamples(watchData, { sourceId, type: 'active_energy', start: window.start, end: window.end });
  const hrs = hrSamples.map(s => s.hr).filter(Number.isFinite);
  const avgHr = hrs.length ? Math.round(hrs.reduce((s, v) => s + v, 0) / hrs.length) : null;
  const maxHr = hrs.length ? Math.round(Math.max(...hrs)) : null;
  const minutes = Math.max(1, Math.round((window.end - window.start) / 60000));
  const kcal = energySamples.length
    ? Math.round((energySamples.reduce((s, row) => s + (row.value || 0), 0) / 4.184) * 10) / 10
    : null;
  const setKcal = setStats.map(row => row.kcal).filter(Number.isFinite).reduce((sum, v) => sum + v, 0);
  const volume = doneSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
  const rpes = doneSets.map(set => Number(set.rpe)).filter(n => Number.isFinite(n) && n > 0);
  const avgRpe = rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
  const pain = Math.max(0, ...doneSets.map(set => Number(set.pain) || 0));
  const confidence = confidenceFromSamples(hrs.length, minutes);
  const effort = effortLabel(avgHr, maxHr);
  return {
    status: hrs.length ? 'ok' : 'missing',
    sourceId,
    window,
    minutes,
    avgHr,
    maxHr,
    kcal: setKcal > 0 ? Math.round(setKcal * 10) / 10 : kcal,
    sampleCount: hrs.length,
    hrSamples,
    confidence,
    effort,
    volume,
    avgRpe,
    pain,
    setStats,
    name: allExercises?.[exercise.id]?.name || exercise.id,
  };
}

function sessionEffortReview(session, watchData, allExercises = EXERCISES) {
  const workout = getWatchWorkoutForSession(watchData, session);
  const sourceId = watchSourceForSession(watchData, session) || workout?.source_id || null;
  const workoutStart = workout?.start_at ? new Date(workout.start_at).getTime() : null;
  const workoutEnd = workout?.end_at ? new Date(workout.end_at).getTime() : null;
  const sessionWindow = sessionWindowMs(session);
  const window = Number.isFinite(workoutStart) && Number.isFinite(workoutEnd) && workoutEnd > workoutStart
    ? { start: workoutStart, end: workoutEnd }
    : sessionWindow;
  const hrSamples = filterWorkoutSamples(watchData, { sourceId, type: 'heart_rate', start: window?.start, end: window?.end });
  const hrs = hrSamples.map(s => s.hr).filter(Number.isFinite);
  const avgHr = Number(workout?.avg_heart_rate) || (hrs.length ? Math.round(hrs.reduce((s, v) => s + v, 0) / hrs.length) : null);
  const maxHr = Number(workout?.max_heart_rate) || (hrs.length ? Math.round(Math.max(...hrs)) : null);
  const durationMin = Number(workout?.duration_sec)
    ? Math.round(Number(workout.duration_sec) / 60)
    : session?.duration || (window ? Math.round((window.end - window.start) / 60000) : null);
  const activeKcal = Number(workout?.active_energy_kcal) || null;
  const exerciseStats = (session?.exercises || [])
    .filter(ex => (ex.sets || []).some(set => set.done))
    .map(ex => exerciseEffortStats(ex, watchData, session, allExercises));
  const hardest = [...exerciseStats]
    .filter(ex => Number.isFinite(ex.maxHr) || Number.isFinite(ex.avgHr))
    .sort((a, b) => (b.maxHr || b.avgHr || 0) - (a.maxHr || a.avgHr || 0))[0] || null;
  return {
    matched: !!workout || !!sourceId,
    workout,
    sourceId,
    window,
    hrSamples,
    avgHr: avgHr ? Math.round(avgHr) : null,
    maxHr: maxHr ? Math.round(maxHr) : null,
    durationMin,
    activeKcal: activeKcal ? Math.round(activeKcal) : null,
    intensity: Number(workout?.intensity) || null,
    confidence: confidenceFromSamples(hrs.length, durationMin || 1),
    exerciseStats,
    hardest,
  };
}

function analyseExerciseEffort(exercise, watchData, session = null) {
  const window = exerciseWindowMs(exercise);
  const samples = watchData ? (watchData.samples || []) : [];
  const match = getSessionWatchMatch(watchData, session);
  const sourceId = matchSourceId(match);
  if (!window || !samples.length) return { status: 'missing', label: 'No Watch effort yet', confidence: 'none', samples: 0 };
  const hrSamples = samples
    .map(sample => ({ t: sampleTimeMs(sample), hr: sampleHeartRate(sample) }))
    .filter((sample, idx) => {
      if (!sample.t || !sample.hr || sample.t < window.start || sample.t > window.end) return false;
      if (sampleType(samples[idx]) !== 'heart_rate') return false;
      if (!sourceId) return true;
      return String(sampleSourceId(samples[idx])) === String(sourceId);
    });
  if (!hrSamples.length) return { status: 'missing', label: 'No Watch effort in this window', confidence: 'none', samples: 0 };
  const avgHr = Math.round(hrSamples.reduce((sum, sample) => sum + sample.hr, 0) / hrSamples.length);
  const maxHr = Math.round(Math.max(...hrSamples.map(sample => sample.hr)));
  const minutes = Math.max(1, Math.round((window.end - window.start) / 60000));
  const density = hrSamples.length / minutes;
  const confidence = hrSamples.length >= 3 && density >= 0.6 ? 'high' : hrSamples.length >= 2 ? 'medium' : 'low';
  const label = maxHr >= 150 || avgHr >= 135 ? 'Hard effort'
    : maxHr >= 130 || avgHr >= 115 ? 'Moderate effort'
      : 'Easy effort';
  return { status: 'ok', label, confidence, samples: hrSamples.length, avgHr, maxHr, minutes };
}

function findLastExerciseEntry(sessions, exId) {
  const sorted = [...(sessions || [])].filter(s => s.completed).sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const sess of sorted) {
    const exercise = (sess.exercises || []).find(ex => ex.id === exId);
    if (exercise?.sets?.some(set => set.done)) return { session: sess, exercise };
  }
  return null;
}

function recommendExerciseProgression(entry, def, recovery, watchData) {
  if (!entry?.exercise || !def) return { tone: C.muted, title: 'No previous data', body: 'Log this exercise once to get a progression recommendation.' };
  const sets = (entry.exercise.sets || []).filter(set => set.done);
  if (!sets.length) return { tone: C.muted, title: 'No completed sets', body: 'Complete at least one set to build a recommendation.' };
  const painMax = Math.max(...sets.map(set => Number(set.pain) || 0));
  const rpes = sets.map(set => Number(set.rpe)).filter(n => Number.isFinite(n) && n > 0);
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
  const effort = analyseExerciseEffort(entry.exercise, watchData, entry.session);
  const allAtTop = def.repMax && sets.every(set => Number(set.reps) >= def.repMax);
  const allComfortable = avgRpe === 0 || avgRpe <= 7;
  const hardWatch = effort.status === 'ok' && (effort.label === 'Hard effort' || effort.maxHr >= 150);
  if (painMax >= 3) return { tone: C.red, title: 'Reduce or modify', body: `Pain reached ${painMax}/10 last time. Keep load conservative and adjust range or exercise if symptoms return.`, effort };
  if (recovery?.score != null && recovery.score < 38) return { tone: C.red, title: 'Hold progression', body: 'Recovery is low today. Keep this exercise light, even if last session looked strong.', effort };
  if (hardWatch || avgRpe >= 8.5) return { tone: C.amber, title: 'Maintain today', body: 'Last time looked demanding. Repeat the same load/reps and aim for smoother control before progressing.', effort };
  if (def.unit === 'kg' && allAtTop && allComfortable) return { tone: C.green, title: 'Consider adding load', body: 'You completed the top of the rep range with manageable effort. Add the smallest sensible weight jump if warm-up sets feel good.', effort };
  if (def.repMax && allComfortable) return { tone: C.green, title: 'Add 1 rep', body: 'Last time looked controlled. Try adding 1 rep to one or two sets before increasing weight.', effort };
  return { tone: C.blue, title: 'Repeat and build', body: 'Keep the same target and focus on clean reps. Progress once reps, RPE, pain, and recovery all line up.', effort };
}

function exerciseHistoryPoints(sessions, exId, watchData) {
  return [...(sessions || [])]
    .filter(s => s.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(session => {
      const exercise = (session.exercises || []).find(ex => ex.id === exId);
      if (!exercise) return null;
      const sets = (exercise.sets || []).filter(set => set.done);
      if (!sets.length) return null;
      const volume = sets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
      const maxWeight = Math.max(0, ...sets.map(set => Number(set.weight) || 0));
      const reps = sets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
      const rpes = sets.map(set => Number(set.rpe)).filter(n => Number.isFinite(n) && n > 0);
      const pain = Math.max(0, ...sets.map(set => Number(set.pain) || 0));
      const effort = analyseExerciseEffort(exercise, watchData, session);
      return {
        date: session.date,
        label: new Date(session.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
        volume,
        maxWeight,
        reps,
        avgRpe: rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null,
        pain,
        effort,
      };
    })
    .filter(Boolean)
    .slice(-6);
}

function ExerciseHistoryChart({ points }) {
  if (!points?.length) return null;
  const W = 320, H = 126, pL = 28, pR = 18, pT = 14, pB = 28;
  const values = points.map(p => p.volume || p.reps || 0);
  const hrs = points.map(p => p.effort?.avgHr || null);
  const maxVal = Math.max(1, ...values);
  const hrVals = hrs.filter(Boolean);
  const minHr = hrVals.length ? Math.min(...hrVals) : 0;
  const maxHr = hrVals.length ? Math.max(...hrVals) : 1;
  const spanHr = maxHr === minHr ? 1 : maxHr - minHr;
  const step = points.length > 1 ? (W - pL - pR) / (points.length - 1) : 0;
  const xOf = i => pL + i * step;
  const yBar = v => H - pB - (v / maxVal) * (H - pT - pB);
  const yHr = hr => pT + ((maxHr - hr) / spanHr) * (H - pT - pB);
  const hrPath = points.map((p, i) => p.effort?.avgHr ? `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yHr(p.effort.avgHr)}` : null).filter(Boolean).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', marginTop: 8 }}>
      {[0, 1, 2].map(i => <line key={i} x1={pL} x2={W - pR} y1={pT + i * 34} y2={pT + i * 34} stroke={C.border} strokeDasharray="4 4" />)}
      {points.map((p, i) => {
        const x = xOf(i);
        const barH = H - pB - yBar(values[i]);
        return (
          <g key={p.date}>
            <rect x={x - 10} y={yBar(values[i])} width={20} height={Math.max(3, barH)} rx={4} fill={C.blue} opacity={0.78} />
            <text x={x} y={H - 8} textAnchor="middle" fontSize="8" fontFamily={C.fMono} fill={C.muted}>{p.label}</text>
          </g>
        );
      })}
      {hrPath && <path d={hrPath} fill="none" stroke={C.red} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => p.effort?.avgHr ? <circle key={`hr-${p.date}`} cx={xOf(i)} cy={yHr(p.effort.avgHr)} r={3.2} fill={C.red} /> : null)}
      <text x={pL} y={10} fontSize="8" fontFamily={C.fMono} fill={C.blue}>Volume/reps</text>
      <text x={W - pR} y={10} textAnchor="end" fontSize="8" fontFamily={C.fMono} fill={C.red}>Avg HR</text>
    </svg>
  );
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Hey';
}

// SVG circular recovery ring — always caps at 100% visually
function RecoveryRing({ score, color, label, size = 90 }) {
  const displayScore = Math.min(score, 100);
  const r = (size - 16) / 2, cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (displayScore / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.border} strokeWidth={9} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx - 2} textAnchor="middle" fill={color} fontSize={19} fontWeight={800} fontFamily={C.fDisplay}>{displayScore}%</text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily={C.fMono}>{label}</text>
    </svg>
  );
}

// Gradient training load bar with circular position indicator
function TrainingLoadBar({ load }) {
  if (load == null) return <div style={{ fontSize: 11, color: C.muted }}>—</div>;
  const pct = Math.min(100, Math.max(0, load));
  // Colour of the indicator dot — tracks position along the gradient
  const dotColor = pct < 35 ? '#5A9DF8' : pct < 55 ? '#42B85C' : pct < 72 ? '#F6C623' : pct < 85 ? '#F6A623' : '#F04444';
  return (
    <div>
      <div style={{ fontFamily: C.fDisplay, fontSize: 26, fontWeight: 800, color: dotColor, marginBottom: 10 }}>
        {pct}%
      </div>
      {/* Gradient bar with indicator dot */}
      <div style={{ position: 'relative', height: 10, borderRadius: 5, marginBottom: 6,
        background: 'linear-gradient(to right, #5A9DF8 0%, #42B85C 35%, #F6C623 55%, #F6A623 72%, #F04444 100%)' }}>
        <div style={{
          position: 'absolute',
          left: `clamp(9px, calc(${pct}% - 0px), calc(100% - 9px))`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: dotColor,
          border: '3px solid #ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
          zIndex: 1,
        }} />
      </div>
      {/* Fixed zone labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted }}>Low</span>
        <span style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted }}>Optimal</span>
        <span style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted }}>High</span>
      </div>
    </div>
  );
}

// Segmented fatigue bar
function FatigueBar({ level, color }) {
  const segs = 10;
  const filled = Math.round(level / 10);
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
      {Array.from({ length: segs }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < filled ? color : C.border }} />
      ))}
    </div>
  );
}

// Mini area sparkline with gradient fill — matches target mockup style
function MetricSparkline({ data, color, height = 36, metric, baseline }) {
  const vals = (data || []).slice(-14)
    .map(d => ({ date: d.date, value: Number(d.value) }))
    .filter(d => Number.isFinite(d.value));
  if (vals.length < 2) return <div style={{ height }} />;
  const W = 100, H = height;
  const rawVals = vals.map(d => d.value);
  const min = Math.min(...rawVals), max = Math.max(...rawVals);
  const span = max === min ? 1 : max - min;
  const xOf = i => (i / (vals.length - 1)) * W;
  const yOf = v => (H - 4) - ((v - min) / span) * (H - 8);
  const linePoints = vals.map((d, i) => ({ x: xOf(i), y: yOf(d.value), value: d.value }));
  const linePath = smoothLinePath(linePoints, 0.75);
  const areaPath = `${linePath} L${xOf(vals.length - 1).toFixed(1)},${H} L0,${H} Z`;
  const gId = `sg${(metric?.key || color).replace(/[^a-z0-9]/gi, '')}${vals.length}`;
  const strokeId = `${gId}stroke`;
  const stops = chartGradientStops(linePoints, metric, baseline, color, C);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gId})`} />
      <path d={linePath} fill="none" stroke={`url(#${strokeId})`} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricInsightChart({ metric, data, baseline }) {
  const points = (data || []).slice(-14)
    .map(d => ({ date: d.date, value: Number(d.value) }))
    .filter(d => d.date && Number.isFinite(d.value));
  if (points.length < 2) return <div style={{ height: 150, display: 'grid', placeItems: 'center', color: C.muted, fontSize: 12 }}>More readings needed for a trend chart.</div>;
  const W = 360, H = 178, pL = 42, pR = 12, pT = 14, pB = 34;
  const iW = W - pL - pR, iH = H - pT - pB;
  const values = points.map(p => p.value);
  const allValues = baseline ? [...values, baseline] : values;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max === min ? Math.max(1, max * 0.08) : max - min;
  const lo = Math.max(0, min - span * 0.18);
  const hi = max + span * 0.18;
  const xOf = i => pL + (i / Math.max(points.length - 1, 1)) * iW;
  const yOf = v => pT + iH - ((v - lo) / Math.max(hi - lo, 1)) * iH;
  const axisLabel = metric?.unit ? `${metric.title} (${metric.unit})` : metric?.title;
  const yTicks = [hi, (hi + lo) / 2, lo];
  const labelIdx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const baseY = baseline ? yOf(baseline) : null;
  const chartPoints = points.map((p, i) => ({ x: xOf(i), y: yOf(p.value), value: p.value }));
  const smoothPath = smoothLinePath(chartPoints);
  const gradientId = `metricInsight${(metric?.key || 'metric').replace(/[^a-z0-9]/gi, '')}${points.length}`;
  const glowId = `${gradientId}Glow`;
  const stops = chartGradientStops(chartPoints, metric, baseline, metric?.color || C.blue, C);
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 190, display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
          </linearGradient>
          <filter id={glowId} x="-8%" y="-25%" width="116%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor={metric?.color || C.blue} floodOpacity="0.18" />
          </filter>
        </defs>
        <text x={pL} y={9} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{axisLabel}</text>
        <line x1={pL} y1={pT} x2={pL} y2={H - pB} stroke={C.border} strokeWidth={1.2} />
        <line x1={pL} y1={H - pB} x2={W - pR} y2={H - pB} stroke={C.border} strokeWidth={1.2} />
        {yTicks.map((tick, i) => {
          const y = yOf(tick);
          return (
            <g key={i}>
              <line x1={pL} y1={y} x2={W - pR} y2={y} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" opacity={i === 2 ? 0 : 1} />
              <text x={pL - 7} y={y + 3} fill={C.muted} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{Math.round(tick * 10) / 10}</text>
            </g>
          );
        })}
        {baseY != null && (
          <g>
            <line x1={pL} y1={baseY} x2={W - pR} y2={baseY} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.65} />
            <rect x={W - 74} y={Math.max(12, baseY - 16)} width={62} height={14} rx={4} fill="#fff" opacity={0.92} />
            <text x={W - 43} y={Math.max(22, baseY - 6)} fill={C.blue} fontSize={8} textAnchor="middle" fontFamily={C.fMono}>Baseline</text>
          </g>
        )}
        <path d={smoothPath} fill="none" stroke={`url(#${gradientId})`} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} filter={`url(#${glowId})`} />
        <path d={smoothPath} fill="none" stroke={`url(#${gradientId})`} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const color = metricStatusColor(metric, p.value, baseline, C);
          return <circle key={p.date} cx={xOf(i)} cy={yOf(p.value)} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
        })}
        {labelIdx.map(i => (
          <text key={points[i].date} x={xOf(i)} y={H - 10} fill={C.muted} fontSize={8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontFamily={C.fMono}>
            {fmtHealthDate(points[i].date)}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: -4 }}>
        {metricChartColorKey(metric, C).map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: C.fMono, fontSize: 8, color: C.muted }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: item.color, display: 'inline-block' }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Dual-axis HRV + Resting HR chart with 7D/30D/90D
function RecoveryTrendChart({ healthData, days }) {
  const hrv = lastNDaysReadings(healthData?.hrv || [], days);
  const rhr = lastNDaysReadings(healthData?.restingHr || [], days);
  if (!hrv.length && !rhr.length) return null;
  const W = 320, H = 124, pL = 34, pR = 38, pT = 10, pB = 24;
  const iW = W - pL - pR, iH = H - pT - pB;
  const bHRV = rollingAvg(healthData?.hrv || [], 14);
  const bRHR = rollingAvg(healthData?.restingHr || [], 14);
  const hrvVals = hrv.map(d => Number(d.value));
  const rhrVals = rhr.map(d => Number(d.value));
  const hrvMin = Math.min(...(hrvVals.length ? hrvVals : [0]));
  const hrvMax = Math.max(...(hrvVals.length ? hrvVals : [1]));
  const rhrMin = Math.min(...(rhrVals.length ? rhrVals : [0]));
  const rhrMax = Math.max(...(rhrVals.length ? rhrVals : [1]));
  const pad = 0.1;
  const hLo = hrvMin - (hrvMax - hrvMin) * pad, hHi = hrvMax + (hrvMax - hrvMin) * pad || hrvMax + 1;
  const rLo = rhrMin - (rhrMax - rhrMin) * pad, rHi = rhrMax + (rhrMax - rhrMin) * pad || rhrMax + 1;
  const xOf = (i, n) => pL + (n < 2 ? 0.5 : i / (n - 1)) * iW;
  const yHRV = v => pT + iH - ((v - hLo) / (hHi - hLo)) * iH;
  const yRHR = v => pT + iH - ((v - rLo) / (rHi - rLo)) * iH;
  const hrvMetric = { key: 'hrv', title: 'HRV', color: C.blue, higherBetter: true };
  const rhrMetric = { key: 'restingHr', title: 'Resting HR', color: C.red, higherBetter: false };
  const hrvXY = hrv.map((d, i) => ({ x: xOf(i, hrv.length), y: yHRV(Number(d.value)), value: Number(d.value) }));
  const rhrXY = rhr.map((d, i) => ({ x: xOf(i, rhr.length), y: yRHR(Number(d.value)), value: Number(d.value) }));
  const hrvPts = hrvXY.map(p => `${p.x},${p.y}`).join(' ');
  const rhrPts = rhrXY.map(p => `${p.x},${p.y}`).join(' ');
  const hrvSmooth = smoothLinePath(hrvXY);
  const rhrSmooth = smoothLinePath(rhrXY);
  const hrvGradientId = `recoveryHrv${days}${hrv.length}`;
  const rhrGradientId = `recoveryRhr${days}${rhr.length}`;
  const hrvStops = chartGradientStops(hrvXY, hrvMetric, bHRV, C.blue, C);
  const rhrStops = chartGradientStops(rhrXY, rhrMetric, bRHR, C.red, C);
  const first = [...hrv, ...rhr].map(d => d.date).sort()[0];
  const last  = [...hrv, ...rhr].map(d => d.date).sort().reverse()[0];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id={hrvGradientId} x1="0" y1="0" x2="1" y2="0">
          {hrvStops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
        </linearGradient>
        <linearGradient id={rhrGradientId} x1="0" y1="0" x2="1" y2="0">
          {rhrStops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((v, i) => (
        <line key={i} x1={pL} y1={pT + iH * v} x2={W - pR} y2={pT + iH * v} stroke={C.border} strokeWidth={1} strokeDasharray="3,3" />
      ))}
      {hrvPts.length > 1 && <path d={hrvSmooth} fill="none" stroke={`url(#${hrvGradientId})`} strokeWidth={2.9} strokeLinecap="round" strokeLinejoin="round" />}
      {hrv.map((d, i) => {
        const v = Number(d.value);
        const col = metricStatusColor(hrvMetric, v, bHRV, C);
        return <circle key={d.date} cx={xOf(i, hrv.length)} cy={yHRV(v)} r={4} fill={col} />;
      })}
      {rhrPts.length > 1 && <path d={rhrSmooth} fill="none" stroke={`url(#${rhrGradientId})`} strokeWidth={2.9} strokeLinecap="round" strokeLinejoin="round" opacity={0.82} />}
      {rhr.map((d, i) => {
        const v = Number(d.value);
        const col = metricStatusColor(rhrMetric, v, bRHR, C);
        return <circle key={d.date} cx={xOf(i, rhr.length)} cy={yRHR(v)} r={4} fill={col} opacity={0.9} />;
      })}
      {/* Axis labels */}
      <text x={pL - 4} y={pT + 10} fill={C.blue} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{Math.round(hHi)}</text>
      <text x={pL - 4} y={H - pB + 4} fill={C.blue} fontSize={8} textAnchor="end" fontFamily={C.fMono}>{Math.round(hLo)}</text>
      <text x={W - pR + 4} y={pT + 10} fill={C.red} fontSize={8} fontFamily={C.fMono}>{Math.round(rHi)}</text>
      <text x={W - pR + 4} y={H - pB + 4} fill={C.red} fontSize={8} fontFamily={C.fMono}>{Math.round(rLo)}</text>
      {/* X-axis: first, midpoint, last */}
      {(() => {
        const all = [...new Set([...hrv.map(d => d.date), ...rhr.map(d => d.date)])].sort();
        const labels = all.length <= 7
          ? [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]].filter(Boolean)
          : [all[0], all[Math.floor(all.length * 0.33)], all[Math.floor(all.length * 0.66)], all[all.length - 1]].filter(Boolean);
        const uniq = [...new Set(labels)];
        return uniq.map((d, i) => {
          const xPos = pL + (all.indexOf(d) / Math.max(all.length - 1, 1)) * iW;
          const anchor = i === 0 ? 'start' : i === uniq.length - 1 ? 'end' : 'middle';
          return <text key={d} x={xPos} y={H - 4} fill={C.muted} fontSize={8} textAnchor={anchor} fontFamily={C.fMono}>{fmtHealthDate(d)}</text>;
        });
      })()}
    </svg>
  );
}

// Cycling This Week card
function CyclingWeekCard({ rides }) {
  const ws = weekMondayStart();
  const weekRides = rides.filter(r => new Date(r.date) >= ws && r.distance);
  const prevStart = new Date(ws); prevStart.setDate(prevStart.getDate() - 7);
  const prevRides = rides.filter(r => { const d = new Date(r.date); return d >= prevStart && d < ws && r.distance; });
  const totalDist  = weekRides.reduce((s, r) => s + (r.distance || 0), 0);
  const prevDist   = prevRides.reduce((s, r) => s + (r.distance || 0), 0);
  const pct = prevDist > 0 ? Math.round(((totalDist - prevDist) / prevDist) * 100) : null;
  const longest = weekRides.length ? Math.max(...weekRides.map(r => r.distance || 0)) : 0;
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return localDateStr(d); });
  const byDay = {};
  weekRides.forEach(r => { const k = localDateStr(new Date(r.date)); byDay[k] = (byDay[k] || 0) + (r.distance || 0); });
  const maxDay = Math.max(...weekDays.map(d => byDay[d] || 0), 1);
  const W = 140, H = 44, pad = { l: 0, r: 0, b: 8 }, barW = Math.floor((W - 6) / 7) - 2;
  if (!weekRides.length) return (
    <div style={{ ...st.card(), flex: 1 }}>
      <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🚴 Cycling</div>
      <div style={{ fontSize: 12, color: C.muted }}>No rides this week</div>
    </div>
  );
  return (
    <div style={{ ...st.card(), flex: 1 }}>
      <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🚴 Cycling this week</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
        <span style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 800, color: C.blue }}>{totalDist.toFixed(1)}</span>
        <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>km</span>
      </div>
      {pct !== null && <div style={{ fontFamily: C.fMono, fontSize: 9, color: pct >= 0 ? C.green : C.amber, marginBottom: 6 }}>
        {pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}% vs last week
      </div>}
      {longest > 0 && <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, marginBottom: 8 }}>Longest: {longest.toFixed(1)} km</div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {weekDays.map((d, i) => {
          const val = byDay[d] || 0;
          const bH = Math.max(2, (val / maxDay) * (H - pad.b));
          const x = i * (barW + 2);
          return <rect key={d} x={x} y={H - pad.b - bH} width={barW} height={bH} rx={2} fill={val > 0 ? C.blue : C.border} />;
        })}
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <text key={i} x={i * (barW + 2) + barW / 2} y={H} fill={C.muted} fontSize={7} textAnchor="middle" fontFamily={C.fMono}>{l}</text>
        ))}
      </svg>
    </div>
  );
}

// Strength This Week card
function StrengthWeekCard({ sessions, allExercises }) {
  const ws = weekMondayStart();
  const weekSess = sessions.filter(s => s.completed && new Date(s.date) >= ws);
  let totalVol = 0, totalTime = 0;
  weekSess.forEach(s => {
    totalTime += s.duration || 0;
    (s.exercises || []).forEach(ex => {
      ex.sets.filter(set => set.done).forEach(set => {
        totalVol += (Number(set.weight) || 0) * (Number(set.reps) || 0);
      });
    });
  });
  // Top lift increase this week vs all-time best before this week
  let topLift = null;
  weekSess.forEach(s => {
    (s.exercises || []).forEach(ex => {
      const def = allExercises[ex.id];
      if (!def || def.unit !== 'kg') return;
      const wMax = Math.max(0, ...ex.sets.filter(set => set.done).map(set => Number(set.weight) || 0));
      if (!wMax) return;
      const prev = sessions.filter(ps => ps.completed && ps.id !== s.id && new Date(ps.date) < ws)
        .flatMap(ps => (ps.exercises || []).filter(e => e.id === ex.id))
        .flatMap(e => e.sets.filter(set => set.done).map(set => Number(set.weight) || 0));
      const prevMax = prev.length ? Math.max(...prev) : 0;
      const gain = wMax - prevMax;
      if (gain > 0 && (!topLift || gain > topLift.gain)) topLift = { name: def.name, gain, weight: wMax };
    });
  });
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return localDateStr(d); });
  const byDay = {};
  weekSess.forEach(s => { const k = localDateStr(new Date(s.date)); byDay[k] = (byDay[k] || 0) + 1; });
  const W = 140, H = 44, pad = { b: 8 }, barW = Math.floor((W - 6) / 7) - 2;
  if (!weekSess.length) return (
    <div style={{ ...st.card(), flex: 1 }}>
      <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>🏋️ Strength</div>
      <div style={{ fontSize: 12, color: C.muted }}>No sessions this week</div>
    </div>
  );
  return (
    <div style={{ ...st.card(), flex: 1 }}>
      <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🏋️ Strength this week</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 800, color: C.amber }}>{weekSess.length}</span>
        <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>sessions</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        {[
          { label: 'Volume', value: totalVol > 0 ? `${Math.round(totalVol / 1000 * 10) / 10}t` : '—' },
          { label: 'Top Lift', value: topLift ? `+${topLift.gain}kg` : '—', color: topLift ? C.green : C.muted, sub: topLift?.name?.split(' ')[0] },
          { label: 'Time', value: totalTime > 0 ? `${Math.floor(totalTime / 60)}h${totalTime % 60}m` : '—' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: C.fMono, fontSize: 7, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 11, fontWeight: 700, color: s.color || C.text }}>{s.value}</div>
            {s.sub && <div style={{ fontFamily: C.fMono, fontSize: 7, color: C.muted }}>{s.sub}</div>}
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {weekDays.map((d, i) => {
          const val = byDay[d] || 0;
          const bH = val > 0 ? H - pad.b : 2;
          const x = i * (barW + 2);
          return <rect key={d} x={x} y={H - pad.b - bH} width={barW} height={bH} rx={2} fill={val > 0 ? C.amber : C.border} />;
        })}
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <text key={i} x={i * (barW + 2) + barW / 2} y={H} fill={C.muted} fontSize={7} textAnchor="middle" fontFamily={C.fMono}>{l}</text>
        ))}
      </svg>
    </div>
  );
}

// Weekly Activity Heatmap (GitHub-style, last 5 weeks, Mon–Sun rows)
function WeeklyHeatmap({ sessions, rides, healthData }) {
  const WEEKS = 5;
  const today = new Date(); today.setHours(0,0,0,0);
  // Find the Monday of current week
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  // Go back WEEKS-1 more weeks to get grid start
  const start = new Date(mon); start.setDate(mon.getDate() - (WEEKS - 1) * 7);

  const stepsGoal = 8000;
  const stepsByDate = {};
  (healthData?.steps || []).forEach(r => { stepsByDate[r.date] = Number(r.value); });
  const trainedDates = new Set(sessions.filter(s => s.completed).map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean));
  const rideDates    = new Set(rides.map(r => r.date ? localDateStr(new Date(r.date)) : null).filter(Boolean));

  // Build 7 rows (Mon-Sun), WEEKS columns
  const grid = Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: WEEKS }, (_, col) => {
      const d = new Date(start); d.setDate(start.getDate() + col * 7 + row);
      const ds = localDateStr(d);
      const isFuture = d > today;
      const steps = stepsByDate[ds] || 0;
      const hasWorkout = trainedDates.has(ds);
      const hasRide    = rideDates.has(ds);
      const stepsRatio = steps / stepsGoal;
      // Colour logic
      let bg = C.border; // grey = no data / no activity
      if (!isFuture) {
        if (hasWorkout && stepsRatio >= 1) bg = C.green;      // goal hit + trained
        else if (hasWorkout)               bg = C.amber;      // trained, steps below goal
        else if (hasRide)                  bg = C.blue + 'cc'; // ride day
        else if (stepsRatio >= 1)          bg = C.green + '88'; // steps goal hit, no workout
        else if (stepsRatio >= 0.5)        bg = C.blue + '55'; // partial steps
        else if (steps > 0)               bg = C.border;      // minimal activity
      }
      return { ds, isFuture, bg, hasWorkout, hasRide, steps };
    })
  );

  const cellSize = 11, gap = 3;
  // Column headers: week start dates
  const colDates = Array.from({ length: WEEKS }, (_, col) => {
    const d = new Date(start); d.setDate(start.getDate() + col * 7);
    return fmtHealthDate(localDateStr(d));
  });
  const days = ['M','T','W','T','F','S','S'];

  return (
    <div style={{ ...st.card(), marginBottom: 12 }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: C.text, marginBottom: 10 }}>Weekly Activity</div>
      <div style={{ overflowX: 'auto' }}>
        {/* Column date labels */}
        <div style={{ display: 'flex', marginLeft: 16, marginBottom: 4, gap: gap }}>
          {colDates.map((d, i) => (
            <div key={i} style={{ width: cellSize, fontFamily: C.fMono, fontSize: 7, color: C.muted, textAlign: 'center', flexShrink: 0 }}>{i % 2 === 0 ? d.replace(' ', '\n') : ''}</div>
          ))}
        </div>
        {/* Grid rows */}
        {grid.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: gap, marginBottom: gap }}>
            <div style={{ width: 12, fontFamily: C.fMono, fontSize: 7, color: C.muted, textAlign: 'right', flexShrink: 0 }}>{days[ri]}</div>
            {row.map((cell, ci) => (
              <div key={ci} style={{
                width: cellSize, height: cellSize, borderRadius: 2, flexShrink: 0,
                background: cell.isFuture ? 'transparent' : cell.bg,
                border: cell.isFuture ? `1px dashed ${C.border}` : 'none',
                opacity: cell.isFuture ? 0.3 : 1,
              }} title={`${cell.ds}${cell.hasWorkout ? ' · Workout' : ''}${cell.hasRide ? ' · Ride' : ''}${cell.steps ? ` · ${cell.steps.toLocaleString()} steps` : ''}`} />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { color: C.border,        label: 'No activity' },
          { color: C.blue + '55',   label: 'Steps' },
          { color: C.blue + 'cc',   label: 'Ride' },
          { color: C.amber,         label: 'Workout' },
          { color: C.green,         label: 'Goal + Workout' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: l.color, flexShrink: 0 }} />
            <span style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Workouts section (sessions + rides combined, 3 most recent)
function RecentWorkoutsSection({ sessions, rides, setView }) {
  const all = [
    ...sessions.filter(s => s.completed).map(s => ({ _type: 'workout', _date: new Date(s.date), _dateStr: s.date, ...s })),
    ...rides.map(r => ({ _type: 'ride',    _date: new Date(r.date), _dateStr: r.date, ...r })),
  ].sort((a, b) => b._date - a._date).slice(0, 3);

  if (!all.length) return null;

  return (
    <div style={{ ...st.card(), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: C.fDisplay, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: C.text }}>Recent Workouts</div>
        <button onClick={() => setView('history')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fMono, fontSize: 10, color: C.blue }}>View all</button>
      </div>
      {all.map((item, i) => {
        const isRide = item._type === 'ride';
        const dateLabel = new Date(item._dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
        let icon, title, stat;
        if (isRide) {
          icon = '🚴';
          title = item.type ? `${item.type} Ride` : 'Cycling';
          stat = [item.distance && `${item.distance} km`, item.duration && `${item.duration} min`].filter(Boolean).join(' · ');
        } else {
          const display = workoutDisplay(item);
          icon = display.badge;
          title = display.title;
          stat = [item.duration && `${item.duration} min`].filter(Boolean).join('');
        }
        return (
          <div key={item.id || item._dateStr + i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: i < all.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: isRide ? C.blue + '18' : C.amberDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: C.fBody, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 2 }}>
                {dateLabel}{stat ? ` · ${stat}` : ''}
              </div>
            </div>
            <span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>›</span>
          </div>
        );
      })}
      <button onClick={() => setView('preStart')}
        style={{ ...st.btn(C.dim, C.text), marginTop: 12, fontSize: 13 }}>
        + Log Workout
      </button>
    </div>
  );
}

function WatchEffortCard({ watchSummary }) {
  const m = watchSummary?.latestMatch;
  if (!m) return null;
  const day = m.ironlog_workout?.startsWith('IRON_') ? `Iron Series — Day ${m.ironlog_workout.split('_')[1]}` : `Workout ${m.ironlog_workout}`;
  const effortColor = m.effort_label === 'hard' ? C.red : m.effort_label === 'moderate' ? C.amber : C.green;
  const minutes = Math.round((Number(m.watch_duration_sec) || 0) / 60);
  const kcal = Math.round(Number(m.active_energy_kcal) || 0);
  const avgHr = Math.round(Number(m.avg_heart_rate) || 0);
  const maxHr = Math.round(Number(m.max_heart_rate) || 0);
  const overlap = Math.round((Number(m.session_overlap_ratio) || 0) * 100);

  return (
    <div style={{ ...st.card(), marginBottom: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Last workout matched</div>
          <div style={{ fontFamily: C.fBody, fontSize: 13, fontWeight: 800, color: C.text, marginTop: 5, lineHeight: 1.2 }}>{day}</div>
          <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, marginTop: 3 }}>
            Apple Watch · {m.match_confidence} confidence · {overlap}% overlap
          </div>
        </div>
        <div style={{ fontFamily: C.fMono, fontSize: 9, fontWeight: 800, color: effortColor, background: effortColor + '18', borderRadius: 999, padding: '4px 8px', textTransform: 'uppercase' }}>
          {m.effort_label || 'logged'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
        {[
          ['Time', `${minutes}m`],
          ['Energy', `${kcal}`],
          ['Avg HR', avgHr ? `${avgHr}` : '—'],
          ['Peak', maxHr ? `${maxHr}` : '—'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: C.dim, borderRadius: 8, padding: '7px 6px' }}>
            <div style={{ fontFamily: C.fMono, fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: .6 }}>{label}</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 15, fontWeight: 800, color: C.text, marginTop: 1 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ width: m.effort_label === 'hard' ? '82%' : m.effort_label === 'moderate' ? '58%' : '32%', height: '100%', background: effortColor, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function ReadinessGauge({ score, label, color }) {
  const size = 98;
  const displayScore = Math.min(score || 0, 100);
  const r = 38;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dashLen = circ * (displayScore / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.border} strokeWidth={8} strokeLinecap="round" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color || C.green} strokeWidth={8}
        strokeDasharray={`${dashLen} ${circ}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cx})`} />
      <text x={cx} y={cx + 1} textAnchor="middle" fill="#0d1838" fontSize={26} fontWeight={800} fontFamily={C.fDisplay}>{displayScore}%</text>
      <text x={cx} y={cx + 22} textAnchor="middle" fill={color || C.green} fontSize={13} fontWeight={700} fontFamily={C.fBody}>{label}</text>
    </svg>
  );
}

function readinessVerdict(recovery, fatigue, watchSummary) {
  if (!recovery) return {
    title: 'Today: Log data',
    status: 'Scheduled',
    color: C.blue,
    body: 'Log health metrics and workouts to get a recommendation.',
    action: 'Start session',
  };
  const highLoad = (fatigue?.level || 0) >= 60 || watchSummary?.hardCount > 0;
  if (recovery.score >= 60 && highLoad) return {
    title: 'Today: Train lighter',
    status: 'High load',
    color: C.red,
    body: watchSummary?.hardCount > 0
      ? 'Recovery is good, but Watch effort and weekly strength load are high. Keep 2-3 reps in reserve.'
      : 'Recovery is good, but this week\'s strength load is high. Keep 2-3 reps in reserve.',
    action: 'Start lighter session',
  };
  if (recovery.score >= 60) return {
    title: 'Today: Good to train',
    status: 'Ready',
    color: C.green,
    body: 'Recovery signals look steady. Train normally and keep form strict.',
    action: 'Start session',
  };
  if (recovery.score >= 38) return {
    title: 'Today: Take it steady',
    status: 'Moderate',
    color: C.amber,
    body: 'Recovery is fair. Cap effort and avoid chasing personal bests today.',
    action: 'Start steady session',
  };
  return {
    title: 'Today: Recovery day',
    status: 'Low recovery',
    color: C.red,
    body: 'Recovery is low. Choose rest, mobility, or very light movement.',
    action: 'Review plan',
  };
}

function readinessChips(recovery, healthData, watchSummary) {
  const chips = [];
  if (recovery?.zHRV != null) chips.push({ icon: 'activity', text: recovery.zHRV >= 0 ? 'HRV above avg' : 'HRV below avg', color: recovery.zHRV >= 0 ? C.green : C.red });
  if (recovery?.zRHR != null) chips.push({ icon: 'heart', text: recovery.zRHR >= 0 ? 'RHR down' : 'RHR up', color: recovery.zRHR >= 0 ? C.green : C.red });
  const sleep = recovery?.sleepScore || computeSleepScore(healthData);
  chips.push({
    icon: sleep ? 'moon' : 'circle-alert',
    text: sleep ? `Sleep ${sleep.label.toLowerCase()}` : 'Sleep missing',
    color: sleep ? sleep.color : C.amber,
  });
  if (watchSummary?.hardCount > 0) chips.push({ icon: 'flame', text: 'Watch effort high', color: C.amber });
  return chips.slice(0, 3);
}

function ReadinessInsightModal({ recovery, fatigue, healthData, watchSummary, onClose }) {
  const verdict = readinessVerdict(recovery, fatigue, watchSummary);
  const chips = readinessChips(recovery, healthData, watchSummary);
  const latestHrv = getLatestReading(healthData?.hrv || []);
  const latestRhr = getLatestReading(healthData?.restingHr || []);
  const latestSleep = getLatestReading(healthData?.sleep || []);
  const sleepScore = recovery?.sleepScore || computeSleepScore(healthData);
  const latestMatch = watchSummary?.latestMatch;
  const rows = [
    { label: 'Recovery score', value: recovery ? `${recovery.score}% · ${recovery.label}` : 'No recovery data yet', color: recovery?.color || C.muted },
    { label: 'HRV', value: latestHrv ? `${Math.round(Number(latestHrv.value) * 10) / 10} ms · ${recovery?.zHRV >= 0 ? 'above baseline' : 'below baseline'}` : 'No HRV reading', color: recovery?.zHRV >= 0 ? C.green : C.red },
    { label: 'Resting HR', value: latestRhr ? `${Math.round(Number(latestRhr.value))} bpm · ${recovery?.zRHR >= 0 ? 'down vs baseline' : 'up vs baseline'}` : 'No resting HR reading', color: recovery?.zRHR >= 0 ? C.green : C.red },
    { label: 'Sleep quality', value: sleepScore ? `${sleepScore.score}% · ${sleepScore.label}` : 'No sleep reading for last night', color: sleepScore?.color || C.amber },
    { label: 'Sleep detail', value: sleepScore?.summary || (latestSleep ? `${Math.round(Number(latestSleep.value) * 10) / 10} h tracked` : 'No sleep stages yet'), color: C.muted },
    { label: 'Watch effort', value: watchSummary?.hardCount > 0 ? `${watchSummary.hardCount} hard matched workout${watchSummary.hardCount === 1 ? '' : 's'} this week` : latestMatch ? 'Latest matched workout was not hard' : 'No matched Watch workout yet', color: watchSummary?.hardCount > 0 ? C.amber : C.muted },
  ];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,18,32,.42)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 430, maxHeight: 'calc(100dvh - 36px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 22px 60px rgba(16,31,54,.24)', padding: '16px 16px 28px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ ...st.label, color: verdict.color, marginBottom: 4 }}>Readiness insight</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 24, color: C.text, lineHeight: 1 }}>{verdict.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${C.border}`, background: C.dim, color: C.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ ...st.card(verdict.color + '10'), borderLeft: `3px solid ${verdict.color}`, marginBottom: 12 }}>
          <div style={{ ...st.label, color: verdict.color, marginBottom: 5 }}>{verdict.status}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{verdict.body}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {chips.map(chip => (
            <span key={chip.text} style={{ ...st.pill(chip.color), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name={chip.icon} size={12} color={chip.color} /> {chip.text}
            </span>
          ))}
        </div>

        <div style={{ ...st.card(), marginBottom: 12 }}>
          <div style={{ ...st.label, marginBottom: 8 }}>Signals used</div>
          {rows.map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.muted }}>{row.label}</div>
              <div style={{ fontSize: 12, color: row.color, textAlign: 'right', fontWeight: 700 }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33' }}>
          <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Recommendation</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
            Pain and recovery gates come first. Sleep now uses duration, efficiency, deep sleep, REM sleep, and awake time where available, so a short but efficient night is treated differently from a restless one.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessSummaryCard({ recovery, fatigue, healthData, watchSummary, setView, onSeeWhy, onWatchTap, onMetricTap, onSleepTap }) {
  const verdict = readinessVerdict(recovery, fatigue, watchSummary);
  const chips = readinessChips(recovery, healthData, watchSummary);
  const metricsByKey = Object.fromEntries(homeMetricDefs(healthData).map(m => [m.key, m]));
  const fatigueLevel = Math.min(100, Math.max(0, fatigue?.level || (verdict.status === 'High load' ? 74 : 38)));
  const filled = Math.max(1, Math.round(fatigueLevel / 14));
  const primaryOpensInsight = verdict.action === 'Review plan';
  function handleChipClick(chip) {
    if (chip.text.startsWith('HRV')) return onMetricTap(metricsByKey.hrv);
    if (chip.text.startsWith('RHR')) return onMetricTap(metricsByKey.restingHr);
    if (chip.text.startsWith('Sleep')) return onSleepTap();
    if (chip.text.includes('Watch')) return onWatchTap();
    return onSeeWhy();
  }
  return (
    <div style={{ ...dash.card({ padding: 16, marginBottom: 10 }) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr', gap: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ReadinessGauge score={recovery?.score || 0} label={recovery?.label || '—'} color={recovery?.color || C.blue} />
          <div style={{ ...dash.label, marginTop: 4, letterSpacing: 1.2 }}>Recovery</div>
        </div>
        <div>
          <div style={dash.h}>{verdict.title}</div>
          <div style={{ fontFamily: C.fBody, fontSize: 13, fontWeight: 800, color: verdict.color, marginTop: 10 }}>{verdict.status}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ height: 6, flex: 1, minWidth: 14, borderRadius: 999, background: i < filled ? verdict.color : C.border }} />
            ))}
          </div>
          <div style={{ ...dash.body, marginTop: 12 }}>{verdict.body}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
        {chips.map(chip => (
          <button key={chip.text} onClick={() => handleChipClick(chip)} style={{ ...dash.chip(chip.color), border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <Icon name={chip.icon} size={13} color={chip.color} />
            <span>{chip.text}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: primaryOpensInsight ? '1fr' : '2fr 1fr', gap: 10, marginTop: 12 }}>
        <button onClick={() => primaryOpensInsight ? onSeeWhy() : setView('workout')} style={{
          border: 'none', borderRadius: 9, padding: '12px 14px', background: C.blue, color: '#fff',
          fontFamily: C.fBody, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 8px 18px rgba(91,157,245,.24)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="dumbbell" size={18} color="#fff" />{primaryOpensInsight ? 'View recovery plan' : verdict.action}</span>
          <Icon name="chevron-right" size={18} color="#fff" />
        </button>
        {!primaryOpensInsight && (
          <button onClick={onSeeWhy} style={{
            border: `1px solid ${C.border}`, borderRadius: 9, padding: '12px 10px', background: '#fff', color: '#0d1838',
            fontFamily: C.fBody, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>See why</button>
        )}
      </div>
    </div>
  );
}

function HomeInsightShell({ title, tone = C.blue, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,18,32,.42)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 430, maxHeight: 'calc(100dvh - 36px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 22px 60px rgba(16,31,54,.24)', padding: '16px 16px 30px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ ...st.label, color: tone, marginBottom: 4 }}>Home insight</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 24, color: C.text, lineHeight: 1 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${C.border}`, background: C.dim, color: C.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function metricInsightCopy(metric, latest, base, caption) {
  const val = Number(latest?.value);
  if (metric.key === 'hrv') return {
    meaning: 'HRV reflects how recovered your nervous system looks compared with your recent baseline. Lower than usual can mean more recovery pressure.',
    recommendation: val && base && val < base ? 'Keep intensity conservative today and avoid chasing personal records.' : 'HRV is not limiting today. Still pair it with resting HR, sleep, pain, and Watch effort.',
  };
  if (metric.key === 'restingHr') return {
    meaning: 'Resting heart rate rising above baseline can show fatigue, stress, illness, dehydration, or poor sleep.',
    recommendation: val && base && val > base ? 'Treat this as a caution signal. Keep training easy unless warm-up feels unusually good.' : 'Resting HR is not a major caution signal today.',
  };
  if (metric.key === 'steps') return {
    meaning: 'Steps show general daily movement. Low steps are context rather than a recovery diagnosis.',
    recommendation: val < 8000 ? 'A gentle walk can help recovery if you feel good, but it should not replace rest if recovery is low.' : 'You have hit your movement target. Keep extra work easy if recovery is low.',
  };
  return {
    meaning: 'Active calories estimate the energy you burned through movement and exercise. More burn can support weight loss; IronLog only treats unusually high burn as extra training-load context.',
    recommendation: val && base && val < base * 0.75
      ? 'Active calories are below your recent average. That is not a recovery problem by itself, but an easy walk can help your weight-loss goal if you feel good.'
      : val && base && val > base * 1.15
        ? 'This was an active day. That is useful for fat loss, but if recovery, sleep, or soreness are poor, keep the next strength session controlled.'
        : 'Active calories are around your usual range. Use strength readiness, sleep, pain, and workout effort to decide how hard to train.',
  };
}

function HomeMetricInsightModal({ metric, healthData, onClose }) {
  const data = metric?.data || [];
  const latest = getLatestReading(data);
  const base = rollingAvg(data, 7);
  const val = Number(latest?.value);
  let caption = 'no data';
  if (metric?.target && Number.isFinite(val)) caption = val >= metric.target ? 'goal hit' : 'below target';
  else if (base && Number.isFinite(val) && metric?.higherBetter === true) caption = val >= base ? 'above 7-day baseline' : 'below 7-day baseline';
  else if (base && Number.isFinite(val) && metric?.higherBetter === false) caption = val <= base ? 'improving vs baseline' : 'above 7-day baseline';
  else if (base && Number.isFinite(val) && metric?.key === 'activeCal') {
    if (val < base * 0.75) caption = 'low movement day';
    else if (val <= base * 1.15) caption = 'usual activity';
    else if (val <= base * 1.45) caption = 'active day';
    else caption = 'very active day';
  }
  else if (base && Number.isFinite(val)) caption = val >= base ? 'above 7-day average' : 'below 7-day average';
  const copy = metricInsightCopy(metric, latest, base, caption);
  const display = !latest ? 'No reading' : metric.key === 'steps'
    ? `${Math.round(val).toLocaleString()} steps`
    : `${Math.round(val * 10) / 10}${metric.unit ? ` ${metric.unit}` : ''}`;
  return (
    <HomeInsightShell title={metric.title} tone={metric.color} onClose={onClose}>
      <div style={{ ...st.card(metric.color + '10'), borderLeft: `3px solid ${metric.color}`, marginBottom: 12 }}>
        <div style={{ ...st.label, color: metric.color, marginBottom: 5 }}>Today</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 26, color: C.text, lineHeight: 1 }}>{display}</div>
        <div style={{ fontSize: 13, color: metric.color, marginTop: 5 }}>{caption}</div>
      </div>
      <div style={{ ...st.card(), marginBottom: 12 }}>
        <div style={{ ...st.label, marginBottom: 8 }}>Recent trend</div>
        <MetricInsightChart metric={metric} data={data} baseline={base} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <div style={{ background: C.dim, borderRadius: 8, padding: 9 }}>
            <div style={{ ...st.label, fontSize: 8 }}>7-day baseline</div>
            <div style={{ ...st.mono(16, C.text) }}>{base ? Math.round(base * 10) / 10 : '—'}</div>
          </div>
          <div style={{ background: C.dim, borderRadius: 8, padding: 9 }}>
            <div style={{ ...st.label, fontSize: 8 }}>Readings</div>
            <div style={{ ...st.mono(16, C.text) }}>{data.length}</div>
          </div>
        </div>
      </div>
      <div style={{ ...st.card(), marginBottom: 12 }}>
        <div style={{ ...st.label, marginBottom: 6 }}>What it means</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{copy.meaning}</div>
      </div>
      <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33' }}>
        <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Recommendation</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{copy.recommendation}</div>
      </div>
    </HomeInsightShell>
  );
}

function formatSleepHours(value) {
  return Number.isFinite(value) ? `${Math.round(value * 10) / 10} h` : '—';
}

function sleepRecommendation(score) {
  if (!score) return 'Export sleep from Health Auto Export to include sleep in readiness.';
  if (score.score >= 60) return 'Sleep is supporting training today. Still keep the plan sensible if HRV, resting HR, pain, or Watch effort disagree.';
  if (score.score >= 38) return 'Sleep is usable but not ideal. Keep the first sets controlled and avoid chasing personal records.';
  return 'Sleep is a limiting factor today. Treat strength work as technique practice, mobility, or recovery unless your warm-up feels unusually good.';
}

function SleepInsightModal({ healthData, onClose }) {
  const score = computeSleepScore(healthData);
  const tone = score?.color || C.amber;
  const rows = score ? [
    ['Sleep score', `${score.score}% · ${score.label}`, score.color],
    ['Total asleep', formatSleepHours(score.totalSleep), C.text],
    ['Efficiency', Number.isFinite(score.efficiency) ? `${Math.round(score.efficiency)}%` : '—', C.text],
    ['Deep sleep', formatSleepHours(score.deep), C.text],
    ['REM sleep', formatSleepHours(score.rem), C.text],
    ['Core sleep', formatSleepHours(score.core), C.text],
    ['Awake time', formatSleepHours(score.awake), Number.isFinite(score.awake) && score.awake > 0.8 ? C.amber : C.text],
  ] : [];
  return (
    <HomeInsightShell title="Sleep" tone={tone} onClose={onClose}>
      <div style={{ ...st.card(tone + '10'), borderLeft: `3px solid ${tone}`, marginBottom: 12 }}>
        <div style={{ ...st.label, color: tone, marginBottom: 5 }}>Last night</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 26, color: C.text, lineHeight: 1 }}>
          {score ? `${score.score}%` : 'No reading'}
        </div>
        <div style={{ fontSize: 13, color: tone, marginTop: 5 }}>
          {score ? `${score.label} sleep quality` : 'Sleep export missing'}
        </div>
      </div>

      <div style={{ ...st.card(), marginBottom: 12 }}>
        <div style={{ ...st.label, marginBottom: 8 }}>Sleep detail</div>
        {score ? rows.map(([label, value, color]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
            <div style={{ fontSize: 12, color, textAlign: 'right', fontWeight: 700 }}>{value}</div>
          </div>
        )) : (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
            No sleep reading is available for the latest health export.
          </div>
        )}
      </div>

      <div style={{ ...st.card(), marginBottom: 12 }}>
        <div style={{ ...st.label, marginBottom: 6 }}>What it means</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
          Sleep quality uses more than hours asleep. IronLog combines duration, sleep efficiency, deep sleep, REM sleep, and awake time where Apple Health exports those stages.
        </div>
      </div>

      <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33' }}>
        <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Recommendation</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{sleepRecommendation(score)}</div>
      </div>
    </HomeInsightShell>
  );
}

function WatchEffortInsightModal({ watchSummary, onClose }) {
  const m = watchSummary?.latestMatch;
  return (
    <HomeInsightShell title="Watch effort" tone={watchSummary?.hardCount > 0 ? C.amber : C.blue} onClose={onClose}>
      <div style={{ ...st.card((watchSummary?.hardCount > 0 ? C.amber : C.blue) + '10'), borderLeft: `3px solid ${watchSummary?.hardCount > 0 ? C.amber : C.blue}`, marginBottom: 12 }}>
        <div style={{ ...st.label, color: watchSummary?.hardCount > 0 ? C.amber : C.blue, marginBottom: 5 }}>This week</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 22, color: C.text }}>{watchSummary?.hardCount || 0} hard matched workout{watchSummary?.hardCount === 1 ? '' : 's'}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>{watchSummary?.totalMinutes || 0} Watch workout minutes · {watchSummary?.totalKcal || 0} kcal</div>
      </div>
      {m ? (
        <div style={{ ...st.card(), marginBottom: 12 }}>
          <div style={{ ...st.label, marginBottom: 8 }}>Latest matched workout</div>
          {[
            ['Workout', m.name || 'Apple Watch workout'],
            ['Match', `${Math.round(Number(m.overlap_ratio || m.confidence || 0) * 100) || '—'}% overlap`],
            ['Duration', `${Math.round((Number(m.watch_duration_sec) || Number(m.duration_sec) || 0) / 60)} min`],
            ['Active energy', `${Math.round(Number(m.active_energy_kcal) || 0)} kcal`],
            ['Heart rate', `${Math.round(Number(m.avg_heart_rate) || 0)} avg · ${Math.round(Number(m.max_heart_rate) || 0)} peak`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
              <div style={{ fontSize: 12, color: C.text, textAlign: 'right', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...st.card(), marginBottom: 12, fontSize: 13, color: C.muted, lineHeight: 1.45 }}>No matched Apple Watch workout is available yet.</div>
      )}
      <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33' }}>
        <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Recommendation</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
          Watch effort is a load signal. When it is high alongside low HRV or elevated resting HR, IronLog recommends recovery or a lighter session.
        </div>
      </div>
    </HomeInsightShell>
  );
}

function TrendInsightModal({ healthData, trendDays, onClose }) {
  const insight = computeTrendInsight(healthData);
  return (
    <HomeInsightShell title="Recovery trend" tone={C.blue} onClose={onClose}>
      <div style={{ ...st.card(), marginBottom: 12 }}>
        <div style={{ ...st.label, marginBottom: 8 }}>{trendDays}-day HRV + resting HR</div>
        <RecoveryTrendChart healthData={healthData} days={trendDays} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 3 }}>
          {chartColorKey(C).map(item => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: C.fMono, fontSize: 7, color: C.muted }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33', marginBottom: 12 }}>
        <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Current read</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{insight || 'Trend needs more readings before it can be interpreted.'}</div>
      </div>
      <div style={{ ...st.card() }}>
        <div style={{ ...st.label, marginBottom: 6 }}>How to use it</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
          Rising HRV with stable or lower resting HR is usually a positive recovery signal. Falling HRV plus elevated resting HR is a reason to reduce intensity.
        </div>
      </div>
    </HomeInsightShell>
  );
}

function homeMetricDefs(healthData) {
  return [
    { key: 'hrv', title: 'HRV', unit: 'ms', color: C.green, data: healthData?.hrv || [], icon: 'heart', higherBetter: true },
    { key: 'restingHr', title: 'Resting HR', unit: 'bpm', color: C.green, data: healthData?.restingHr || [], icon: 'heart', higherBetter: false },
    { key: 'steps', title: 'Steps', unit: '', color: '#ff7a1a', data: healthData?.steps || [], icon: 'footprints', target: 8000 },
    { key: 'activeCal', title: 'Active Cal', unit: 'kcal', color: C.blue, data: healthData?.activeCal || [], icon: 'flame' },
  ];
}

function DailySignalsStrip({ healthData, onMetricTap }) {
  const metricDefs = homeMetricDefs(healthData);
  return (
    <div style={{ ...dash.card({ padding: 0, overflow: 'hidden', marginBottom: 10 }) }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {metricDefs.map((m, idx) => {
          const latest = getLatestReading(m.data);
          const base = rollingAvg(m.data, 7);
          const val = Number(latest?.value);
          let caption = 'no data';
          if (m.target && val) caption = val >= m.target ? 'goal hit' : 'low today';
          else if (base && val && m.higherBetter === true) caption = val >= base ? 'above 7d avg' : 'below avg';
          else if (base && val && m.higherBetter === false) caption = val <= base ? 'improving' : 'above avg';
          else if (base && val && m.key === 'activeCal') {
            if (val < base * 0.75) caption = 'low movement';
            else if (val <= base * 1.15) caption = 'usual activity';
            else if (val <= base * 1.45) caption = 'active day';
            else caption = 'very active';
          }
          else if (base && val) caption = val >= base ? 'above avg' : 'below avg';
          const value = !latest ? '—' : m.key === 'steps'
            ? `${Math.round(val).toLocaleString()} / 8k`
            : `${val % 1 === 0 ? val : Math.round(val * 10) / 10}`;
          return (
            <button key={m.key} onClick={() => onMetricTap && onMetricTap(m)} style={{
              padding: '10px 9px 8px', border: 'none', borderLeft: idx ? `1px solid ${C.border}` : 'none',
              minWidth: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                <Icon name={m.icon} size={13} color={m.color} />
                <span style={{ ...dash.label, fontSize: 8 }}>{m.title}</span>
              </div>
              <div style={{ fontFamily: C.fBody, fontSize: 15, fontWeight: 900, color: '#0d1838', lineHeight: 1 }}>
                {value}{m.unit && m.key !== 'steps' && <span style={{ fontSize: 8, marginLeft: 2, fontWeight: 700 }}>{m.unit}</span>}
              </div>
              <div style={{ fontFamily: C.fBody, fontSize: 10, color: m.color, marginTop: 3 }}>{caption}</div>
              <MetricSparkline data={m.data} color={m.color} height={24} metric={m} baseline={base} />
              <div style={{ ...st.mono(8, C.muted), marginTop: 1 }}>Tap for details</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecoveryTrendCard({ healthData, trendDays, setTrendDays, onTrendTap }) {
  const insight = computeTrendInsight(healthData);
  return (
    <div style={dash.card({ marginBottom: 10 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ ...dash.label, color: '#0d1838' }}>Recovery Trend</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setTrendDays(d)} style={{
              border: 'none', borderRadius: 6, padding: '5px 8px', fontFamily: C.fBody, fontSize: 11,
              fontWeight: 800, background: trendDays === d ? C.blue : C.dim, color: trendDays === d ? '#fff' : C.muted,
            }}>{d}D</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 15, marginBottom: 3, justifyContent: 'center' }}>
        <span style={{ fontFamily: C.fBody, fontSize: 10, color: '#0d1838' }}><span style={{ color: C.blue }}>—</span> HRV (ms)</span>
        <span style={{ fontFamily: C.fBody, fontSize: 10, color: '#0d1838' }}><span style={{ color: C.red }}>—</span> RHR (bpm)</span>
      </div>
      <button onClick={onTrendTap} style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', cursor: 'pointer', textAlign: 'left' }}>
        <RecoveryTrendChart healthData={healthData} days={trendDays} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 3 }}>
          {chartColorKey(C).map(item => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: C.fMono, fontSize: 7, color: C.muted }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          ))}
        </div>
        {insight && <div style={{ display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: C.fBody, fontSize: 13, marginTop: 2 }}>
          <Icon name="circle-check" size={14} color={C.green} />{insight}
        </div>}
        <div style={{ ...st.mono(9, C.muted), textAlign: 'center', marginTop: 3 }}>Tap for details</div>
      </button>
    </div>
  );
}

function ThisWeekSummaryCard({ sessions, rides, watchSummary }) {
  const ws = weekMondayStart();
  const weekSess = sessions.filter(s => s.completed && new Date(s.date) >= ws);
  const weekRides = rides.filter(r => new Date(r.date) >= ws);
  const totalTime = weekSess.reduce((s, sess) => s + (Number(sess.duration) || 0), 0);
  const volume = weekSess.reduce((sum, sess) => sum + (sess.exercises || []).reduce((exSum, ex) =>
    exSum + ex.sets.filter(set => set.done).reduce((setSum, set) => setSum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0), 0);
  const timeLabel = totalTime > 0 ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}m` : watchSummary?.totalMinutes ? `${Math.floor(watchSummary.totalMinutes / 60)}h ${watchSummary.totalMinutes % 60}m` : '—';
  const items = [
    { icon: 'dumbbell', color: C.blue, label: 'Strength', value: weekSess.length, sub: 'sessions' },
    { label: 'Total Volume', value: volume ? `${Math.round(volume / 100) / 10} t` : '—' },
    { icon: 'bike', color: C.green, label: 'Cycling', value: weekRides.length ? `${weekRides.length}` : 'No rides', sub: weekRides.length ? 'rides' : 'this week' },
    { label: 'Total Time', value: timeLabel },
  ];
  return (
    <div style={dash.card({ marginBottom: 10 })}>
      <div style={{ ...dash.label, color: '#0d1838', marginBottom: 12 }}>This Week</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1.15fr 1fr', gap: 8, alignItems: 'center' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0, borderLeft: idx ? `1px solid ${C.border}` : 'none', paddingLeft: idx ? 10 : 0 }}>
            {item.icon && <div style={dash.iconBox(item.color)}><Icon name={item.icon} size={18} color={item.color} /></div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: C.fBody, fontSize: 10, color: C.muted, fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontFamily: C.fBody, fontSize: 15, color: '#0d1838', fontWeight: 900, lineHeight: 1.05 }}>{item.value}</div>
              {item.sub && <div style={{ fontFamily: C.fBody, fontSize: 10, color: C.muted }}>{item.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkoutPlanCard({ sessions, activeSession, selectedWorkout, setSelectedWorkout, allExercises = EXERCISES, workoutCustom = {}, workoutHidden = {}, coachRec, showWhy, setShowWhy, setView, onWarmupOpen, onDemoOpen }) {
  const [showExercises, setShowExercises] = useState(false);
  const [showWarmup, setShowWarmup] = useState(false);
  const [showCooldown, setShowCooldown] = useState(false);
  const suggested = nextWorkout(sessions);
  const wkt = WORKOUTS[selectedWorkout];
  const extraIds = workoutCustom[selectedWorkout] || [];
  const hiddenIds = new Set((workoutHidden || {})[selectedWorkout] || []);
  const allWorkoutExIds = [...wkt.exercises, ...extraIds].filter(id => !hiddenIds.has(id));

  return (
    <div style={{ ...st.card(), marginBottom: 12, borderColor: C.border }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ ...st.label }}>Selected workout</div>
        {!activeSession && (
          <div style={{ display: 'flex', gap: 5 }}>
            {['A', 'B', 'C'].map(key => {
              const active = selectedWorkout === key;
              return (
                <button key={key} onClick={() => { setSelectedWorkout(key); setShowExercises(false); }} style={{
                  background: active ? C.amber : C.dim,
                  color: active ? '#fff' : C.muted,
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontFamily: C.fDisplay,
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}>{key}</button>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={() => setShowExercises(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left', marginBottom: showExercises ? 0 : 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 56, fontFamily: C.fDisplay, fontWeight: 700, color: C.amber, lineHeight: 1, flexShrink: 0 }}>
            {selectedWorkout}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.fDisplay, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.1 }}>
              {wkt.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              {(selectedWorkout === suggested || activeSession) && (
                <span style={{ background: C.amberDim, color: C.amber, fontSize: 10, borderRadius: 4, padding: '2px 6px', fontFamily: C.fMono, textTransform: 'uppercase' }}>
                  {activeSession ? 'active' : 'next'}
                </span>
              )}
              <span style={{ fontSize: 12, color: C.muted, fontFamily: C.fMono }}>
                {activeSession ? 'Session in progress' : `${allWorkoutExIds.length} exercises`}
              </span>
            </div>
          </div>
          <span style={{ color: C.muted, fontSize: 13, flexShrink: 0, paddingRight: 2 }}>{showExercises ? '▲' : '▼'}</span>
        </div>
      </button>

      {showExercises && (
        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8 }}>
            {allWorkoutExIds.map(id => {
              const ex = allExercises[id] || EXERCISES[id];
              const isExtra = extraIds.includes(id);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div onClick={() => onDemoOpen && onDemoOpen(id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <ExerciseIcon id={id} size={36} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: C.text }}>{ex?.name || id}</span>
                  <span style={{ border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 9px', fontSize: 11, color: isExtra ? C.amber : C.muted, fontFamily: C.fMono, whiteSpace: 'nowrap' }}>
                    {isExtra ? '+ Added' : ex?.primaryMuscle || ex?.muscle}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, marginBottom: 10 }}>
            <button onClick={() => setShowWarmup(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <span style={{ ...st.label, fontSize: 10, color: C.muted }}>Warm-Up Routine</span>
              <span style={{ color: C.muted, fontSize: 11, marginLeft: 'auto' }}>{showWarmup ? '▲' : '▼'}</span>
            </button>
            {showWarmup && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {WARMUP.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: C.muted, lineHeight: 1.4, alignItems: 'center' }}>
                    <img src={`assets/icons/warmup/${item.id}.png`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', marginRight: 12, flexShrink: 0, cursor: 'pointer' }} onError={e => { e.target.style.display = 'none'; }} onClick={() => onWarmupOpen && onWarmupOpen(item)} />
                    <span style={{ color: C.amber, fontFamily: C.fMono, minWidth: 16 }}>{i + 1}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, marginBottom: 14 }}>
            <button onClick={() => setShowCooldown(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <span style={{ ...st.label, fontSize: 10, color: C.muted }}>Cool-Down / Finisher</span>
              <span style={{ color: C.muted, fontSize: 11, marginLeft: 'auto' }}>{showCooldown ? '▲' : '▼'}</span>
            </button>
            {showCooldown && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wkt.finisher.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: C.muted, lineHeight: 1.4, alignItems: 'center' }}>
                    <img src={`assets/icons/warmup/${item.id}.png`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', marginRight: 12, flexShrink: 0, cursor: 'pointer' }} onError={e => { e.target.style.display = 'none'; }} onClick={() => onWarmupOpen && onWarmupOpen(item)} />
                    <span style={{ color: C.green, fontFamily: C.fMono, minWidth: 16 }}>{i + 1}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!activeSession && coachRec?.flags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {coachRec.flags.map(flag => (
            <span key={flag.exerciseId} style={{ background: C.amber + '18', color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: C.fMono }}>
              ⚠ {flag.exerciseName}
            </span>
          ))}
        </div>
      )}

      {!activeSession && coachRec && (
        <div style={{ background: '#F0F4FF', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: showWhy ? 8 : 0 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🤖</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#2a3f6f', lineHeight: 1.5 }}>{coachRec.note}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button onClick={() => setShowWhy(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#4A82E8', fontFamily: C.fMono }}>
                  {showWhy ? '✕ Hide' : 'Why? ›'}
                </button>
                {coachRec.flags.length > 0 && (
                  <button onClick={() => setView('preStart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: C.amber, fontFamily: C.fMono }}>
                    Safe swaps ›
                  </button>
                )}
              </div>
            </div>
          </div>
          {showWhy && (
            <div style={{ borderTop: '1px solid #d0daff', paddingTop: 10, marginTop: 2 }}>
              {coachRec.reasons.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: '#4a5a7a', lineHeight: 1.5, marginBottom: 4, paddingLeft: 8 }}>• {r}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <button style={{ ...st.btn(), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        onClick={() => activeSession ? setView('workout') : setView('preStart')}>
        <Icon name="play" size={16} /> {activeSession ? 'Resume Workout' : `Start Workout ${selectedWorkout}`}
      </button>
    </div>
  );
}

function StretchRoutineCard({ setView }) {
  const cfg = getStretchConfig();
  const totalSecs = cfg.reduce((sum, id) => {
    const s = STRETCH_LIBRARY.find(x => x.id === id);
    if (!s) return sum;
    return sum + (s.bilateral ? s.suggestedSecs * 2 : s.suggestedSecs);
  }, 0);
  const mins = Math.round(totalSecs / 60);
  return (
    <div style={{ ...st.card(), marginBottom: 16, padding: '14px 16px' }}>
      <div>
        <div style={{ fontSize: 10, fontFamily: C.fMono, color: C.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Stretch Routine</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Full-Body Flexibility</div>
        <div style={{ fontSize: 12, color: C.muted }}>12 stretches · ≈{mins} min</div>
      </div>
      <button onClick={() => setView('stretch_setup')} style={{ ...st.btn(), marginTop: 12, width: '100%' }}>
        ▶ Start Stretching
      </button>
    </div>
  );
}

function Dashboard({ sessions, rides, setView, activeSession, selectedWorkout, setSelectedWorkout, allExercises = EXERCISES, workoutCustom = {}, workoutHidden = {}, driveSync, onCloudSync, updateAvailable, onWarmupOpen, onDemoOpen, coachRec, showWhy, setShowWhy, healthData, watchData }) {
  const [showReadinessInsight, setShowReadinessInsight] = useState(false);
  const [homeInsight, setHomeInsight] = useState(null);
  const [trendDays, setTrendDays] = useState(7);

  // Recovery computations (only when health data present)
  const hd = healthData || {};
  const hasHealthData = (hd.hrv?.length || hd.restingHr?.length || 0) > 0;
  const recovery  = hasHealthData ? computeRecovery(hd) : null;
  const fatigue   = hasHealthData ? computeFatigue(hd, sessions) : null;
  const trainLoad = computeTrainingLoad(sessions, hd.activeCal || []);
  const insight   = hasHealthData ? computeTrendInsight(hd) : null;
  const watchSummary = summarizeWatchEffort(watchData);

  // Training recommendation — thresholds aligned to new SD-band scoring
  // Readiness combines recovery score (physiology) AND fatigue (workload)
  const trainingRec = (r, f) => {
    if (!r) return { label: 'Scheduled', color: C.blue, detail: 'Log workouts to get a recommendation.' };
    const highFatigue = f && f.level >= 60;
    const modFatigue  = f && f.level >= 30;
    if (r.score >= 60) {
      if (highFatigue || watchSummary.hasRecentHard) return { label: 'Moderate today',  color: C.amber, detail: watchSummary.hasRecentHard ? 'Recovery is good, but Watch effort was high this week — keep effort controlled.' : 'Body is ready, but load is high — consider a lighter session.' };
      if (modFatigue)   return { label: 'Good to train',   color: C.green, detail: 'Ready to train. Keep effort controlled.' };
      return                   { label: 'Good to train',   color: C.green, detail: 'You can push hard today.' };
    }
    if (r.score >= 38) return  { label: 'Take it steady',  color: C.amber, detail: 'Moderate effort. Keep RPE below 8.' };
    return                     { label: 'Recovery day',    color: C.red,   detail: 'Prioritise rest or very light movement.' };
  };
  const rec = trainingRec(recovery, fatigue);

  // Metric strip data — icons use Lucide names
  const hMetrics = [
    { key: 'hrv',       title: 'HRV',        unit: 'ms',    color: C.green, data: hd.hrv,       higherBetter: true,  icon: 'activity' },
    { key: 'restingHr', title: 'Resting HR',  unit: 'bpm',   color: C.red,   data: hd.restingHr, higherBetter: false, icon: 'heart'    },
    { key: 'steps',     title: 'Steps',       unit: '',      color: C.blue,  data: hd.steps,     target: 8000,        icon: 'footprints' },
    { key: 'activeCal', title: 'Active Cal',  unit: 'kcal',  color: C.amber, data: hd.activeCal,                      icon: 'flame'    },
  ];
  const ws = weekStart();
  const weekSessions = sessions.filter(s => new Date(s.date) >= ws);
  const weekRides = rides.filter(r => new Date(r.date) >= ws);
  // Week strip: Mon–Sun cells
  const mondayStart = weekMondayStart();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayStart);
    d.setDate(mondayStart.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const sess = sessions.find(s => s.completed && s.date?.slice(0, 10) === dateStr);
    const ride = rides.find(r => r.date?.slice(0, 10) === dateStr);
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    return { d, dateStr, sess, ride, isToday, dayLetter: ['M','T','W','T','F','S','S'][i] };
  });
  const recent = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const lastSyncTime = driveSync?.lastCloudSync
    ? new Date(driveSync.lastCloudSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : 'not yet';
  const cloudLabel = driveSync?.cloudStatus === 'syncing'
    ? 'Supabase syncing...'
    : driveSync?.cloudStatus === 'error'
      ? 'Supabase sync failed'
      : `Supabase auto-sync on · Last synced ${lastSyncTime}`;

  return (
    <div style={dash.page}>

      {/* ── Greeting header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 28, fontWeight: 800, color: '#0d1838', lineHeight: 0.95 }}>
            {timeGreeting()}, Phill
          </div>
          <div style={{ fontFamily: C.fBody, fontSize: 13, color: C.muted, marginTop: 5 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => window.location.reload(true)}
          title={updateAvailable ? 'Update available' : 'Check for updates'}
          style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, width: 42, height: 42, cursor: 'pointer',
            color: updateAvailable ? C.blue : '#0d1838', fontSize: 18, boxShadow: '0 8px 20px rgba(32,55,85,.08)', position: 'relative',
            animation: updateAvailable ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
          ↺
          {updateAvailable && <span style={{ position: 'absolute', right: 7, top: 7, width: 6, height: 6, borderRadius: '50%', background: C.blue }} />}
        </button>
        {updateAvailable && <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>}
      </div>

      <ReadinessSummaryCard
        recovery={recovery}
        fatigue={fatigue}
        healthData={hd}
        watchSummary={watchSummary}
        setView={setView}
        onSeeWhy={() => setShowReadinessInsight(true)}
        onWatchTap={() => setHomeInsight({ type: 'watch' })}
        onMetricTap={metric => setHomeInsight({ type: 'metric', metric })}
        onSleepTap={() => setHomeInsight({ type: 'sleep' })}
      />
      {showReadinessInsight && (
        <ReadinessInsightModal
          recovery={recovery}
          fatigue={fatigue}
          healthData={hd}
          watchSummary={watchSummary}
          onClose={() => setShowReadinessInsight(false)}
        />
      )}
      {homeInsight?.type === 'metric' && (
        <HomeMetricInsightModal metric={homeInsight.metric} healthData={hd} onClose={() => setHomeInsight(null)} />
      )}
      {homeInsight?.type === 'watch' && (
        <WatchEffortInsightModal watchSummary={watchSummary} onClose={() => setHomeInsight(null)} />
      )}
      {homeInsight?.type === 'sleep' && (
        <SleepInsightModal healthData={hd} onClose={() => setHomeInsight(null)} />
      )}
      {homeInsight?.type === 'trend' && (
        <TrendInsightModal healthData={hd} trendDays={trendDays} onClose={() => setHomeInsight(null)} />
      )}
      {hasHealthData && <DailySignalsStrip healthData={hd} onMetricTap={metric => setHomeInsight({ type: 'metric', metric })} />}
      {hasHealthData && (hd.hrv?.length > 1 || hd.restingHr?.length > 1) && (
        <RecoveryTrendCard healthData={hd} trendDays={trendDays} setTrendDays={setTrendDays} onTrendTap={() => setHomeInsight({ type: 'trend' })} />
      )}
      {/* 7-day week strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
        {weekDays.map(({ dayLetter, sess, ride, isToday, dateStr }) => (
          <div key={dateStr} style={{
            ...st.card(),
            padding: '8px 4px',
            textAlign: 'center',
            borderColor: isToday ? C.amber : C.border,
            background: isToday ? C.amberDim : C.card,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{ ...st.label, fontSize: 9 }}>{dayLetter}</div>
            {sess ? (
              <div style={{ fontSize: 11, fontFamily: C.fDisplay, color: C.amber, lineHeight: 1 }}>{workoutDisplay(sess).badge}✓</div>
            ) : ride ? (
              <div style={{ fontSize: 12, lineHeight: 1 }}>🚴</div>
            ) : (
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1 }}>–</div>
            )}
          </div>
        ))}
      </div>
      <ThisWeekSummaryCard sessions={sessions} rides={rides} watchSummary={watchSummary} />

      {/* ── Weekly Activity + Recent Workouts side by side ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 auto', width: 'calc(45% - 4px)' }}>
          <WeeklyHeatmap sessions={sessions} rides={rides} healthData={hd} />
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <RecentWorkoutsSection sessions={sessions} rides={rides} setView={setView} />
        </div>
      </div>

      {/* Cloud sync status */}
      {driveSync && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16,
        }}>
          <Icon name={driveSync.cloudStatus === 'error' ? 'alert-circle' : 'check-circle'} size={16} color={driveSync.cloudStatus === 'error' ? C.red : C.green} />
          <span style={{ flex: 1, fontSize: 13, color: C.muted, minWidth: 0 }}>
            {cloudLabel}
          </span>
          <button onClick={onCloudSync} style={{ ...st.btnSm(C.dim, C.muted), padding: '4px 10px', fontSize: 11, flexShrink: 0 }}>
            Sync now
          </button>
        </div>
      )}

      {/* Recent sessions */}
      {recent.length > 0 && (
        <>
          <div style={{ ...st.label, marginBottom: 8 }}>Recent</div>
          <div style={{ ...st.col() }}>
            {recent.map(sess => {
              const display = workoutDisplay(sess);
              return (
                <div key={sess.id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
                  <div style={{ ...st.row }}>
                    <span style={{ fontFamily: C.fDisplay, fontSize: 26, color: C.amber, minWidth: 22 }}>{display.badge}</span>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: C.fDisplay, textTransform: 'uppercase', letterSpacing: 0.5 }}>{display.title}</div>
                      {display.subtitle && <div style={{ fontSize: 11, color: C.muted }}>{display.subtitle}</div>}
                      <div style={{ ...st.mono(11, C.muted) }}>{fmtDate(sess.date)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {sess.duration && <div style={{ ...st.mono(12, C.muted) }}>{sess.duration}min</div>}
                    {sess.energy && <div style={{ fontSize: 16 }}>{['😴','😕','😐','💪','🔥'][sess.energy - 1]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SET ROW
// ═══════════════════════════════════════════════════════════════════════
function SetRow({ num, set, def, onUpdate, onStart, onDone, nowMs }) {
  const done = set.done;
  const started = !!set.setStartedAt && !done;
  const setElapsed = started ? Math.max(0, Math.floor((nowMs - new Date(set.setStartedAt).getTime()) / 1000)) : 0;
  const isTimed = def.isTimed;
  const isBW = def.unit === 'bw' || def.unit === 'band';
  const isPullup = !!def.pullupTracking;
  const pullupMode = set.mode || 'bw'; // 'bw' | 'band' | 'neg'

  const gridCols = isTimed
    ? '36px minmax(52px,1fr) 56px 56px 64px'
    : (isBW && !isPullup)
      ? '36px minmax(48px,.8fr) minmax(48px,1fr) 56px 56px 64px'
      : isPullup && pullupMode === 'band'
        ? '36px minmax(0,1.2fr) minmax(48px,.8fr) 56px 56px 64px'
        : isPullup && pullupMode === 'neg'
          ? '36px minmax(48px,.8fr) minmax(48px,.8fr) 56px 56px 64px'
          : isPullup
            ? '36px minmax(48px,.8fr) minmax(48px,1fr) 56px 56px 64px'
            : '36px minmax(0,1fr) minmax(0,1fr) 56px 56px 64px';
  const loadLabel = def.unit === 'band' ? 'BAND' : 'BW';

  return (
    <div style={{ background: done ? C.green + '12' : C.dim, border: `1px solid ${done ? C.green + '44' : C.border}`, borderRadius: 6, padding: '8px 10px' }}>

      {/* Pullup mode toggle */}
      {isPullup && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[['bw', 'Unassisted'], ['band', 'Band'], ['neg', 'Negatives']].map(([m, label]) => (
            <button key={m} onClick={() => !done && onUpdate('mode', m)} style={{
              flex: 1, padding: '4px 0', fontSize: 10, fontFamily: C.fMono,
              background: pullupMode === m ? C.amber : C.bg,
              color: pullupMode === m ? '#0a0f28' : C.muted,
              border: `1px solid ${pullupMode === m ? C.amber : C.border}`,
              borderRadius: 4, cursor: done ? 'default' : 'pointer', letterSpacing: 0.5,
            }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 5, alignItems: 'center' }}>
        <div style={{ fontFamily: C.fMono, fontSize: started ? 10 : 13, color: done ? C.green : started ? C.blue : C.muted, textAlign: 'center', fontWeight: 700, lineHeight: 1.1 }}>
          {done ? '✓' : started ? fmtTimer(setElapsed) : num}
        </div>

        {isTimed ? (
          <input type="number" inputMode="numeric" value={set.duration} onChange={e => onUpdate('duration', e.target.value)}
            style={{ ...st.inp }} placeholder="sec" />
        ) : isPullup && pullupMode === 'band' ? (
          <input type="text" value={set.band || ''} onChange={e => onUpdate('band', e.target.value)}
            style={{ ...st.inp, fontSize: 11 }} placeholder="band" />
        ) : isPullup && pullupMode === 'neg' ? (
          <input type="number" inputMode="numeric" value={set.duration || ''} onChange={e => onUpdate('duration', e.target.value)}
            style={{ ...st.inp }} placeholder="sec" />
        ) : isBW ? (
          <div style={{ ...st.inp, color: C.muted, fontSize: 10, lineHeight: '34px', border: `1px solid ${C.border}` }}>{loadLabel}</div>
        ) : (
          <input type="number" inputMode="decimal" value={set.weight} onChange={e => onUpdate('weight', e.target.value)}
            style={{ ...st.inp }} placeholder="kg" />
        )}

        {!isTimed && !isBW && (
          <input type="number" inputMode="numeric" value={set.reps} onChange={e => onUpdate('reps', e.target.value)}
            style={{ ...st.inp }} placeholder="reps" />
        )}
        {(isTimed || isBW) && (
          <input type="number" inputMode="numeric" value={set.reps} onChange={e => onUpdate('reps', e.target.value)}
            style={{ ...st.inp, display: isTimed ? 'none' : 'block' }} placeholder="reps" />
        )}

        <select value={set.rpe ?? ''} onChange={e => onUpdate('rpe', e.target.value ? +e.target.value : null)}
          style={{ ...st.inp, fontSize: 12 }}>
          <option value=''>RPE</option>
          {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <select value={set.pain ?? ''} onChange={e => onUpdate('pain', e.target.value !== '' ? +e.target.value : null)}
          style={{ ...st.inp, fontSize: 12, borderColor: set.pain >= 3 ? C.red + '88' : C.border }}>
          <option value=''>Pain</option>
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <button onClick={done ? undefined : started ? onDone : onStart} disabled={done} style={{
          background: done ? C.green + '33' : started ? C.blue : C.amber, border: 'none', borderRadius: 4,
          padding: '7px 0', cursor: done ? 'default' : 'pointer', fontSize: 11, width: '100%',
          color: started ? '#fff' : '#0a0f28', fontFamily: C.fMono, fontWeight: 800, textTransform: 'uppercase',
        }}>
          {done ? '✓' : started ? 'Done' : 'Start'}
        </button>
      </div>
      {started && (
        <div style={{ ...st.mono(10, C.blue), marginTop: 5, textAlign: 'right' }}>
          Set running · tap Done when finished
        </div>
      )}

      {!isTimed && !isBW && (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 5, marginTop: 3 }}>
          <div/><div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>kg</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>reps</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>rpe</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>pain</div>
          <div/>
        </div>
      )}
      {(isTimed || isBW) && !isPullup && (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 5, marginTop: 3 }}>
          <div/><div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>{isTimed ? 'secs' : loadLabel.toLowerCase()}</div>
          {isBW && <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>reps</div>}
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>rpe</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>pain</div>
          <div/>
        </div>
      )}
      {isPullup && (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 5, marginTop: 3 }}>
          <div/>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>
            {pullupMode === 'band' ? 'band' : pullupMode === 'neg' ? 'sec/rep' : 'bw'}
          </div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>reps</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>rpe</div>
          <div style={{ ...st.label, fontSize: 9, textAlign: 'center' }}>pain</div>
          <div/>
        </div>
      )}

      {set.pain >= 3 && (
        <div style={{ marginTop: 6, background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 4, padding: '6px 10px', fontSize: 12, color: C.red }}>
          ⚠ Pain ≥ 3/10 — stop or swap this exercise
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WARMUP SETUP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// Small thumbnail used in setup rows and picker cards.
// Shows the PNG icon if available, falls back to group emoji.
function StretchThumb({ stretch, group, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = stretch?.imageDir ? `assets/icons/${stretch.imageDir}/${stretch.id}.png` : null;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.dim, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {src && !imgFailed
        ? <img src={src} style={{ width: size, height: size, objectFit: 'contain' }} onError={() => setImgFailed(true)} alt="" />
        : <span style={{ fontSize: size * 0.45 }}>{group?.emoji || '🧘'}</span>
      }
    </div>
  );
}

// Screen 1: compact rows showing the 8 selected stretches.
// onChangeSlot(i) — user tapped Change on row i
// onBegin() — user tapped Begin Warm-Up
// onSkip() — user tapped Skip Warm-Up
// onReset() — user tapped Reset to defaults
function WarmupSetup({ workout, onChangeSlot, onBegin, onSkip, onReset }) {
  const config = getWarmupConfig(workout);
  const stretches = config.map(id => STRETCH_LIBRARY.find(s => s.id === id)).filter(Boolean);

  const totalSecs = WARMUP_GROUPS.reduce((acc, group, i) => {
    const s = stretches[i];
    if (!s) return acc;
    return acc + s.suggestedSecs * (s.bilateral ? 2 : 1);
  }, 0);
  const estMin = Math.max(1, Math.round(totalSecs / 60));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div style={{ padding: '8px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={st.label}>Workout {workout}</div>
        <div style={{ ...st.h2, marginTop: 2 }}>Warm-Up Stretches</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fBody, marginTop: 2 }}>Tap Change to swap any stretch</div>
      </div>

      {/* Rows */}
      {WARMUP_GROUPS.map((group, i) => {
        const stretch = stretches[i] || STRETCH_LIBRARY.find(s => s.id === group.defaultId);
        return (
          <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
            <StretchThumb stretch={stretch} group={group} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={st.label}>{group.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: C.fDisplay, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.text }}>
                {stretch?.name || group.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fBody }}>{fmtStretchDur(stretch)}</div>
            </div>
            <button
              onClick={() => onChangeSlot(i)}
              style={{ fontSize: 10, background: C.dim, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', flexShrink: 0, fontFamily: C.fMono, letterSpacing: 0.5 }}
            >
              Change
            </button>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={st.btn()} onClick={onBegin}>▶ Begin Warm-Up (≈{estMin} min)</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...st.ghost, flex: 1 }} onClick={onReset}>Reset to defaults</button>
          <button style={{ ...st.ghost, flex: 1 }} onClick={onSkip}>Skip Warm-Up</button>
        </div>
      </div>
    </div>
  );
}

// Screen 2: full-screen overlay showing all options for one muscle group.
// slotIndex — which WARMUP_GROUPS slot is being edited (0–7)
// onSelect(stretchId) — user picked a stretch; saves and returns to setup
// onBack() — user pressed ← without selecting; returns to setup
function WarmupPicker({ workout, slotIndex, onSelect, onBack }) {
  const group = WARMUP_GROUPS[slotIndex];
  const config = getWarmupConfig(workout);
  const selectedId = config[slotIndex];

  const options = group.options
    .map(id => STRETCH_LIBRARY.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 1 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.amber, fontSize: 22, cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <div style={st.label}>Choose stretch · {group.label}</div>
          <div style={{ ...st.h2, fontSize: 20, marginTop: 1 }}>{group.label}</div>
        </div>
      </div>

      {/* Option cards */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(s => {
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => { saveWarmupChoice(workout, slotIndex, s.id); onSelect(s.id); }}
              style={{
                background: isSelected ? C.amberDim : C.card,
                border: `1px solid ${isSelected ? C.amber : C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <StretchThumb stretch={s} group={group} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: C.fDisplay, textTransform: 'uppercase', color: C.text }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fBody, marginTop: 1 }}>
                  {fmtStretchDur(s)}
                </div>
                {(s.sciatica || s.cross_legged || s.caution) && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {s.sciatica     && <span style={st.pill(C.purple)}>Sciatica</span>}
                    {s.cross_legged && <span style={st.pill(C.green)}>Cross-legged</span>}
                    {s.caution      && <span style={st.pill(C.red)}>⚠ Caution</span>}
                  </div>
                )}
              </div>
              {isSelected && <span style={{ color: C.amber, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WARMUP ACTIVE — Screen 3: guided execution, one stretch at a time
// ═══════════════════════════════════════════════════════════════════════

// Screen 3: guided execution — one stretch at a time with countdown timer.
// workout — the workout key ('A', 'B', 'C')
// onComplete() — called when all stretches are done or skipped
function WarmupActive({ workout, onComplete }) {
  const config = getWarmupConfig(workout);
  const stretches = WARMUP_GROUPS.map((group, i) => {
    const id = config[i];
    return STRETCH_LIBRARY.find(s => s.id === id)
        || STRETCH_LIBRARY.find(s => s.id === group.defaultId);
  }).filter(Boolean);

  const [index, setIndex]           = useState(0);
  const [timeLeft, setTimeLeft]     = useState(null);
  const [side, setSide]             = useState(1);       // 1 = first side, 2 = second side
  const [showSwitch, setShowSwitch] = useState(false);   // bilateral side-switch message
  const [running, setRunning]       = useState(false);   // timer only ticks when true

  const current = stretches[index] || null;

  // Reset to paused state whenever the stretch index changes
  useEffect(() => {
    if (!current) { onComplete(); return; }
    setTimeLeft(current.suggestedSecs);
    setSide(1);
    setShowSwitch(false);
    setRunning(false);   // always start paused — user must press Start
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick down every second — only when running
  useEffect(() => {
    if (!running || timeLeft === null || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, running]);

  // Refs to avoid stale closures in the at-zero handler
  const currentRef   = useRef(current);
  const sideRef      = useRef(side);
  const indexRef     = useRef(index);
  const stretchesRef = useRef(stretches);
  useEffect(() => { currentRef.current   = current;   }, [current]);
  useEffect(() => { sideRef.current      = side;      }, [side]);
  useEffect(() => { indexRef.current     = index;     }, [index]);
  useEffect(() => { stretchesRef.current = stretches; }, [stretches]);

  // Handle timer reaching zero — only fires when actively running
  useEffect(() => {
    if (!running || timeLeft !== 0) return;
    const s = currentRef.current;
    if (!s) { onComplete(); return; }

    if (s.bilateral && sideRef.current === 1) {
      // Side 1 done — signal Switch Sides; separate useEffect handles the 1.5s auto-start
      setShowSwitch(true);
      setRunning(false);
      return;
    }

    // Both sides (or unilateral) done — brief pause then advance to next stretch (paused)
    const id = setTimeout(() => {
      const nextIndex = indexRef.current + 1;
      if (nextIndex < stretchesRef.current.length) {
        setIndex(nextIndex);   // index useEffect will reset running=false
      } else {
        onComplete();
      }
    }, 500);
    return () => clearTimeout(id);
  }, [timeLeft, running]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch Sides: auto-start side 2 after 1.5s — isolated so setRunning(false) can't cancel it
  useEffect(() => {
    if (!showSwitch) return;
    const s = currentRef.current;
    if (!s) return;
    const switchId = setTimeout(() => {
      setShowSwitch(false);
      setSide(2);
      setTimeLeft(s.suggestedSecs);
      setRunning(true);
    }, 1500);
    return () => clearTimeout(switchId);
  }, [showSwitch]); // eslint-disable-line react-hooks/exhaustive-deps

  function advance() {
    const nextIndex = index + 1;
    if (nextIndex < stretches.length) {
      setIndex(nextIndex);
    } else {
      onComplete();
    }
  }

  function startTimer() {
    setShowSwitch(false);
    setRunning(true);
  }

  if (!current) return null;

  const totalSecs = current.suggestedSecs;
  const circumference = 326.7; // 2π × 52 (radius of SVG ring at 120×120)
  const elapsed = totalSecs - (timeLeft ?? totalSecs);
  // arcOffset=0 → full ring visible (start); arcOffset=circumference → ring empty (end)
  const arcOffset = circumference * (elapsed / totalSecs);

  const isLast = index === stretches.length - 1;
  const nextGroupLabel = !isLast ? WARMUP_GROUPS[index + 1]?.label : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {stretches.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < index ? C.green : i === index ? C.amber : C.border, flexShrink: 0 }} />
          ))}
        </div>
        <div style={st.label}>{index + 1} of {stretches.length}</div>
        <button
          onClick={onComplete}
          style={{ background: 'none', border: 'none', color: C.muted, fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', padding: 0 }}
        >
          Skip all →
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px 24px 8px', gap: 2 }}>
        <StretchThumb stretch={current} group={WARMUP_GROUPS[index]} size={90} />

        <div style={{ ...st.label, marginTop: 10 }}>{WARMUP_GROUPS[index]?.label}</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 24, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5, marginTop: 2 }}>
          {current.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fBody }}>
          {current.bilateral ? `${current.suggestedSecs}s each side` : `${current.suggestedSecs}s`}
          {current.bilateral && side === 2 && ' — side 2'}
        </div>

        {/* Countdown ring */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '10px 0' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke={C.border} strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={C.amber} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fMono, fontSize: 36, fontWeight: 700, color: C.amber }}>
            {timeLeft ?? totalSecs}
          </div>
        </div>

        {/* Cue or switch-sides message */}
        {showSwitch ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 20, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1 }}>Switch Sides</div>
          </div>
        ) : current.cue ? (
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.fBody, textAlign: 'center', lineHeight: 1.6, maxWidth: 280, fontStyle: 'italic' }}>
            {current.cue}
          </div>
        ) : null}
      </div>

      {/* Footer — Start when paused, Next when running, Skip-only during side-switch */}
      <div style={{ padding: '12px 16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {running ? (
          <>
            <button style={st.btn()} onClick={advance}>
              {isLast ? '→ Begin Workout' : `→ Next: ${nextGroupLabel}`}
            </button>
            <button style={st.ghost} onClick={advance}>
              Skip this stretch
            </button>
          </>
        ) : showSwitch ? (
          // Side-switch window — auto-start incoming, just offer escape
          <button style={st.ghost} onClick={advance}>
            {isLast ? 'Skip → Begin Workout' : `Skip → ${nextGroupLabel || 'next'}`}
          </button>
        ) : (
          <>
            <button style={st.btn()} onClick={startTimer}>
              ▶ Start
            </button>
            <button style={st.ghost} onClick={advance}>
              {isLast ? 'Skip → Begin Workout' : `Skip → ${nextGroupLabel || 'next'}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STRETCH ROUTINE — Screen 2: full-screen picker for one slot
// ═══════════════════════════════════════════════════════════════════════
// group     — the STRETCH_GROUPS entry for the slot being edited
// currentId — currently selected stretch ID for this slot
// onSelect(stretchId) — user picked a stretch; caller saves and closes
// onBack()  — user pressed ← without selecting; closes overlay
function StretchPicker({ group, currentId, onSelect, onBack }) {
  const options = group.options
    .map(id => STRETCH_LIBRARY.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Sticky header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 1 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.amber, fontSize: 22, cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <div style={st.label}>Choose stretch · {group.label}</div>
          <div style={{ ...st.h2, fontSize: 20, marginTop: 1 }}>{group.label}</div>
        </div>
      </div>

      {/* Option cards */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        {options.map(s => {
          const isSelected = s.id === currentId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                background: isSelected ? C.amberDim : C.card,
                border: `1px solid ${isSelected ? C.amber : C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <StretchThumb stretch={s} group={group} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: C.fDisplay, textTransform: 'uppercase', color: C.text }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fBody, marginTop: 1 }}>
                  {fmtStretchDur(s)}
                </div>
                {(s.sciatica || s.cross_legged || s.caution) && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {s.sciatica     && <span style={st.pill(C.purple)}>Sciatica</span>}
                    {s.cross_legged && <span style={st.pill(C.green)}>Cross-legged</span>}
                    {s.caution      && <span style={st.pill(C.red)}>⚠ Caution</span>}
                  </div>
                )}
              </div>
              {isSelected && <span style={{ color: C.amber, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STRETCH ROUTINE — Screen 1: setup (review and customise 12 slots)
// ═══════════════════════════════════════════════════════════════════════
// onBegin() — user tapped Begin Stretching → navigate to StretchActive
// onSkip()  — user tapped Skip → navigate back to dashboard
function StretchSetup({ onBegin, onSkip }) {
  const [config, setConfig] = useState(() => getStretchConfig());
  const [pickerSlot, setPickerSlot] = useState(null); // null = closed; 0–11 = slot being edited

  const totalSecs = STRETCH_GROUPS.reduce((acc, group, i) => {
    const s = STRETCH_LIBRARY.find(x => x.id === config[i]);
    if (!s) return acc;
    return acc + s.suggestedSecs * (s.bilateral ? 2 : 1);
  }, 0);
  const estMin = Math.max(1, Math.round(totalSecs / 60));

  const handleReset = () => {
    resetStretchConfig();
    setConfig(STRETCH_GROUPS.map(g => g.defaultId));
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div style={{ padding: '8px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...st.h2, marginTop: 2 }}>Full-Body Flexibility</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fBody, marginTop: 2 }}>Tap Change to swap any stretch</div>
      </div>

      {/* Rows */}
      {STRETCH_GROUPS.map((group, i) => {
        const stretch = STRETCH_LIBRARY.find(s => s.id === config[i])
                     || STRETCH_LIBRARY.find(s => s.id === group.defaultId);
        return (
          <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
            <StretchThumb stretch={stretch} group={group} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={st.label}>{group.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: C.fDisplay, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.text }}>
                {stretch?.name || group.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fBody }}>{fmtStretchDur(stretch)}</div>
            </div>
            <button
              onClick={() => setPickerSlot(i)}
              style={{ fontSize: 10, background: C.dim, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', flexShrink: 0, fontFamily: C.fMono, letterSpacing: 0.5 }}
            >
              Change
            </button>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={st.btn()} onClick={onBegin}>▶ Begin Stretching (≈{estMin} min)</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...st.ghost, flex: 1 }} onClick={handleReset}>Reset to defaults</button>
          <button style={{ ...st.ghost, flex: 1 }} onClick={onSkip}>Skip</button>
        </div>
      </div>

      {/* Picker overlay — position:fixed so it floats over everything */}
      {pickerSlot !== null && (
        <StretchPicker
          group={STRETCH_GROUPS[pickerSlot]}
          currentId={config[pickerSlot]}
          onSelect={id => {
            saveStretchChoice(pickerSlot, id);
            setConfig(c => c.map((x, j) => j === pickerSlot ? id : x));
            setPickerSlot(null);
          }}
          onBack={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STRETCH ROUTINE — Screen 3: guided execution with countdown timer
// ═══════════════════════════════════════════════════════════════════════
// onDone() — called when all stretches complete or user taps Skip all
function StretchActive({ onDone }) {
  // Build stretch list once on mount from saved config
  const stretchesRef = useRef(null);
  const stretchesListRef = useRef([]);
  if (!stretchesRef.current) {
    stretchesRef.current = STRETCH_GROUPS.map((group, i) => {
      const id = getStretchConfig()[i];
      return STRETCH_LIBRARY.find(s => s.id === id)
          || STRETCH_LIBRARY.find(s => s.id === group.defaultId);
    }).filter(Boolean);
    stretchesListRef.current = stretchesRef.current;
  }
  const stretches = stretchesRef.current;

  const [index, setIndex]           = useState(0);
  const [timeLeft, setTimeLeft]     = useState(null);
  const [side, setSide]             = useState(1);       // 1 = first side, 2 = second
  const [showSwitch, setShowSwitch] = useState(false);   // bilateral side-switch indicator
  const [running, setRunning]       = useState(false);   // timer ticks only when true
  const [stretchModal, setStretchModal] = useState(null);   // stretch object → animation modal
  const [stretchYtModal, setStretchYtModal] = useState(null); // stretch object → YouTube modal

  const current = stretches[index] || null;

  // Reset to paused state whenever index changes
  useEffect(() => {
    if (!current) { onDone(); return; }
    setTimeLeft(current.suggestedSecs);
    setSide(1);
    setShowSwitch(false);
    setRunning(false);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick down every second — only when running
  useEffect(() => {
    if (!running || timeLeft === null || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, running]);

  // Refs to avoid stale closures in the at-zero handler
  const currentRef = useRef(current);
  const sideRef    = useRef(side);
  const indexRef   = useRef(index);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { sideRef.current    = side;    }, [side]);
  useEffect(() => { indexRef.current   = index;   }, [index]);

  // Handle timer reaching zero — only fires when actively running
  useEffect(() => {
    if (!running || timeLeft !== 0) return;
    const s = currentRef.current;
    if (!s) { onDone(); return; }

    if (s.bilateral && sideRef.current === 1) {
      // Side 1 done — signal Switch Sides; separate useEffect handles the 1.5s auto-start
      setShowSwitch(true);
      setRunning(false);
      return;
    }

    // Unilateral or side 2 done — 0.5s pause then advance (paused)
    const id = setTimeout(() => {
      const next = indexRef.current + 1;
      if (next < stretchesListRef.current.length) {
        setIndex(next);
      } else {
        onDone();
      }
    }, 500);
    return () => clearTimeout(id);
  }, [timeLeft, running]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch Sides: auto-start side 2 after 1.5s — isolated so setRunning(false) can't cancel it
  useEffect(() => {
    if (!showSwitch) return;
    const s = currentRef.current;
    if (!s) return;
    const switchId = setTimeout(() => {
      setShowSwitch(false);
      setSide(2);
      setTimeLeft(s.suggestedSecs);
      setRunning(true);
    }, 1500);
    return () => clearTimeout(switchId);
  }, [showSwitch]); // eslint-disable-line react-hooks/exhaustive-deps

  function advance() {
    const next = index + 1;
    if (next < stretches.length) {
      setIndex(next);
    } else {
      onDone();
    }
  }

  function startTimer() {
    setShowSwitch(false);
    setRunning(true);
  }

  if (!current) return null;

  const totalSecs     = current.suggestedSecs;
  const circumference = 326.7; // 2π × 52
  const elapsed       = totalSecs - (timeLeft ?? totalSecs);
  const arcOffset     = circumference * (elapsed / totalSecs);

  const isLast         = index === stretches.length - 1;
  const nextGroupLabel = !isLast ? STRETCH_GROUPS[index + 1]?.label : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {stretches.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < index ? C.green : i === index ? C.amber : C.border, flexShrink: 0 }} />
          ))}
        </div>
        <div style={st.label}>{index + 1} of {stretches.length}</div>
        <button
          onClick={onDone}
          style={{ background: 'none', border: 'none', color: C.muted, fontFamily: C.fMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', padding: 0 }}
        >
          Skip all →
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px 24px 8px', gap: 2 }}>
        <div onClick={() => setStretchModal(current)} style={{ cursor: 'pointer' }}>
          <StretchThumb stretch={current} group={STRETCH_GROUPS[index]} size={90} />
        </div>

        <div style={{ ...st.label, marginTop: 10 }}>{STRETCH_GROUPS[index]?.label}</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 24, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5, marginTop: 2 }}>
          {current.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fBody }}>
          {current.bilateral ? `${current.suggestedSecs}s each side` : `${current.suggestedSecs}s`}
          {current.bilateral && side === 2 && ' — side 2'}
        </div>

        {/* Countdown ring */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '10px 0' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke={C.border} strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={C.amber} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.fMono, fontSize: 36, fontWeight: 700, color: C.amber }}>
            {timeLeft ?? totalSecs}
          </div>
        </div>

        {/* Cue text or Switch Sides indicator */}
        {showSwitch ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 20, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1 }}>Switch Sides</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {current.cue && (
              <div style={{ fontSize: 12, color: C.muted, fontFamily: C.fBody, textAlign: 'center', lineHeight: 1.6, maxWidth: 280, fontStyle: 'italic' }}>
                {current.cue}
              </div>
            )}
            {current.demoId && (
              <button onClick={() => setStretchYtModal(current)}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: C.amber, cursor: 'pointer', fontFamily: C.fBody }}>
                ▶ Watch demo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer — three states: paused / running / switch-sides window */}
      <div style={{ padding: '12px 16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {running ? (
          <>
            <button style={st.btn()} onClick={advance}>
              {isLast ? '→ Finish' : `→ Next: ${nextGroupLabel}`}
            </button>
            <button style={st.ghost} onClick={advance}>Skip this stretch</button>
          </>
        ) : showSwitch ? (
          <button style={st.ghost} onClick={advance}>
            {isLast ? 'Skip → Finish' : `Skip → ${nextGroupLabel || 'next'}`}
          </button>
        ) : (
          <>
            <button style={st.btn()} onClick={startTimer}>▶ Start</button>
            <button style={st.ghost} onClick={advance}>
              {isLast ? 'Skip → Finish' : `Skip → ${nextGroupLabel || 'next'}`}
            </button>
          </>
        )}
      </div>
      {stretchModal && <StretchDemoModal stretch={stretchModal} onClose={() => setStretchModal(null)} />}
      {stretchYtModal && <YouTubeModal ytId={stretchYtModal.demoId} title={stretchYtModal.name} onClose={() => setStretchYtModal(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACTIVE WORKOUT
// ═══════════════════════════════════════════════════════════════════════
function IronSeriesView({ sessions, allExercises, onStart, onDemoOpen }) {
  const nextDay = nextIronDay(sessions);
  const [selectedDay, setSelectedDay] = useState(nextDay);
  const day = selectedDay;
  const wkt = getIronWorkout(day);
  const PLAYLIST = 'https://www.youtube.com/playlist?list=PLhu1QCKrfgPWmStsg7imo5EQ0zmkxymJ2';
  const ytUrl = wkt.ytId ? `https://www.youtube.com/watch?v=${wkt.ytId}` : PLAYLIST;
  const week = Math.ceil(day / 5);
  const sequenceDay = day === nextDay;
  const [expandedEx, setExpandedEx] = useState(null);
  const [ytModal, setYtModal] = useState(false);       // full workout video
  const [demoModal, setDemoModal] = useState(null);    // { id, name } for per-exercise demo

  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5, 6].map(w => (
          <button key={w} onClick={() => setSelectedDay((w - 1) * 5 + 1)} style={{
            flex: 1, textAlign: 'center', padding: '5px 0',
            borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: w === week ? C.amber : C.dim,
            color: w === week ? '#fff' : C.muted,
            border: w === week ? `1px solid ${C.amber}` : `1px solid transparent`,
            cursor: 'pointer', fontFamily: C.fBase,
          }}>
            Wk {w}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[0, 1, 2, 3, 4].map(offset => {
          const candidateDay = (week - 1) * 5 + offset + 1;
          const candidate = getIronWorkout(candidateDay);
          const isSelected = candidateDay === day;
          return (
            <button key={candidateDay} onClick={() => setSelectedDay(candidateDay)} style={{
              flex: 1, minWidth: 0, padding: '7px 3px', borderRadius: 7,
              background: isSelected ? C.blue : C.card,
              color: isSelected ? '#fff' : C.muted,
              border: `1px solid ${isSelected ? C.blue : C.border}`,
              cursor: 'pointer', fontFamily: C.fBase,
            }}>
              <div style={{ fontFamily: C.fMono, fontSize: 9, fontWeight: 700 }}>DAY {candidateDay}</div>
              <div style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>{candidate.title}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 22, marginBottom: 8 }}>
        <div style={{ fontFamily: C.fMono, fontSize: 10, color: sequenceDay ? C.green : C.amber, letterSpacing: 0.5 }}>
          {sequenceDay ? 'NEXT IN SEQUENCE' : 'CUSTOM DAY SELECTED'}
        </div>
        {!sequenceDay && (
          <button onClick={() => setSelectedDay(nextDay)} style={{ background: 'none', border: 'none', color: C.blue, fontFamily: C.fMono, fontSize: 10, cursor: 'pointer', padding: 0 }}>
            Continue sequence → Day {nextDay}
          </button>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: C.fCond, fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            🔩 Day {day} of 30
          </div>
          <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>{wkt.format}</div>
        </div>
        <div style={{ fontFamily: C.fCond, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          {wkt.title}
        </div>

        <div style={{ marginBottom: 10 }}>
          {wkt.exercises.map((exId, idx) => {
            const def = allExercises[exId];
            if (!def) return null;
            const isSuperset = wkt.supersets?.some(([, b]) => b === idx);
            const muscle = def.primaryMuscle || def.muscle;
            const isExpanded = expandedEx === `${exId}-${idx}`;
            return (
              <div key={`${exId}-${idx}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                {isSuperset && (
                  <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.amber, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 0' }}>
                    SUPERSET
                  </div>
                )}
                {/* Tappable row */}
                <div
                  onClick={() => setExpandedEx(isExpanded ? null : `${exId}-${idx}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: 'pointer' }}>
                  <div style={{ flexShrink: 0 }}>
                    <ExerciseIcon id={exId} size={36} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: C.text }}>{def.name}</span>
                  {muscle && (
                    <span style={{ border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 9px', fontSize: 11, color: C.muted, fontFamily: C.fMono, whiteSpace: 'nowrap' }}>
                      {muscle}
                    </span>
                  )}
                  <span style={{ color: C.muted, fontSize: 11, flexShrink: 0, marginLeft: 2 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <div onClick={() => onDemoOpen && onDemoOpen(exId)} style={{ cursor: 'pointer' }}>
                        <ExerciseIcon id={exId} size={96} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <MuscleDiagram
                        primary={def.primary || []}
                        secondary={def.secondary || []}
                        size="medium"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                      {muscle && (
                        <span style={{ background: C.amberDim, color: C.amber, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                          ● {muscle}
                        </span>
                      )}
                      {def.secondaryMuscle && (
                        <span style={{ background: '#e8f0ff', color: '#5b8fdc', fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                          ○ {def.secondaryMuscle}
                        </span>
                      )}
                      {def.perSide && (
                        <span style={{ background: C.blue + '22', color: C.blue, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                          Per side
                        </span>
                      )}
                    </div>
                    {def.caution && (
                      <div style={{ background: C.red + '14', border: `1px solid ${C.red}44`, borderRadius: 6, padding: '8px 10px', marginBottom: 8, fontSize: 12, color: C.red, lineHeight: 1.4 }}>
                        ⚠ {def.caution}
                      </div>
                    )}
                    {def.cue && (
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>
                        {def.cue}
                      </div>
                    )}
                    {def.demoId ? (
                      <button onClick={() => setDemoModal({ id: def.demoId, name: def.name })}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: C.amber, cursor: 'pointer' }}>
                        ▶ Watch demo
                      </button>
                    ) : def.demo ? (
                      <a href={def.demo} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', fontSize: 12, color: C.amber, textDecoration: 'none' }}>
                        ▶ Watch demo
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            );
          }).filter(Boolean)}
        </div>

        {demoModal && (
          <YouTubeModal
            ytId={demoModal.id}
            title={demoModal.name}
            onClose={() => setDemoModal(null)}
          />
        )}

        {/* Equipment checklist */}
        {wkt.equipment && wkt.equipment.length > 0 && (() => {
          const EQUIP_ICON = { 'Dumbbells': '🏋️', 'Exercise Mat': '🟦', 'Chair or Bench': '🪑', 'Yoga Block': '🧱', 'Glute Band': '🔴' };
          return (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontFamily: C.fMono, color: C.muted, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>
                You'll need
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {wkt.equipment.map(item => (
                  <span key={item} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: C.dim, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 12, color: C.text, fontFamily: C.fBase,
                  }}>
                    {EQUIP_ICON[item] || '●'} {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* YouTube link */}
        {wkt.ytId ? (
          <button
            onClick={() => setYtModal(true)}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none', textAlign: 'center', fontSize: 12, color: C.amber, cursor: 'pointer', marginBottom: 10, padding: 0 }}>
            ▶ Watch full workout
          </button>
        ) : (
          <a href={ytUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', fontSize: 12, color: C.amber, textDecoration: 'none', marginBottom: 10 }}>
            ▶ Watch full workout
          </a>
        )}
      </div>

      {ytModal && (
        <YouTubeModal
          ytId={wkt.ytId}
          title={`Iron Series · Day ${day} — ${wkt.title}`}
          onClose={() => setYtModal(false)}
        />
      )}

      <button
        onClick={() => onStart(`IRON_${day}`)}
        style={{ ...st.btn('lg'), width: '100%', background: C.amber, color: '#fff', fontFamily: C.fCond, fontSize: 17, fontWeight: 700 }}>
        ▶ Start Iron Day {day}
      </button>

      {wkt.equipment?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: C.fCond, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            What you'll need
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {wkt.equipment.map(item => (
              <span key={item} style={{
                fontSize: 12, color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '4px 10px',
                fontFamily: C.fMono,
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseInsightModal({ exId, def, sessions, recovery, watchData, onClose }) {
  const points = exerciseHistoryPoints(sessions, exId, watchData);
  const lastEntry = findLastExerciseEntry(sessions, exId);
  const recommendation = recommendExerciseProgression(lastEntry, def, recovery, watchData);
  const latest = points[points.length - 1] || null;
  const effort = latest?.effort;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,18,32,.42)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 430, maxHeight: 'calc(100dvh - 36px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 22px 60px rgba(16,31,54,.24)', padding: '16px 16px 32px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...st.label, color: recommendation.tone, marginBottom: 4 }}>Exercise insight</div>
            <div style={{ fontFamily: C.fDisplay, fontSize: 24, color: C.text, lineHeight: 1, textTransform: 'uppercase' }}>{def?.name || exId}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${C.border}`, background: C.dim, color: C.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ ...st.card(recommendation.tone + '10'), borderLeft: `3px solid ${recommendation.tone}`, marginBottom: 12 }}>
          <div style={{ ...st.label, color: recommendation.tone, marginBottom: 5 }}>Recommendation</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 18, color: C.text, marginBottom: 4 }}>{recommendation.title}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{recommendation.body}</div>
        </div>

        <div style={{ ...st.card(), marginBottom: 12 }}>
          <div style={{ ...st.label, marginBottom: 8 }}>Recent performance</div>
          {points.length ? (
            <>
              <ExerciseHistoryChart points={points} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 8 }}>
                {[
                  ['Load', latest?.maxWeight ? `${latest.maxWeight}kg` : latest?.volume ? `${Math.round(latest.volume)}kg` : `${latest?.reps || 0} reps`],
                  ['Volume', latest?.volume ? `${Math.round(latest.volume)}kg` : '—'],
                  ['RPE', latest?.avgRpe || '—'],
                  ['Pain', latest?.pain ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: C.dim, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ ...st.label, fontSize: 8, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontFamily: C.fMono, fontSize: 14, color: C.text }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>No completed history for this exercise yet. Log it once to build a trend.</div>
          )}
        </div>

        <div style={{ ...st.card(), marginBottom: 12 }}>
          <div style={{ ...st.label, marginBottom: 8 }}>Watch effort</div>
          {effort?.status === 'ok' ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={st.pill(recommendation.tone)}>{effort.label}</span>
                <span style={st.pill(C.muted)}>Avg {effort.avgHr} bpm</span>
                <span style={st.pill(C.muted)}>Peak {effort.maxHr} bpm</span>
                <span style={st.pill(C.muted)}>{effort.confidence} confidence</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
                This uses Apple Watch samples inside the timestamped exercise window. Minute-level Watch data means short sets are treated as estimates.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
              Watch effort will appear after you complete a workout with timestamped sets and export the matching Apple Watch workout data.
            </div>
          )}
        </div>

        <div style={{ ...st.card(C.blue + '0c'), borderColor: C.blue + '33' }}>
          <div style={{ ...st.label, color: C.blue, marginBottom: 6 }}>Why this matters</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
            IronLog compares performance, RPE, pain, recovery, and Watch effort. Pain and low recovery block progression first; load or reps only increase when the safer signals agree.
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveWorkout({ sessions, activeSession, setActiveSession, onComplete, setView, selectedWorkout, setSelectedWorkout, allExercises = EXERCISES, workoutCustom = {}, workoutHidden = {}, onDemoOpen, onWarmupOpen, coachRec, showWhy, setShowWhy, recovery, watchData }) {
  const nextWkt = selectedWorkout;
  const [session, setSession] = useState(activeSession || null);
  const [phase, setPhase] = useState(() => {
    const p = activeSession?.phase || (activeSession ? 'workout' : 'energy');
    // Backward compat: sessions stored before this feature used phase:'warmup'
    return p === 'warmup' ? 'warmup_setup' : p;
  });
  const [exIdx, setExIdx] = useState(() => {
    if (!activeSession?.exercises) return 0;
    const firstIncomplete = activeSession.exercises.findIndex(
      ex => ex.sets && ex.sets.some(s => !s.done)
    );
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });
  const [restSecs, setRestSecs] = useState(30);
  const [restActive, setRestActive] = useState(false);
  const [elapsed, setElapsed] = useState(
    session?.startTime ? Math.floor((Date.now() - session.startTime) / 1000) : 0
  );
  const [prs, setPRs] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [showAddEx, setShowAddEx] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [showExerciseInsight, setShowExerciseInsight] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(null); // null = no picker; 0–7 = slot being edited
  const [workoutDemoModal, setWorkoutDemoModal] = useState(null); // { id, name } for in-app demo

  const elapsedRef = useRef(null);
  const restRef = useRef(null);

  useEffect(() => {
    const origin = session?.startTime || Date.now();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - origin) / 1000));
    }, 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  useEffect(() => {
    if (!restActive) { clearTimeout(restRef.current); return; }
    if (restSecs <= 0) { setRestActive(false); return; }
    restRef.current = setTimeout(() => setRestSecs(s => s - 1), 1000);
    return () => clearTimeout(restRef.current);
  }, [restActive, restSecs]);

  useEffect(() => { setShowDiagram(false); setShowExerciseInsight(false); }, [exIdx]);

  // Persist the current exercise explicitly so a reload resumes where the user was,
  // even when an earlier exercise still has an intentionally incomplete set.
  useEffect(() => {
    if (!session || session.currentExerciseIndex === exIdx) return;
    const updated = { ...session, currentExerciseIndex: exIdx };
    setSession(updated);
    setActiveSession(updated);
  }, [exIdx]);

  function startRest(s = 30) { setRestSecs(s); setRestActive(true); }
  function stopRest() { setRestActive(false); setRestSecs(30); }

  function stampExerciseStart(prev, eIdx, nowIso) {
    if (!prev?.exercises?.[eIdx]) return prev;
    return {
      ...prev,
      exercises: prev.exercises.map((ex, ei) => ei !== eIdx || ex.exerciseStartedAt ? ex : { ...ex, exerciseStartedAt: nowIso }),
    };
  }

  function withExerciseCompletion(prev, eIdx, nowIso) {
    const ex = prev?.exercises?.[eIdx];
    if (!ex) return prev;
    const allDone = (ex.sets || []).every(set => set.done || set.setCompletedAt);
    if (!allDone || ex.exerciseCompletedAt) return prev;
    return {
      ...prev,
      exercises: prev.exercises.map((item, ei) => ei !== eIdx ? item : { ...item, exerciseCompletedAt: nowIso }),
    };
  }

  function estimatedSetStartIso(set, def, completedAtMs) {
    const durationSec = Number(set?.duration) || Number(def?.defaultDuration) || 45;
    return new Date(completedAtMs - Math.max(20, Math.min(120, durationSec)) * 1000).toISOString();
  }

  function startSession(energy) {
    // If activeSession was pre-built by the pre-start screen (has exercises), preserve it.
    // Only add the energy level and advance to warmup — do not rebuild.
    const base = (activeSession?.exercises?.length > 0)
      ? activeSession
      : buildSession(nextWkt, sessions, allExercises, workoutCustom, workoutHidden);
    const isIron = base.workout?.startsWith('IRON_');
    const nextPhase = isIron ? 'workout' : 'warmup_setup';
    const s = { ...base, energy, phase: nextPhase };
    setSession(s);
    setActiveSession(s);
    setPhase(nextPhase);
  }

  function cancelSession() {
    setActiveSession(null);
    setConfirmCancel(false);
    setView('dashboard');
  }

  function updateSet(eIdx, sIdx, field, val) {
    setSession(prev => {
      const nowIso = new Date().toISOString();
      const started = stampExerciseStart(prev, eIdx, nowIso);
      const updated = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((s, si) => {
            if (si !== sIdx) return s;
            return { ...s, [field]: val };
          }),
        }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function startSet(eIdx, sIdx) {
    setSession(prev => {
      const nowIso = new Date().toISOString();
      const started = stampExerciseStart(prev, eIdx, nowIso);
      const updated = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((set, si) => si !== sIdx ? set : {
            ...set,
            setStartedAt: set.setStartedAt || nowIso,
            setCompletedAt: null,
            done: false,
          }),
        }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function doneSet(eIdx, sIdx) {
    setSession(prev => {
      const completedAtMs = Date.now();
      const nowIso = new Date(completedAtMs).toISOString();
      const ex = prev?.exercises?.[eIdx];
      const set = ex?.sets?.[sIdx];
      const exerciseDef = allExercises[ex?.id] || EXERCISES[ex?.id] || {};
      const fallbackStartIso = set?.setStartedAt || estimatedSetStartIso(set, exerciseDef, completedAtMs);
      const started = stampExerciseStart(prev, eIdx, fallbackStartIso);
      const marked = {
        ...started,
        exercises: started.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex,
          sets: ex.sets.map((set, si) => si !== sIdx ? set : {
            ...set,
            setStartedAt: set.setStartedAt || fallbackStartIso,
            setCompletedAt: set.setCompletedAt || nowIso,
            done: true,
          }),
        }),
      };
      const completed = withExerciseCompletion(marked, eIdx, nowIso);
      setActiveSession(completed);
      return completed;
    });
    startRest(30);
  }

  function addSet(eIdx) {
    setSession(prev => {
      const ex = prev.exercises[eIdx];
      const last = ex.sets[ex.sets.length - 1];
      const newSet = { ...last, done: false, rpe: null, pain: null, setStartedAt: null, setCompletedAt: null };
      const updated = {
        ...prev,
        exercises: prev.exercises.map((e, i) => i !== eIdx ? e : { ...e, sets: [...e.sets, newSet] }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function updateExNotes(eIdx, notes) {
    setSession(prev => {
      const updated = {
        ...prev,
        exercises: prev.exercises.map((e, i) => i !== eIdx ? e : { ...e, notes }),
      };
      setActiveSession(updated);
      return updated;
    });
  }

  function completeWorkout() {
    const nowIso = new Date().toISOString();
    const completed = {
      ...session,
      completed: true,
      completedAt: nowIso,
      duration: Math.round(elapsed / 60),
      exercises: (session.exercises || []).map(ex => {
        const allDone = (ex.sets || []).every(set => set.done);
        return allDone && !ex.exerciseCompletedAt ? { ...ex, exerciseCompletedAt: nowIso } : ex;
      }),
    };
    setPRs(detectPRs(completed, sessions, allExercises));
    setNudges(checkOverloadNudges(completed, allExercises));
    onComplete(completed);
    setPhase('done');
  }

  if (session && (!Array.isArray(session.exercises) || session.exercises.length === 0)) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <div style={{ fontFamily: C.fDisplay, fontSize: 18, color: C.amber, letterSpacing: 1, textAlign: 'center' }}>SESSION DATA CORRUPTED</div>
        <div style={{ fontFamily: C.fMono, fontSize: 13, color: C.muted, textAlign: 'center' }}>The active session could not be loaded. Your completed sessions are safe.</div>
        <button style={st.btn(C.red || '#e05c5c')} onClick={() => { setActiveSession(null); setSession(null); setPhase('energy'); }}>
          Clear Session &amp; Start Fresh
        </button>
      </div>
    );
  }

  // ── Energy ──────────────────────────────────────────────────────────
  if (phase === 'energy') {
    const workoutKey = session?.workout || activeSession?.workout || nextWkt;
    const isIron = workoutKey?.startsWith('IRON_');
    const ironDay = isIron ? parseInt(workoutKey.split('_')[1], 10) : null;
    const title = isIron ? getIronWorkout(ironDay).title : WORKOUTS[workoutKey].title;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: C.fMono, padding: 0 }}>back to Home</button>
        </div>
        <div style={{ ...st.label, marginBottom: 4 }}>{isIron ? `Iron Series · Day ${ironDay}` : `Workout ${nextWkt}`}</div>
        <div style={{ fontFamily: C.fDisplay, fontSize: 26, textTransform: 'uppercase', marginBottom: 24 }}>{title}</div>
        {!isIron && (
          <>
            <WorkoutPlanCard
              sessions={sessions}
              activeSession={activeSession}
              selectedWorkout={selectedWorkout}
              setSelectedWorkout={setSelectedWorkout}
              allExercises={allExercises}
              workoutCustom={workoutCustom}
              workoutHidden={workoutHidden}
              coachRec={coachRec}
              showWhy={showWhy}
              setShowWhy={setShowWhy}
              setView={setView}
              onWarmupOpen={onWarmupOpen}
              onDemoOpen={onDemoOpen}
            />
            <StretchRoutineCard setView={setView} />
          </>
        )}
        <div style={{ ...st.card(), marginBottom: 16 }}>
          <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, color: C.muted, marginBottom: 16 }}>Energy level today?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['😴','Low'],['😕','Tired'],['😐','OK'],['💪','Good'],['🔥','Great']].map(([emoji, label], i) => (
              <button key={i} onClick={() => startSession(i + 1)} style={{
                flex: 1, background: C.dim, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '12px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 9, fontFamily: C.fMono, color: C.muted, textTransform: 'uppercase' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <button style={{ ...st.ghost }} onClick={() => startSession(3)}>Skip</button>
      </div>
    );
  }

  // ── Warmup setup ──────────────────────────────────────────────────
  if (phase === 'warmup_setup' && pickerSlot !== null) {
    return (
      <WarmupPicker
        workout={session?.workout || nextWkt}
        slotIndex={pickerSlot}
        onSelect={() => setPickerSlot(null)}
        onBack={() => setPickerSlot(null)}
      />
    );
  }

  if (phase === 'warmup_setup') {
    return (
      <WarmupSetup
        workout={session?.workout || nextWkt}
        onChangeSlot={i => setPickerSlot(i)}
        onBegin={() => {
          setPhase('warmup_active');
          setActiveSession(s => s ? { ...s, phase: 'warmup_active' } : s);
        }}
        onSkip={() => {
          setPhase('workout');
          setActiveSession(s => s ? { ...s, phase: 'workout' } : s);
        }}
        onReset={() => {
          resetWarmupConfig(session?.workout || nextWkt);
          setPickerSlot(null); // force re-render — WarmupSetup re-reads config on each render
        }}
      />
    );
  }

  // ── Warmup active ─────────────────────────────────────────────────
  if (phase === 'warmup_active') {
    return (
      <WarmupActive
        workout={session?.workout || nextWkt}
        onComplete={() => {
          setPhase('workout');
          setActiveSession(s => s ? { ...s, phase: 'workout' } : s);
        }}
      />
    );
  }

  // ── Workout ──────────────────────────────────────────────────────────
  if (phase === 'workout' && session) {
    const exId = session.exercises[exIdx]?.id;
    const def = allExercises[exId] || EXERCISES[exId] || {};
    const exData = session.exercises[exIdx];
    if (!exData) {
      return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <div style={{ fontFamily: C.fDisplay, fontSize: 18, color: C.amber, letterSpacing: 1, textAlign: 'center' }}>EXERCISE NOT FOUND</div>
          <div style={{ fontFamily: C.fMono, fontSize: 13, color: C.muted, textAlign: 'center' }}>Could not load exercise data. Try going back to the first exercise.</div>
          <button style={st.btn()} onClick={() => setExIdx(0)}>Go to First Exercise</button>
          <button style={st.ghost} onClick={() => { setActiveSession(null); setSession(null); setPhase('energy'); }}>Cancel Session</button>
        </div>
      );
    }

    const primaryMuscle = def.primaryMuscle || def.muscle;
    const secondaryMuscle = def.secondaryMuscle;
    const doneSetsCount = exData.sets.filter(s => s.done).length;
    const allExDone = exData.sets.every(s => s.done);
    const sessionExIds = new Set(session.exercises.map(e => e.id));
    const availableToAdd = Object.entries(allExercises).filter(([id, def]) => !sessionExIds.has(id) && !def.gymOnly);
    const previousEntry = findLastExerciseEntry(sessions, exId);
    const progression = recommendExerciseProgression(previousEntry, def, recovery, watchData);
    const effort = progression.effort;

    return (
      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...st.label, marginBottom: 3 }}>
              {session.workout} · {exIdx + 1} / {session.exercises.length} · {doneSetsCount}/{exData.sets.length} sets
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <ExerciseIcon id={exId} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2, color: C.text }}>{def.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {primaryMuscle && (
                    <span style={{ background: C.amberDim, color: C.amber, fontSize: 10, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono }}>
                      {primaryMuscle}
                    </span>
                  )}
                  {secondaryMuscle && (
                    <span style={{ background: C.dim, color: C.muted, fontSize: 10, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono }}>
                      {secondaryMuscle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 80 }}>
            {restActive ? (
              <div>
                <div style={{ ...st.mono(9, C.muted) }}>REST</div>
                <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.amber, lineHeight: 1 }}>{fmtTimer(restSecs)}</div>
                <button onClick={stopRest} style={{ ...st.btnSm(C.dim, C.muted), padding: '2px 6px', fontSize: 10, marginTop: 2 }}>Skip</button>
              </div>
            ) : (
              <div style={{ fontFamily: C.fMono, fontSize: 18, color: C.muted }}>{fmtTimer(elapsed)}</div>
            )}
            <button onClick={() => setConfirmCancel(true)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 10, fontFamily: C.fMono, marginTop: 6, padding: 0, textDecoration: 'underline', display: 'block' }}>Cancel</button>
          </div>
        </div>

        {/* Tags + cue */}
        <div style={{ ...st.row, flexWrap: 'wrap', marginBottom: 8, gap: 4 }}>
          {def.perSide && <span style={st.pill(C.blue)}>Per side</span>}
          {def.repMax && <span style={st.pill(C.purple)}>{def.repMax === def.defaultReps ? `${def.defaultReps} reps` : `${def.defaultReps}–${def.repMax} reps`}</span>}
        </div>
        <div style={{ ...st.card(), padding: '10px 12px', borderLeft: `2px solid ${C.amber}`, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: (def.demoId || def.demo) ? 10 : 0 }}>{def.cue}</div>
            {def.demoId ? (
              <button onClick={() => setWorkoutDemoModal({ id: def.demoId, name: def.name })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: C.dim, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '6px 12px', fontSize: 11, fontFamily: C.fMono,
                color: C.text, cursor: 'pointer', letterSpacing: 0.8, textTransform: 'uppercase',
              }}>
                <span style={{ color: C.red, fontSize: 13 }}>▶</span> Watch Demo
              </button>
            ) : def.demo ? (
              <a href={def.demo} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: C.dim, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '6px 12px', fontSize: 11, fontFamily: C.fMono,
                color: C.text, textDecoration: 'none', letterSpacing: 0.8, textTransform: 'uppercase',
              }}>
                <span style={{ color: C.red, fontSize: 13 }}>▶</span> Watch Demo
              </a>
            ) : null}
            {workoutDemoModal && (
              <YouTubeModal
                ytId={workoutDemoModal.id}
                title={workoutDemoModal.name}
                onClose={() => setWorkoutDemoModal(null)}
              />
            )}
          </div>
          <div onClick={() => onDemoOpen && onDemoOpen(exId)} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <ExerciseIcon id={exId} size={96} />
          </div>
        </div>

        {/* Muscle diagram (collapsible) */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowDiagram(v => !v)}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
          >
            <span style={{ ...st.label, fontSize: 9 }}>MUSCLES</span>
            {!showDiagram && primaryMuscle && (
              <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>{primaryMuscle}</span>
            )}
            <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted, marginLeft: 'auto' }}>
              {showDiagram ? '▲ Hide' : '▼ Show'}
            </span>
          </button>
          {showDiagram && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <MuscleDiagram
                primary={def.primary || []}
                secondary={def.secondary || []}
                size="medium"
              />
            </div>
          )}
        </div>

        {/* Exercise effort recommendation */}
        <div style={{ ...st.card(progression.tone + '10'), borderLeft: `2px solid ${progression.tone}`, marginBottom: 14, padding: '10px 12px' }}>
          <div style={{ ...st.label, color: progression.tone, fontSize: 9, marginBottom: 5 }}>NEXT TIME</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 16, color: C.text, lineHeight: 1.1, marginBottom: 4 }}>{progression.title}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{progression.body}</div>
          {effort?.status === 'ok' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span style={st.pill(progression.tone)}>{effort.label}</span>
              <span style={st.pill(C.muted)}>Avg {effort.avgHr} bpm</span>
              <span style={st.pill(C.muted)}>Peak {effort.maxHr} bpm</span>
              <span style={st.pill(C.muted)}>{effort.confidence} confidence</span>
            </div>
          )}
          {effort?.status !== 'ok' && previousEntry?.exercise && (
            <div style={{ ...st.mono(10, C.muted), marginTop: 7 }}>
              Watch effort will appear here after this exercise has timestamped sets and the matching Watch export is available.
            </div>
          )}
          <button onClick={() => setShowExerciseInsight(true)} style={{ ...st.ghost, marginTop: 10, padding: '8px 10px', fontSize: 11 }}>
            View insight
          </button>
        </div>

        {showExerciseInsight && (
          <ExerciseInsightModal
            exId={exId}
            def={def}
            sessions={sessions}
            recovery={recovery}
            watchData={watchData}
            onClose={() => setShowExerciseInsight(false)}
          />
        )}

        {/* Pull-up progress card */}
        {def.pullupTracking && (() => {
          const allSets = sessions.flatMap(s => (s.exercises || []).find(e => e.id === exId)?.sets || []);
          const unassistedSets = allSets.filter(s => s.done && (!s.mode || s.mode === 'bw') && Number(s.reps) > 0);
          const bestReps = unassistedSets.length > 0 ? Math.max(...unassistedSets.map(s => Number(s.reps))) : 0;
          const totalSessions = sessions.filter(s => (s.exercises || []).some(e => e.id === exId)).length;
          return (
            <div style={{ ...st.card(), padding: '10px 14px', borderLeft: `2px solid ${C.blue}`, marginBottom: 14 }}>
              <div style={{ ...st.label, fontSize: 9, color: C.blue, marginBottom: 6 }}>PULL-UP PROGRESS</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: C.fMono, fontSize: 22, color: bestReps > 0 ? C.green : C.muted, lineHeight: 1 }}>{bestReps}</div>
                  <div style={{ ...st.label, fontSize: 9, marginTop: 2 }}>best unassisted</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.muted, lineHeight: 1 }}>{totalSessions}</div>
                  <div style={{ ...st.label, fontSize: 9, marginTop: 2 }}>sessions logged</div>
                </div>
                <div style={{ flex: 1, fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                  {bestReps === 0
                    ? 'No unassisted reps yet — band assist or negatives to build strength.'
                    : bestReps < 3
                    ? 'Getting there — keep adding reps before dropping the band.'
                    : bestReps < 6
                    ? 'Good base — try adding one more rep each session.'
                    : '💪 Strong — work toward sets of 8+ unassisted.'}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Caution banner */}
        {def.caution && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.amber + '18', border: `1px solid ${C.amber}66`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>{def.caution}</div>
          </div>
        )}
        {/* Coach modification note (ephemeral — from coachRec props, not stored in session) */}
        {coachRec?.flags?.find(f => f.exerciseId === exId)?.modification && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.amber + '18', border: `1px solid ${C.amber}66`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>🤖</span>
            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>
              Coach: {coachRec.flags.find(f => f.exerciseId === exId).modification}
            </div>
          </div>
        )}

        {/* Previous session notes reminder */}
        {(() => {
          const lastNotes = getLastLogged(sessions, exId)?.notes;
          return lastNotes ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.dim, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.muted}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>📝</span>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: C.fMono }}>{lastNotes}</div>
            </div>
          ) : null;
        })()}

        {/* Sets */}
        <div style={{ ...st.col(6), marginBottom: 10 }}>
          {exData.sets.map((set, si) => (
            <SetRow key={si} num={si + 1} set={set} def={def}
              onUpdate={(f, v) => updateSet(exIdx, si, f, v)}
              onStart={() => startSet(exIdx, si)}
              nowMs={session.startTime ? session.startTime + elapsed * 1000 : Date.now()}
              onDone={() => doneSet(exIdx, si)} />
          ))}
        </div>

        {/* Add set */}
        <button style={{ ...st.ghost, marginBottom: 12, fontSize: 12 }} onClick={() => addSet(exIdx)}>+ Add Set</button>

        {/* Rest timer shortcuts */}
        <div style={{ ...st.row, justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ ...st.label, fontSize: 9 }}>Rest:</span>
          {[30, 60, 120].map(t => (
            <button key={t} onClick={() => startRest(t)} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11, padding: '6px 10px' }}>{t}s</button>
          ))}
        </div>

        {/* Overload nudge for this exercise */}
        {allExDone && def.repMax && def.unit === 'kg' &&
          def.repMax > (def.defaultReps || 0) &&
          exData.sets.filter(s => s.done).every(s => Number(s.reps) >= def.repMax) &&
          !exData.sets.filter(s => s.done).some(s => Number(s.pain) >= 3) &&
          (() => {
            const rpes = exData.sets.filter(s => s.done).map(s => Number(s.rpe)).filter(v => !isNaN(v) && v > 0);
            return rpes.length === 0 || rpes.reduce((a,b)=>a+b,0)/rpes.length <= 8;
          })() && (
          <div style={{ ...st.card(C.amber + '10'), borderColor: C.amber + '44', marginBottom: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: C.amber }}>
              ◈ All sets at top of rep range — consider adding load next session
            </div>
          </div>
        )}

        {/* Exercise notes */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...st.label, marginBottom: 5 }}>Exercise notes</div>
          <textarea
            value={exData.notes || ''}
            onChange={e => updateExNotes(exIdx, e.target.value)}
            placeholder="e.g. shoulder felt tight, went lighter than planned…"
            style={{
              ...st.inp, textAlign: 'left', padding: '10px 12px',
              minHeight: 64, resize: 'none', fontSize: 12,
              lineHeight: 1.5, fontFamily: C.fBody,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {exIdx > 0 && <button style={{ ...st.ghost, flex: '0 0 80px' }} onClick={() => setExIdx(i => i - 1)}>‹</button>}
          {exIdx < session.exercises.length - 1 ? (
            <button style={{ ...st.btn(), flex: 1 }} onClick={() => setExIdx(i => i + 1)}>Next ›</button>
          ) : (
            <button style={{ ...st.btn(C.green), flex: 1 }} onClick={() => {
              if (session.workout?.startsWith('IRON_')) {
                completeWorkout();
              } else {
                setPhase('finisher');
                setActiveSession(s => s ? { ...s, phase: 'finisher' } : s);
              }
            }}>
              {session.workout?.startsWith('IRON_') ? 'Complete Session ✓' : 'Finisher ›'}
            </button>
          )}
        </div>

        {/* Exercise list mini-nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 14, justifyContent: 'center' }}>
          {session.exercises.map((ex, i) => {
            const done = ex.sets.every(s => s.done);
            const isCustom = !EXERCISES[ex.id];
            return (
              <button key={ex.id + i} onClick={() => { setExIdx(i); setShowAddEx(false); }} style={{
                width: 28, height: 28, borderRadius: 14,
                background: done ? C.green + '22' : i === exIdx ? C.amber : C.dim,
                border: `1px solid ${done ? C.green + '44' : i === exIdx ? C.amber : isCustom ? C.amber + '44' : C.border}`,
                color: done ? C.green : i === exIdx ? '#fff' : C.muted,
                fontFamily: C.fMono, fontSize: 10, cursor: 'pointer',
              }}>{i + 1}</button>
            );
          })}
        </div>

        {/* Mid-session add exercise */}
        <div style={{ marginTop: 14 }}>
          <button style={{ ...st.ghost, fontSize: 12 }} onClick={() => setShowAddEx(!showAddEx)}>
            {showAddEx ? '✕ Cancel' : '＋ Add Exercise to Session'}
          </button>
          {showAddEx && (
            <div style={{ marginTop: 8 }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Select exercise</div>
              <div style={{ ...st.col(4), maxHeight: 280, overflowY: 'auto' }}>
                {availableToAdd.length === 0
                  ? <div style={{ fontSize: 12, color: C.muted, padding: 12, textAlign: 'center' }}>All exercises already in this session.</div>
                  : availableToAdd.map(([id, ex]) => (
                    <button key={id} onClick={() => {
                      const def = allExercises[id];
                      const last = getLastLogged(sessions, id);
                      const numSets = def.defaultSets || 3;
                      const sets = Array.from({ length: numSets }, (_, i) => {
                        const ls = last?.sets?.[i] || last?.sets?.[0];
                        return { weight: ls?.weight ?? '', reps: ls?.reps ?? (def.defaultReps || ''), duration: ls?.duration ?? (def.defaultDuration || ''), rpe: null, pain: null, done: false };
                      });
                      setSession(prev => {
                        const updated = { ...prev, exercises: [...prev.exercises, { id, sets }] };
                        setActiveSession(updated);
                        return updated;
                      });
                      setExIdx(session.exercises.length);
                      setShowAddEx(false);
                    }} style={{
                      ...st.card(), width: '100%', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: ex.isCustom ? C.amber + '0a' : C.card,
                    }}>
                      <span style={{ fontSize: 13 }}>{ex.name}</span>
                      <span style={st.pill(ex.isCustom ? C.amber : C.muted)}>{ex.muscle}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>
        {confirmCancel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
            <div style={{ ...st.card(), margin: 24, padding: 24, maxWidth: 320 }}>
              <div style={{ fontFamily: C.fDisplay, fontSize: 18, textTransform: 'uppercase', marginBottom: 8 }}>Cancel Session?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Progress will not be saved.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...st.btn(C.red), flex: 1 }} onClick={cancelSession}>Yes, Cancel</button>
                <button style={{ ...st.ghost, flex: 1 }} onClick={() => setConfirmCancel(false)}>Keep Going</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Finisher ─────────────────────────────────────────────────────────
  if (phase === 'finisher' && session) {
    const wkt = WORKOUTS[session.workout];
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={st.h2}>Finisher</div>
          <div style={{ ...st.mono(16, C.muted) }}>{fmtTimer(elapsed)}</div>
        </div>
        <div style={{ ...st.label, marginBottom: 16 }}>Cool-down · {session.workout}</div>
        <div style={{ ...st.col(), marginBottom: 20 }}>
          {wkt.finisher.map((item, i) => (
            <div key={i} style={{ ...st.card(), display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center' }}>
              <img src={`assets/icons/warmup/${item.id}.png`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', flexShrink: 0, cursor: 'pointer' }} onError={e => { e.target.style.display = 'none'; }} onClick={() => onWarmupOpen && onWarmupOpen(item)} />
              <div style={{ color: C.amber, fontFamily: C.fMono, minWidth: 18 }}>{i + 1}</div>
              <div style={{ fontSize: 13 }}>{item.text}</div>
            </div>
          ))}
        </div>
        <div style={{ ...st.label, marginBottom: 6 }}>Session notes (optional)</div>
        <textarea
          style={{ ...st.inp, textAlign: 'left', minHeight: 72, resize: 'vertical', marginBottom: 16, fontSize: 13, padding: 10 }}
          placeholder="How did it feel? Any niggles or things to note..."
          value={session.notes}
          onChange={e => {
            const notes = e.target.value;
            setSession(p => ({ ...p, notes }));
            setActiveSession(p => p ? { ...p, notes } : p);
          }}
        />
        <button style={{ ...st.btn(C.green) }} onClick={completeWorkout}>Complete Session ✓</button>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>💪</div>
        <div style={{ ...st.h1, marginBottom: 6 }}>Session Complete</div>
        <div style={{ ...st.label, marginBottom: 24 }}>Workout {session?.workout} · {session?.duration} min</div>

        {prs.length > 0 && (
          <div style={{ ...st.card(C.green + '10'), borderColor: C.green + '44', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ ...st.label, color: C.green, marginBottom: 8 }}>🏆 New Personal Records</div>
            {prs.map((pr, i) => (
              <div key={i} style={{ fontSize: 13, color: C.green, fontFamily: C.fMono }}>{pr.name} — {pr.weight}kg</div>
            ))}
          </div>
        )}

        {nudges.length > 0 && (
          <div style={{ ...st.card(C.amber + '10'), borderColor: C.amber + '44', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ ...st.label, color: C.amber, marginBottom: 8 }}>◈ Progressive Overload</div>
            {nudges.map((n, i) => (
              <div key={i} style={{ fontSize: 12, color: C.amber, marginBottom: 2 }}>{n} — ready to increase load</div>
            ))}
          </div>
        )}

        <button style={{ ...st.btn(), marginBottom: 8 }} onClick={() => setView('dashboard')}>Back to Home</button>
        <button style={{ ...st.ghost }} onClick={() => setView('progress')}>View Progress Charts</button>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════
function WatchEffortTimeline({ review, selectedExercise, onSelectExercise }) {
  const samples = review?.hrSamples || [];
  const window = review?.window;
  if (!window || samples.length < 2) return null;
  const W = 360, H = 132, p = { top: 18, right: 12, bottom: 22, left: 34 };
  const innerW = W - p.left - p.right;
  const innerH = H - p.top - p.bottom;
  const hrs = samples.map(s => s.hr).filter(Number.isFinite);
  const min = Math.max(50, Math.floor((Math.min(...hrs) - 8) / 5) * 5);
  const max = Math.ceil((Math.max(...hrs) + 8) / 5) * 5;
  const span = max === min ? 1 : max - min;
  const xOf = t => p.left + ((t - window.start) / Math.max(1, window.end - window.start)) * innerW;
  const yOf = hr => p.top + innerH - ((hr - min) / span) * innerH;
  const points = samples
    .filter(s => Number.isFinite(s.hr) && Number.isFinite(s.t))
    .map(s => ({ x: xOf(s.t), y: yOf(s.hr), hr: s.hr, t: s.t }));
  const path = smoothLinePath(points, 0.85);
  const ticks = [min, Math.round((min + max) / 2), max];
  const startLabel = new Date(window.start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const endLabel = new Date(window.end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const selected = selectedExercise != null ? review.exerciseStats[selectedExercise] : null;
  const selectedBand = selected?.window ? {
    x1: Math.max(p.left, Math.min(W - p.right, xOf(selected.window.start))),
    x2: Math.max(p.left, Math.min(W - p.right, xOf(selected.window.end))),
  } : null;
  const labelX = selectedBand ? Math.max(80, Math.min(W - 92, (selectedBand.x1 + selectedBand.x2) / 2)) : 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 8px 6px', marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', margin: '0 0 4px 4px' }}>
        <div style={{ ...st.label, fontSize: 9 }}>Heart rate timeline</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fMono }}>Tap bands</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={p.left} x2={W - p.right} y1={yOf(t)} y2={yOf(t)} stroke={C.border} strokeDasharray="4 5" />
            <text x={p.left - 6} y={yOf(t) + 3} textAnchor="end" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{t}</text>
          </g>
        ))}
        {review.exerciseStats.map((ex, i) => {
          if (!ex.window) return null;
          const x1 = Math.max(p.left, Math.min(W - p.right, xOf(ex.window.start)));
          const x2 = Math.max(p.left, Math.min(W - p.right, xOf(ex.window.end)));
          const color = i % 2 ? C.blue : C.green;
          return (
            <g key={ex.name + i} onClick={() => onSelectExercise?.(i)} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
              <rect x={x1} y={p.top} width={Math.max(2, x2 - x1)} height={innerH}
                fill={color} opacity={selectedExercise === i ? '0.18' : '0.07'} rx="3" />
              <rect x={Math.max(p.left, x1 - 6)} y={p.top - 4} width={Math.max(14, x2 - x1 + 12)} height={innerH + 8}
                fill="rgba(255,255,255,0.001)" rx="5" style={{ pointerEvents: 'all' }}>
                <title>{ex.name} · {ex.avgHr ? `Avg ${ex.avgHr} bpm` : 'No HR sample'}</title>
              </rect>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={C.blue} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
        <path d={path} fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1 ? (
          <circle key={i} cx={pt.x} cy={pt.y} r="3.2" fill={pt.hr >= 145 ? C.red : pt.hr >= 130 ? C.amber : C.green} stroke={C.card} strokeWidth="1.5" />
        ) : null)}
        <text x={p.left} y={H - 5} textAnchor="start" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{startLabel}</text>
        <text x={W - p.right} y={H - 5} textAnchor="end" fill={C.muted} fontSize="9" fontFamily={C.fMono}>{endLabel}</text>
        <text x={p.left} y={11} fill={C.muted} fontSize="9" fontFamily={C.fMono}>bpm</text>
        {selected && selectedBand && (
          <g>
            <line x1={(selectedBand.x1 + selectedBand.x2) / 2} x2={(selectedBand.x1 + selectedBand.x2) / 2}
              y1={p.top} y2={H - p.bottom} stroke={selected.effort.color} strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x={labelX - 78} y={p.top + 4} width="156" height="28" rx="7"
              fill={C.card} stroke={selected.effort.color} strokeWidth="1.2" />
            <text x={labelX} y={p.top + 16} textAnchor="middle" fill={C.text} fontSize="9" fontFamily={C.fMono} fontWeight="700">
              {selected.name.length > 22 ? `${selected.name.slice(0, 20)}…` : selected.name}
            </text>
            <text x={labelX} y={p.top + 27} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily={C.fMono}>
              {selected.avgHr ? `Avg ${selected.avgHr} · Peak ${selected.maxHr} bpm` : selected.confidence.label}
            </text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '2px 0 0 2px', WebkitOverflowScrolling: 'touch' }}>
        {review.exerciseStats.map((ex, i) => (
          <button key={ex.name + i} onClick={() => onSelectExercise?.(i)} style={{
            border: `1px solid ${selectedExercise === i ? ex.effort.color : C.border}`,
            background: selectedExercise === i ? ex.effort.color + '14' : C.bg,
            color: selectedExercise === i ? ex.effort.color : C.muted,
            borderRadius: 999,
            padding: '4px 8px',
            fontFamily: C.fMono,
            fontSize: 9,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}>
            {i + 1}. {ex.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExerciseEffortLineChart({ ex }) {
  const samples = ex?.hrSamples || [];
  const window = ex?.window;
  if (!window || samples.length < 2) return (
    <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
      Not enough heart-rate samples to draw an exercise graph yet.
    </div>
  );
  const W = 340, H = 142, p = { top: 18, right: 12, bottom: 28, left: 34 };
  const innerW = W - p.left - p.right;
  const innerH = H - p.top - p.bottom;
  const hrs = samples.map(s => s.hr).filter(Number.isFinite);
  const min = Math.max(50, Math.floor((Math.min(...hrs) - 6) / 5) * 5);
  const max = Math.ceil((Math.max(...hrs) + 6) / 5) * 5;
  const span = max === min ? 1 : max - min;
  const xOf = t => p.left + ((t - window.start) / Math.max(1, window.end - window.start)) * innerW;
  const yOf = hr => p.top + innerH - ((hr - min) / span) * innerH;
  const points = samples.map(s => ({ x: xOf(s.t), y: yOf(s.hr), hr: s.hr, t: s.t }));
  const path = smoothLinePath(points, 0.9);
  const ticks = [min, Math.round((min + max) / 2), max];
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 7px 5px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, margin: '0 2px 2px' }}>
        <div style={{ ...st.label, fontSize: 8 }}>Exercise HR + set windows</div>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: C.fMono }}>{ex.confidence.label}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={p.left} x2={W - p.right} y1={yOf(t)} y2={yOf(t)} stroke={C.border} strokeDasharray="4 5" />
            <text x={p.left - 6} y={yOf(t) + 3} textAnchor="end" fill={C.muted} fontSize="8" fontFamily={C.fMono}>{t}</text>
          </g>
        ))}
        {ex.setStats.map(row => {
          const win = setWindowMs(row.set);
          if (!win) return null;
          const x1 = Math.max(p.left, Math.min(W - p.right, xOf(win.start)));
          const x2 = Math.max(p.left, Math.min(W - p.right, xOf(win.end)));
          return (
            <g key={row.setNo}>
              <rect x={x1} y={p.top} width={Math.max(3, x2 - x1)} height={innerH} rx="3"
                fill={row.confidence.key === 'none' ? C.muted : row.effort.color} opacity="0.12" />
              <line x1={x1} x2={x1} y1={p.top} y2={p.top + innerH} stroke={C.border} strokeWidth="1" />
              <text x={Math.max(p.left + 8, Math.min(W - p.right - 8, (x1 + x2) / 2))} y={H - 9}
                textAnchor="middle" fill={row.effort.color} fontSize="8" fontFamily={C.fMono}>S{row.setNo}</text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
        <path d={path} fill="none" stroke={ex.effort.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={pt.hr >= 145 ? C.red : pt.hr >= 130 ? C.amber : C.green} stroke={C.card} strokeWidth="1.4" />
        ))}
        <text x={p.left} y={11} fill={C.muted} fontSize="8" fontFamily={C.fMono}>bpm</text>
        <text x={p.left} y={H - 9} textAnchor="start" fill={C.muted} fontSize="8" fontFamily={C.fMono}>sets</text>
      </svg>
    </div>
  );
}

function WorkoutEffortReview({ session, watchData, allExercises = EXERCISES }) {
  const [openExercise, setOpenExercise] = useState(null);
  const [selectedTimelineExercise, setSelectedTimelineExercise] = useState(null);
  const review = sessionEffortReview(session, watchData, allExercises);
  if (!review.matched && !review.hrSamples.length) {
    return (
      <div style={{ ...st.card(C.dim), marginBottom: 12, padding: 12 }}>
        <div style={{ ...st.label, color: C.muted, marginBottom: 5 }}>Watch effort</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
          No matched Apple Watch workout has been found for this session yet. Export workouts after training to unlock effort review here.
        </div>
      </div>
    );
  }
  const summary = [
    ['Duration', review.durationMin ? `${review.durationMin} min` : '—'],
    ['Active', review.activeKcal ? `${review.activeKcal} kcal` : '—'],
    ['Avg HR', review.avgHr ? `${review.avgHr} bpm` : '—'],
    ['Peak HR', review.maxHr ? `${review.maxHr} bpm` : '—'],
  ];
  const insight = review.hardest
    ? `${review.hardest.name} created the highest Watch effort in this session (${review.hardest.maxHr || review.hardest.avgHr} bpm peak/avg signal).`
    : 'Watch samples are matched to this workout. More timestamped sets will make exercise-level insight stronger.';
  return (
    <div style={{ ...st.card(C.blue + '08'), borderColor: C.blue + '33', marginBottom: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ ...st.label, color: C.blue, marginBottom: 3 }}>Workout effort review</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.35 }}>
            Matched to Apple Watch · {review.confidence.label.toLowerCase()}
          </div>
        </div>
        {review.intensity && <span style={st.pill(C.amber)}>Intensity {Math.round(review.intensity * 10) / 10}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {summary.map(([label, value]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 5px', minWidth: 0 }}>
            <div style={{ ...st.label, fontSize: 7, marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: C.fMono, fontSize: 11, color: C.text, whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      <WatchEffortTimeline
        review={review}
        selectedExercise={selectedTimelineExercise}
        onSelectExercise={i => {
          setSelectedTimelineExercise(i);
          setOpenExercise(i);
        }}
      />

      <div style={{ marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.4 }}>
        <span style={{ color: C.green, marginRight: 5 }}>✓</span>{insight}
      </div>
      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 5 }}>
        Set values use minute-level Apple Watch samples, so short sets are estimates and carry a confidence label.
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {review.exerciseStats.map((ex, i) => {
          const isOpen = openExercise === i;
          return (
            <div key={`${ex.name}-${i}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
              <button onClick={() => setOpenExercise(isOpen ? null : i)} style={{
                width: '100%', border: 'none', background: 'transparent', padding: 10, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', cursor: 'pointer',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: C.fDisplay, fontSize: 15, color: C.text, textTransform: 'uppercase', lineHeight: 1 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    {ex.avgHr ? `Avg ${ex.avgHr} · Peak ${ex.maxHr} bpm` : 'No exercise-level Watch sample'}
                    {ex.kcal ? ` · ${ex.kcal} kcal` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={st.pill(ex.effort.color)}>{ex.effort.label}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '9px 10px 10px' }}>
                  <ExerciseEffortLineChart ex={ex} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      ['Volume', ex.volume ? `${Math.round(ex.volume)}kg` : '—'],
                      ['RPE', ex.avgRpe || '—'],
                      ['Pain', ex.pain ?? '—'],
                      ['Sample', ex.confidence.label],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: C.dim, borderRadius: 7, padding: '7px 4px' }}>
                        <div style={{ ...st.label, fontSize: 7, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontFamily: C.fMono, fontSize: 10, color: label === 'Sample' ? ex.confidence.color : C.text }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {ex.setStats.map(row => {
                      const set = row.set;
                      const load = set.duration ? `${set.duration}s`
                        : set.weight || set.reps ? `${set.weight || 'BW'}kg × ${set.reps || '—'}` : '—';
                      return (
                        <div key={row.setNo} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr', gap: 6, alignItems: 'center',
                          background: C.bg, borderRadius: 7, padding: '7px 8px' }}>
                          <div style={{ ...st.mono(11, C.muted) }}>S{row.setNo}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.text }}>{load}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>
                              {row.durationSec ? `${row.durationSec}s` : 'no timer'}{set.rpe ? ` · RPE ${set.rpe}` : ''}{set.pain != null ? ` · pain ${set.pain}` : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 0 }}>
                            <div style={{ fontFamily: C.fMono, fontSize: 10, color: row.effort.color }}>
                              {row.avgHr ? `${row.avgHr}/${row.maxHr} bpm` : row.confidence.label}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted }}>
                              {row.kcal ? `${row.kcal} kcal · ` : ''}{row.sampleCount} sample{row.sampleCount === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function History({ sessions, setSessions, allExercises = EXERCISES, watchData }) {
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // sess.id pending delete
  const [editingId, setEditingId] = useState(null);   // sess.id being edited, or null
  const [draft, setDraft] = useState(null);            // deep copy of session under edit
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  function deleteSession(id) {
    setSessions(p => {
      const next = p.filter(s => s.id !== id);
      localStorage.setItem('il_sessions', JSON.stringify(next));
      return next;
    });
    setExpanded(null);
    setConfirmDelete(null);
  }

  function startEdit(sess) {
    setEditingId(sess.id);
    setDraft(JSON.parse(JSON.stringify(sess)));
    setConfirmDelete(null); // clear any pending delete
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    setSessions(prev => {
      const next = prev.map(s => s.id === editingId ? draft : s);
      localStorage.setItem('il_sessions', JSON.stringify(next));
      return next;
    });
    setEditingId(null);
    setDraft(null);
  }

  function updateSet(exIdx, setIdx, field, value) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].sets[setIdx][field] = value;
      return next;
    });
  }

  function updateNotes(exIdx, value) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].notes = value;
      return next;
    });
  }

  function deleteSet(exIdx, setIdx) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.exercises[exIdx].sets.splice(setIdx, 1);
      return next;
    });
  }

  function addSet(exIdx) {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const sets = next.exercises[exIdx].sets;
      const last = sets[sets.length - 1] || {};
      sets.push({ ...last, rpe: null, pain: null, done: true });
      return next;
    });
  }

  if (!sessions.length) return (
    <div style={{ padding: 16, textAlign: 'center', color: C.muted, paddingTop: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>◫</div>
      <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', color: C.muted }}>No sessions yet</div>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Session Log</div>
      <div style={{ ...st.col() }}>
        {sorted.map(sess => {
          const isIron = sess.workout?.startsWith('IRON_');
          const ironDay = isIron ? parseInt(sess.workout.split('_')[1], 10) : null;
          const ironWkt = isIron ? getIronWorkout(ironDay) : null;
          const workoutTitle = isIron
            ? `Iron Series — Day ${ironDay}`
            : WORKOUTS[sess.workout]?.title || sess.workout;

          return (
          <div key={sess.id} style={{ ...st.card(), overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === sess.id ? null : sess.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isIron ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      background: C.dim, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: '3px 8px',
                      fontFamily: C.fCond, fontSize: 13, fontWeight: 700, color: C.text,
                    }}>
                      🔩 {ironDay}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{ironWkt?.title}</div>
                  </div>
                ) : (
                  <span style={{ fontFamily: C.fDisplay, fontSize: 34, color: C.amber, lineHeight: 1 }}>{sess.workout}</span>
                )}
                <div>
                  <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>{workoutTitle}</div>
                  <div style={{ ...st.mono(11, C.muted) }}>{fmtDate(sess.date)}</div>
                </div>
              </div>
              <div style={{ ...st.row, gap: 6 }}>
                {sess.energy && <span style={{ fontSize: 14 }}>{['😴','😕','😐','💪','🔥'][sess.energy - 1]}</span>}
                {sess.duration && <span style={st.pill(C.muted)}>⏱ {sess.duration}min</span>}
                {!sess.duration && !sess.completed && <span style={st.pill(C.muted)}>in progress</span>}
                <span style={{ color: C.muted, fontSize: 12 }}>{expanded === sess.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === sess.id && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                {editingId !== sess.id && sess.completed && (
                  <WorkoutEffortReview session={sess} watchData={watchData} allExercises={allExercises} />
                )}
                {(editingId === sess.id ? draft.exercises : sess.exercises)?.map((ex, exIdx) => {
                  const def = allExercises[ex.id] || EXERCISES[ex.id];
                  const isEditing = editingId === sess.id;
                  const isTimed = !!def?.isTimed;
                  const isBW = def?.unit === 'bw' || def?.unit === 'band';
                  const isPullup = !!def?.pullupTracking;
                  const loadLabel = def?.unit === 'band' ? 'BAND' : 'BW';

                  return (
                    <div key={ex.id} style={{ marginBottom: isEditing ? 14 : 10 }}>
                      <div style={{ ...st.label, marginBottom: 4 }}>{def?.name}</div>

                      {isEditing ? (
                        /* ── EDIT MODE ── */
                        <div>
                          {ex.sets.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, background: C.dim, borderRadius: 6, padding: '6px 8px' }}>
                              {/* Set number */}
                              <span style={{ ...st.mono(11, C.muted), width: 20, textAlign: 'center', flexShrink: 0 }}>S{i + 1}</span>

                              {/* Pullup mode selector */}
                              {isPullup && (
                                <select value={s.mode || 'bw'} onChange={e => updateSet(exIdx, i, 'mode', e.target.value)}
                                  style={{ ...st.inp, fontSize: 11, flex: '0 0 68px' }}>
                                  <option value="bw">BW</option>
                                  <option value="band">Band</option>
                                  <option value="neg">Neg</option>
                                </select>
                              )}

                              {/* Weight / Duration / BW label */}
                              {isTimed ? (
                                <input type="number" inputMode="numeric" value={s.duration ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'duration', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="sec" />
                              ) : isPullup && (s.mode || 'bw') === 'band' ? (
                                <input type="text" value={s.band || ''}
                                  onChange={e => updateSet(exIdx, i, 'band', e.target.value)}
                                  style={{ ...st.inp, flex: 1, fontSize: 12 }} placeholder="band" />
                              ) : isPullup && (s.mode || 'bw') === 'neg' ? (
                                <input type="number" inputMode="numeric" value={s.duration ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'duration', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="sec" />
                              ) : isBW ? (
                                <div style={{ ...st.inp, flex: 1, color: C.muted, fontSize: 10, lineHeight: '34px', border: `1px solid ${C.border}` }}>{loadLabel}</div>
                              ) : (
                                <input type="number" inputMode="decimal" value={s.weight ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'weight', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="kg" />
                              )}

                              {/* Reps (hidden for pure timed) */}
                              {!isTimed && (
                                <input type="number" inputMode="numeric" value={s.reps ?? ''}
                                  onChange={e => updateSet(exIdx, i, 'reps', e.target.value)}
                                  style={{ ...st.inp, flex: 1 }} placeholder="reps" />
                              )}

                              {/* RPE */}
                              <select value={s.rpe ?? ''} onChange={e => updateSet(exIdx, i, 'rpe', e.target.value ? +e.target.value : null)}
                                style={{ ...st.inp, flex: '0 0 52px', fontSize: 12 }}>
                                <option value=''>RPE</option>
                                {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>

                              {/* Pain */}
                              <select value={s.pain ?? ''} onChange={e => updateSet(exIdx, i, 'pain', e.target.value !== '' ? +e.target.value : null)}
                                style={{ ...st.inp, flex: '0 0 52px', fontSize: 12 }}>
                                <option value=''>Pain</option>
                                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>

                              {/* Delete set */}
                              <button onClick={() => deleteSet(exIdx, i)}
                                style={{ background: 'none', border: 'none', color: C.muted, fontSize: 15, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>
                                🗑
                              </button>
                            </div>
                          ))}

                          {/* Add set */}
                          <button onClick={() => addSet(exIdx)}
                            style={{ background: 'none', border: `1px dashed ${C.border}`, color: C.muted, borderRadius: 4, fontSize: 11, padding: '5px 12px', width: '100%', cursor: 'pointer', marginTop: 2 }}>
                            + Add set
                          </button>

                          {/* Exercise notes */}
                          <input type="text" value={ex.notes || ''} onChange={e => updateNotes(exIdx, e.target.value)}
                            placeholder="Exercise notes…"
                            style={{ ...st.inp, marginTop: 6, fontSize: 12, textAlign: 'left', padding: '7px 10px' }} />
                        </div>
                      ) : (
                        /* ── READ MODE (unchanged) ── */
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ex.sets.map((s, i) => {
                              const display = def?.isTimed ? `${s.duration}s`
                                : def?.pullupTracking
                                  ? s.mode === 'band' ? `${s.reps}r (${s.band || 'band'})`
                                    : s.mode === 'neg' ? `${s.reps}×${s.duration||'?'}s neg`
                                    : `${s.reps} reps`
                                : def?.unit === 'bw' || def?.unit === 'band' ? `${s.reps} reps`
                                : `${s.weight}kg × ${s.reps}`;
                              return (
                                <span key={i} style={{ ...st.pill(s.done ? C.text : C.muted), fontSize: 11 }}>
                                  {display}{s.rpe ? ` r${s.rpe}` : ''}
                                </span>
                              );
                            })}
                          </div>
                          {ex.notes && (
                            <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 4 }}>
                              {'\uD83D\uDCDD'} {ex.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {sess.notes && <div style={{ marginTop: 8, fontSize: 13, color: C.muted, fontStyle: 'italic', borderTop: `1px solid ${C.dim}`, paddingTop: 8 }}>"{sess.notes}"</div>}
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.dim}`, paddingTop: 10 }}>
                  {editingId === sess.id ? (
                    /* Edit mode footer: Save full-width, Cancel below */
                    <div>
                      <button onClick={saveEdit} style={{ ...st.btn(), marginBottom: 8 }}>
                        ✓ Save changes
                      </button>
                      <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, display: 'block', width: '100%', textAlign: 'center', padding: '4px 0' }}>
                        Cancel
                      </button>
                    </div>
                  ) : confirmDelete === sess.id ? (
                    /* Delete confirmation */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>Delete this session?</span>
                      <button onClick={() => deleteSession(sess.id)} style={{ ...st.btnSm('#d9534f'), padding: '5px 12px', fontSize: 12 }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ ...st.btnSm(), padding: '5px 12px', fontSize: 12 }}>Cancel</button>
                    </div>
                  ) : (
                    /* Read mode footer: Edit left, Delete right — never adjacent */
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => { startEdit(sess); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.amber, fontSize: 12, padding: 0 }}>
                        ✏ Edit
                      </button>
                      <button onClick={() => setConfirmDelete(sess.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, padding: 0, opacity: 0.7 }}>
                        🗑 Delete session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MINI SVG LINE CHART  (no external library)
// ═══════════════════════════════════════════════════════════════════════
function MiniLineChart({ data, dataKey, color, height = 160, domain }) {
  const [tooltip, setTooltip] = useState(null);
  const PAD = { top: 12, right: 12, bottom: 28, left: 38 };

  const vals = data.map(d => d[dataKey]).filter(v => v != null && !isNaN(v));
  if (vals.length < 2) return null;

  const rawMin = domain ? domain[0] : Math.min(...vals);
  const rawMax = domain ? domain[1] : Math.max(...vals);

  // Choose a step size that gives "nice" round tick values (0.5 / 1 / 2.5 / 5 / 10 / 25 …)
  const niceStep = (() => {
    if (domain) return null; // fixed-domain charts (e.g. RPE) keep their own scale
    const range = rawMax === rawMin ? 1 : rawMax - rawMin;
    const candidates = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 250, 500];
    return candidates.find(c => c >= range / 5) || 500;
  })();

  const yMin = niceStep
    ? Math.floor(rawMin / niceStep) * niceStep
    : rawMin - (rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.1);
  const yMax = niceStep
    ? Math.max(Math.ceil(rawMax / niceStep) * niceStep, yMin + niceStep)
    : rawMax + (rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.1);

  // We use a fixed render width for coordinate maths; CSS scales it.
  const W = 320;
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const xOf = i  => PAD.left + (i / (data.length - 1)) * innerW;
  const yOf = v  => PAD.top  + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  // Y-axis ticks at each step interval (or 5 evenly-spaced for fixed-domain)
  const yTicks = niceStep
    ? (() => {
        const ticks = [];
        for (let v = yMin; v <= yMax + niceStep * 0.01; v = Math.round((v + niceStep) * 1e9) / 1e9) {
          ticks.push({ v, y: yOf(v) });
        }
        return ticks;
      })()
    : Array.from({ length: 5 }, (_, i) => {
        const v = yMin + (i / 4) * (yMax - yMin);
        return { v: Math.round(v * 10) / 10, y: yOf(v) };
      });

  // Build polyline points (skip nulls)
  const segments = [];
  let cur = [];
  data.forEach((d, i) => {
    const v = d[dataKey];
    if (v != null && !isNaN(v)) { cur.push(`${xOf(i)},${yOf(v)}`); }
    else if (cur.length) { segments.push(cur); cur = []; }
  });
  if (cur.length) segments.push(cur);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map(({ y }, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
            stroke={C.border} strokeWidth={1} strokeDasharray="2 4" />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(({ v, y }, i) => (
          <text key={i} x={PAD.left - 5} y={y + 4}
            textAnchor="end" fill={C.muted} fontSize={9} fontFamily="JetBrains Mono, monospace">
            {v}
          </text>
        ))}

        {/* X-axis labels (show up to 6 evenly spaced) */}
        {data.map((d, i) => {
          const step = Math.max(1, Math.floor(data.length / 6));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={H - 6}
              textAnchor="middle" fill={C.muted} fontSize={9} fontFamily="JetBrains Mono, monospace">
              {d.date}
            </text>
          );
        })}

        {/* Lines */}
        {segments.map((pts, si) => (
          <polyline key={si} points={pts.join(' ')}
            fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        ))}

        {/* Dots + hit areas */}
        {data.map((d, i) => {
          const v = d[dataKey];
          if (v == null || isNaN(v)) return null;
          const cx = xOf(i), cy = yOf(v);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={3} fill={color} />
              <circle cx={cx} cy={cy} r={14} fill="transparent"
                onMouseEnter={() => setTooltip({ i, x: cx, y: cy, v, date: d.date })}
                style={{ cursor: 'crosshair' }} />
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = tooltip.x > W * 0.7 ? tooltip.x - 64 : tooltip.x + 8;
          const ty = tooltip.y < PAD.top + 28 ? tooltip.y + 6 : tooltip.y - 28;
          return (
            <g>
              <rect x={tx} y={ty} width={60} height={22} rx={3}
                fill={C.card} stroke={C.border} strokeWidth={1} />
              <text x={tx + 30} y={ty + 15} textAnchor="middle"
                fill={C.text} fontSize={10} fontFamily="JetBrains Mono, monospace">
                {tooltip.date}: {tooltip.v}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function healthAvg(readings, days = 7) {
  const vals = lastNDaysReadings(readings || [], days).map(r => Number(r.value)).filter(Number.isFinite);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

function healthMetricLatest(healthData, key) {
  return getLatestReading(healthData?.[key] || []);
}

function readinessFactors(healthData, sessions) {
  const recovery = computeRecovery(healthData);
  const fatigue = computeFatigue(healthData, sessions);
  const hrv = healthMetricLatest(healthData, 'hrv');
  const rhr = healthMetricLatest(healthData, 'restingHr');
  const hrvBase = healthAvg(healthData?.hrv, 7);
  const rhrBase = healthAvg(healthData?.restingHr, 7);
  const sleep = computeSleepScore(healthData);
  const factors = [];
  if (hrv && hrvBase) {
    const val = Number(hrv.value);
    factors.push({
      label: 'HRV',
      value: `${Math.round(val * 10) / 10} ms`,
      detail: val >= hrvBase ? 'above recent baseline' : 'below recent baseline',
      color: val >= hrvBase ? C.green : C.amber,
    });
  }
  if (rhr && rhrBase) {
    const val = Number(rhr.value);
    factors.push({
      label: 'Resting HR',
      value: `${Math.round(val)} bpm`,
      detail: val <= rhrBase ? 'down vs baseline' : 'elevated vs baseline',
      color: val <= rhrBase ? C.green : C.amber,
    });
  }
  if (sleep) {
    factors.push({
      label: 'Sleep',
      value: `${sleep.score}%`,
      detail: `${sleep.label.toLowerCase()} quality`,
      color: sleep.color,
    });
  }
  if (fatigue) {
    factors.push({
      label: 'Training load',
      value: `${Math.round(fatigue.level)}%`,
      detail: fatigue.level >= 60 ? 'high recent load' : fatigue.level >= 30 ? 'moderate recent load' : 'low recent load',
      color: fatigue.level >= 60 ? C.red : fatigue.level >= 30 ? C.amber : C.green,
    });
  }
  const limiting = factors.find(f => f.color === C.red) || factors.find(f => f.color === C.amber);
  const summary = recovery
    ? limiting
      ? `${limiting.label} is the main limiter today. Use this tab to see the trend behind the Home recommendation.`
      : 'Recovery signals are broadly supportive. Use the detail below to watch for slow changes over time.'
    : 'Import health metrics to connect training, sleep, and recovery trends.';
  return { recovery, fatigue, factors, summary };
}

function sleepStageRows(healthData) {
  const score = computeSleepScore(healthData);
  if (!score) return { score: null, rows: [] };
  const rows = [
    { label: 'Total asleep', value: score.totalSleep, unit: 'h', target: 7.5, color: C.blue, detail: 'overall duration' },
    { label: 'Efficiency', value: score.efficiency, unit: '%', target: 88, color: C.green, detail: 'time asleep while in bed' },
    { label: 'Deep', value: score.deep, unit: 'h', target: 1.1, color: C.purple, detail: 'physical recovery' },
    { label: 'REM', value: score.rem, unit: 'h', target: 1.5, color: C.amber, detail: 'mental recovery' },
    { label: 'Awake', value: score.awake, unit: 'h', target: 0.6, color: C.red, detail: 'restlessness', lowerBetter: true },
  ].filter(r => Number.isFinite(r.value));
  return { score, rows };
}

function HealthSectionHeader({ label, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon name={icon} size={16} color={C.muted} />
      <span style={{ fontFamily: C.fDisplay, fontSize: 13, fontWeight: 700, color: C.muted,
        textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</span>
    </div>
  );
}

function HealthInsightCard({ title, subtitle, tone = C.blue, children }) {
  return (
    <div style={{ ...st.card(), marginBottom: 16, borderLeft: `3px solid ${tone}` }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 19, fontWeight: 800, color: C.text, textTransform: 'uppercase', lineHeight: 1 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4, marginTop: 6 }}>{subtitle}</div>}
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

function HealthFactorGrid({ factors }) {
  if (!factors?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {factors.map(f => (
        <div key={f.label} style={{ background: C.dim, borderRadius: 8, padding: 10, minWidth: 0 }}>
          <div style={{ ...st.label, fontSize: 8, color: f.color }}>{f.label}</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1, marginTop: 4 }}>{f.value}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.25 }}>{f.detail}</div>
        </div>
      ))}
    </div>
  );
}

function SleepBreakdownCard({ healthData }) {
  const { score, rows } = sleepStageRows(healthData);
  if (!score) {
    return (
      <HealthInsightCard title="Sleep quality" subtitle="No sleep reading is available yet." tone={C.amber}>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>Export sleep from Health Auto Export to include duration, stages, awake time, and efficiency in Health.</div>
      </HealthInsightCard>
    );
  }
  return (
    <HealthInsightCard title="Sleep quality" subtitle={score.summary || 'Sleep stages imported from Apple Health.'} tone={score.color}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <RecoveryRing score={score.score} color={score.color} label={score.label} size={82} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
            Sleep score combines duration, efficiency, deep sleep, REM sleep, and awake time. It helps explain why Home may recommend a lighter or stronger session.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(row => {
          const rawPct = row.lowerBetter
            ? row.target / Math.max(row.value, row.target)
            : row.value / row.target;
          const pct = Math.max(8, Math.min(100, rawPct * 100));
          const display = row.unit === '%' ? `${Math.round(row.value)}%` : `${Math.round(row.value * 10) / 10} ${row.unit}`;
          return (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>{row.label} · {row.detail}</span>
                <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.text }}>{display}</span>
              </div>
              <div style={{ height: 7, background: C.dim, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: row.color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>
    </HealthInsightCard>
  );
}

function HealthMetricPanel({ metric, readings, chartData, latest, trainedDates, annotation, onImport }) {
  return (
    <div style={{ ...st.card(), marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>{metric.title}</div>
          <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, textTransform: 'uppercase', marginTop: 2 }}>{metric.subtitle}</div>
        </div>
        <button onClick={() => onImport(metric)} style={{ ...st.btnSm(C.dim, C.text), width: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px' }}>
          <Icon name="upload" size={14} /> Import
        </button>
      </div>
      {latest && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: C.fDisplay, fontSize: 26, fontWeight: 900, color: metric.color }}>{Number(latest.value).toLocaleString()}</span>
          <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>{metric.unit}</span>
          <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginLeft: 'auto' }}>{fmtHealthDate(latest.date)}</span>
        </div>
      )}
      {!readings.length ? (
        <div style={{ background: C.dim, borderRadius: 6, padding: 16, textAlign: 'center', color: C.muted, fontSize: 12 }}>
          No data yet — auto-syncs nightly via Health Auto Export.
        </div>
      ) : chartData.length < (metric.type === 'line' && !metric.sparse ? 2 : 1) ? (
        <div style={{ background: C.dim, borderRadius: 6, padding: 16, textAlign: 'center', color: C.muted, fontSize: 12 }}>
          Import more readings to draw this chart.
        </div>
      ) : metric.type === 'line' ? (
        <HealthLineChart data={chartData} metric={metric} trainedDates={trainedDates} />
      ) : (
        <HealthBarChart data={chartData} metric={metric} trainedDates={trainedDates} />
      )}
      {annotation}
      {metric.sparse && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Apple updates this estimate infrequently — requires outdoor GPS activity.</div>}
      {trainedDates.size > 0 && chartData.length > 0 && (
        <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, marginTop: 6 }}>▲ workout days</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════════════════════════════
function Progress({ sessions, allExercises = EXERCISES }) {
  // Group exercises by workout, sorted alphabetically within each group
  const workoutGroups = ['A', 'B', 'C'].map(key => {
    const w = WORKOUTS[key];
    const shortTitle = key === 'A' ? 'Push' : key === 'B' ? 'Pull' : 'Legs + Core';
    const ids = w.exercises
      .filter(id => allExercises[id])
      .sort((a, b) => (allExercises[a]?.name || a).localeCompare(allExercises[b]?.name || b));
    return { key, label: `Workout ${key} — ${shortTitle}`, ids };
  });
  const workoutExIds = new Set(['A', 'B', 'C'].flatMap(k => WORKOUTS[k].exercises));
  const otherIds = Object.keys(allExercises)
    .filter(id => !workoutExIds.has(id))
    .sort((a, b) => (allExercises[a]?.name || a).localeCompare(allExercises[b]?.name || b));

  const firstId = workoutGroups[0]?.ids[0] || Object.keys(allExercises)[0];
  const [selEx, setSelEx] = useState(firstId);

  const def = allExercises[selEx] || EXERCISES[selEx];

  const data = sessions
    .filter(s => s.exercises?.some(e => e.id === selEx))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(s => {
      const ex = s.exercises.find(e => e.id === selEx);
      if (!ex) return null;
      const weights = ex.sets.map(s => Number(s.weight) || 0);
      const reps    = ex.sets.map(s => Number(s.reps)   || 0);
      const volume  = ex.sets.reduce((t, s) => t + (Number(s.weight)||0) * (Number(s.reps)||0), 0);
      const maxRPE  = Math.max(...ex.sets.map(s => Number(s.rpe) || 0).filter(Boolean));
      return {
        date:   fmtShortDate(s.date),
        weight: def.unit === 'kg' ? (Math.max(...weights) || null) : null,
        reps:   Math.max(...reps) || null,
        volume: volume || null,
        rpe:    maxRPE || null,
      };
    }).filter(Boolean);

  if (!sessions.length) return (
    <div style={{ padding: 16, textAlign: 'center', color: C.muted, paddingTop: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>▲</div>
      <div style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase' }}>No data yet</div>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Progress</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...st.label, marginBottom: 6 }}>Exercise</div>
        <select value={selEx} onChange={e => setSelEx(e.target.value)}
          style={{ ...st.inp, textAlign: 'left', fontSize: 14, padding: '10px 12px' }}>
          {workoutGroups.map(({ key, label, ids }) => (
            <optgroup key={key} label={label}>
              {ids.map(id => <option key={id} value={id}>{allExercises[id]?.name || id}</option>)}
            </optgroup>
          ))}
          {otherIds.length > 0 && (
            <optgroup label="Other">
              {otherIds.map(id => <option key={id} value={id}>{allExercises[id]?.name || id}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {data.length < 2 ? (
        <div style={{ ...st.card(), textAlign: 'center', color: C.muted, padding: 32, fontSize: 13 }}>
          Need at least 2 sessions with this exercise to show a trend.
        </div>
      ) : (
        <div style={{ ...st.col(12) }}>
          {def.unit === 'kg' && (
            <div style={{ ...st.card() }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Top Set Weight (kg)</div>
              <MiniLineChart data={data} dataKey="weight" color={C.amber} height={160} />
            </div>
          )}
          {(def.unit === 'bw' || def.unit === 'band') && (
            <div style={{ ...st.card() }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Top Set Reps</div>
              <MiniLineChart data={data} dataKey="reps" color={C.green} height={160} />
            </div>
          )}
          {def.unit === 'kg' && data.some(d => d.volume) && (
            <div style={{ ...st.card() }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Session Volume (kg total)</div>
              <MiniLineChart data={data} dataKey="volume" color={C.blue} height={140} />
            </div>
          )}
          {data.some(d => d.rpe) && (
            <div style={{ ...st.card() }}>
              <div style={{ ...st.label, marginBottom: 8 }}>Session RPE</div>
              <MiniLineChart data={data} dataKey="rpe" color={C.purple} height={130} domain={[5, 10]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH VIEW
// ═══════════════════════════════════════════════════════════════════════
function HealthView({ sessions, allExercises, healthData, setHealthData }) {
  const [importMetric, setImportMetric] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState('');

  const completed   = sessions.filter(s => s.completed);
  const weeklyVol   = healthWeeklyVolume(sessions);
  const groupVol    = healthVolumeByGroup(sessions);
  const consistency = healthConsistency(sessions);
  const recentPRs   = healthRecentPRs(sessions, allExercises);
  const rpeTrend    = healthRPETrend(sessions);
  const maxWeekVol  = Math.max(...weeklyVol.map(w => w.volume), 1);
  const hrvCorrelation = healthWorkoutCorrelation(sessions, healthData.hrv || []);
  const readiness = readinessFactors(healthData, sessions);

  const rpeW = 280, rpeH = 56;
  const rpeMin = 4, rpeMax = 10;
  const rpePts = rpeTrend.map((d, i) => {
    const x = rpeTrend.length < 2 ? rpeW / 2 : (i / (rpeTrend.length - 1)) * rpeW;
    const y = rpeH - ((d.avgRpe - rpeMin) / (rpeMax - rpeMin)) * rpeH;
    return `${x},${Math.max(0, Math.min(rpeH, y))}`;
  });
  const rpePath = rpePts.length >= 2 ? `M${rpePts.join('L')}` : null;

  const sectionHeader = (label, icon) => <HealthSectionHeader label={label} icon={icon} />;

  function openImport(metric) {
    setImportMetric(metric);
    setImportText('');
    setImportError('');
    setImportResult('');
  }

  function confirmImport() {
    try {
      const parsed = JSON.parse(importText);
      const incoming = normaliseHealthReadings(parsed);
      setHealthData(prev => ({ ...prev, [importMetric.key]: mergeHealthReadings(prev[importMetric.key], incoming) }));
      setImportResult(`${incoming.length} readings imported`);
      setImportError('');
      setImportText('');
    } catch (e) {
      setImportError(e.message || 'Could not import this JSON.');
      setImportResult('');
    }
  }

  function confirmBulkImport() {
    try {
      const parsed = JSON.parse(bulkText);
      const bulk = parseHealthAutoExport(parsed);
      if (!bulk) throw new Error('Not a Health Auto Export JSON file. Expected {"data":{"metrics":[...]}}.');
      const counts = {};
      let merged;
      setHealthData(prev => {
        const next = { ...prev };
        Object.entries(bulk).forEach(([key, entries]) => {
          next[key] = mergeHealthReadings(prev[key], entries);
          counts[key] = entries.length;
        });
        merged = next;
        return next;
      });
      // Push to Supabase so it auto-loads next time (fire and forget)
      if (merged) pushHealthMetrics(merged);
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ');
      setBulkResult(`Imported: ${summary} — synced to cloud`);
      setBulkError('');
      setBulkText('');
    } catch (e) {
      setBulkError(e.message || 'Could not parse this file.');
      setBulkResult('');
    }
  }

  const renderTraining = () => !completed.length ? (
    <div style={{ ...st.card(), marginBottom: 16, textAlign: 'center', color: C.muted }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}>No training data yet</div>
      <div style={{ fontSize: 12, marginTop: 6 }}>Complete your first session to see training stats here.</div>
    </div>
  ) : (
    <>
      <div style={{ ...st.card(), marginBottom: 16 }}>
        {sectionHeader('Weekly Volume', 'bar-chart-2')}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginBottom: 8 }}>
          {weeklyVol.map((w, i) => {
            const pct = maxWeekVol > 0 ? w.volume / maxWeekVol : 0;
            const barH = Math.max(pct * 64, w.volume > 0 ? 4 : 0);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <div style={{
                  width: '100%', height: barH,
                  background: w.isCurrent ? C.amber : C.amber + '55',
                  borderRadius: '3px 3px 0 0',
                  outline: w.isCurrent ? `2px solid ${C.amber}` : 'none',
                  outlineOffset: 1,
                }} />
                <span style={{ fontFamily: C.fMono, fontSize: 8, color: w.isCurrent ? C.amber : C.muted,
                  textTransform: 'uppercase' }}>{w.label}</span>
              </div>
            );
          })}
        </div>
        {(() => {
          const curr = weeklyVol[weeklyVol.length - 1].volume;
          const prev = weeklyVol.slice(0, -1).filter(w => w.volume > 0);
          const prevAvg = prev.length ? Math.round(prev.reduce((s, w) => s + w.volume, 0) / prev.length) : 0;
          const pct = prevAvg > 0 ? Math.round(((curr - prevAvg) / prevAvg) * 100) : null;
          return (
            <div style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>
              This week: <span style={{ color: C.text }}>{curr.toLocaleString()} kg·reps</span>
              {pct !== null && (
                <span>{'  '}<span style={{ color: pct >= 0 ? C.green : C.red }}>
                  {pct >= 0 ? 'up ' : 'down '}{Math.abs(pct)}% vs avg
                </span></span>
              )}
            </div>
          );
        })()}
      </div>

      {groupVol.length > 0 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('This Week by Type', 'dumbbell')}
          {groupVol.map(g => (
            <div key={g.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.muted }}>{g.label}</span>
                <span style={{ fontFamily: C.fMono, fontSize: 11, color: C.text }}>{g.volume.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((g.volume / groupVol[0].volume) * 100)}%`,
                  background: g.color,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...st.card(), marginBottom: 16 }}>
        {sectionHeader('Consistency', 'calendar')}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            [consistency.streak, 'Streak', C.amber],
            [consistency.totalThisMonth, 'Sessions 28 days', C.text],
            [Math.round((consistency.totalThisMonth / 4) * 10) / 10, 'Per week', C.text],
          ].map(([value, label, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: C.fDisplay, fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: C.fMono, fontSize: 9, color: C.muted, textTransform: 'uppercase', marginTop: 4, lineHeight: 1.4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ fontFamily: C.fMono, fontSize: 8, color: C.muted,
              textAlign: 'center', paddingBottom: 2 }}>{d}</div>
          ))}
          {consistency.days.map((d, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 3,
              background: d.trained ? C.amber : C.dim,
              outline: d.isToday ? `2px solid ${C.amber}` : 'none',
              outlineOffset: 1,
              opacity: d.trained ? 1 : 0.5,
            }} />
          ))}
        </div>
      </div>

      {recentPRs.length > 0 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('Recent PRs', 'trophy')}
          {recentPRs.map((pr, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', paddingBottom: 8, marginBottom: 8,
              borderBottom: i < recentPRs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div>
                <div style={{ fontFamily: C.fBody, fontSize: 13, color: C.text }}>{pr.name}</div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>{pr.date.slice(0, 10)}</div>
              </div>
              <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 700, color: C.amber }}>
                {pr.weight}<span style={{ fontSize: 11, color: C.muted, fontFamily: C.fMono }}> kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {rpeTrend.length >= 2 && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          {sectionHeader('Effort Trend', 'flame')}
          <svg width="100%" viewBox={`0 0 ${rpeW} ${rpeH + 20}`} style={{ width: '100%', height: rpeH + 20, display: 'block', overflow: 'visible' }}>
            {[6, 7, 8].map(v => {
              const y = rpeH - ((v - rpeMin) / (rpeMax - rpeMin)) * rpeH;
              return (
                <g key={v}>
                  <line x1={0} y1={y} x2={rpeW} y2={y}
                    stroke={C.border} strokeWidth={1} strokeDasharray="3,3" />
                  <text x={2} y={y - 2} fill={C.muted} fontSize={8} fontFamily={C.fMono}>{v}</text>
                </g>
              );
            })}
            {rpePath && (
              <path d={rpePath} fill="none" stroke={C.amber} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            {rpeTrend.map((d, i) => {
              const x = rpeTrend.length < 2 ? rpeW / 2 : (i / (rpeTrend.length - 1)) * rpeW;
              const y = rpeH - ((d.avgRpe - rpeMin) / (rpeMax - rpeMin)) * rpeH;
              const cy = Math.max(0, Math.min(rpeH, y));
              const col = d.avgRpe >= 9 ? C.red : d.avgRpe >= 7 ? C.amber : C.green;
              return (
                <g key={i}>
                  <circle cx={x} cy={cy} r={4} fill={col} />
                  <text x={x} y={rpeH + 14} textAnchor="middle" fill={C.muted}
                    fontSize={8} fontFamily={C.fMono}>{d.label}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'center' }}>
            Avg RPE per session · last {rpeTrend.length} sessions
          </div>
        </div>
      )}
    </>
  );

  // Trained dates set for workout markers on charts
  const trainedDates = new Set(
    sessions.filter(s => s.completed).map(s => s.date ? localDateStr(new Date(s.date)) : null).filter(Boolean)
  );

  const metricPanels = {};
  HEALTH_METRICS.forEach(metric => {
    const readings = healthData[metric.key] || [];
    const chartData = metric.sparse ? readings.slice(-12) : lastNDaysReadings(readings, metric.days);
    const latest = readings[readings.length - 1];

    // Per-metric annotations
    let annotation = null;
    if (metric.key === 'hrv' && latest) {
      const avg = readings.length ? readings.reduce((s, r) => s + Number(r.value), 0) / readings.length : null;
      const status = hrvStatus(Number(latest.value), avg);
      if (status) annotation = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ ...st.pill(status.color), fontSize: 11, fontWeight: 700 }}>{status.label}</span>
          <span style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>
            {Number(latest.value) > avg ? '+' : ''}{Math.round((Number(latest.value) - avg) * 10) / 10} ms vs avg
          </span>
        </div>
      );
    }
    if (metric.key === 'restingHr') {
      const trend = healthSevenDayTrend(readings);
      if (trend != null) {
        const improving = trend < 0; // lower HR = better
        annotation = (
          <div style={{ fontFamily: C.fMono, fontSize: 11, color: improving ? C.green : C.amber, marginTop: 8 }}>
            {improving ? '↓' : '↑'} {Math.abs(trend)} bpm this week — {improving ? 'improving ✓' : 'trending up'}
          </div>
        );
      }
    }
    if (metric.key === 'steps' && metric.target) {
      const recent = lastNDaysReadings(readings, metric.days);
      const hit = recent.filter(r => Number(r.value) >= metric.target).length;
      annotation = (
        <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
          {hit} / {recent.length} days hit {metric.target.toLocaleString()} target
          {recent.length > 0 && <span style={{ color: hit / recent.length >= 0.7 ? C.green : C.amber }}>{' '}({Math.round(hit / recent.length * 100)}%)</span>}
        </div>
      );
    }
    if (metric.key === 'activeCal') {
      const recent = lastNDaysReadings(readings, 7);
      if (recent.length) {
        const avg = Math.round(recent.reduce((s, r) => s + Number(r.value), 0) / recent.length);
        annotation = (
          <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
            7-day avg: <span style={{ color: C.text }}>{avg.toLocaleString()} kcal</span>
          </div>
        );
      }
    }

    metricPanels[metric.key] = (
      <HealthMetricPanel
        key={metric.key}
        metric={metric}
        readings={readings}
        chartData={chartData}
        latest={latest}
        trainedDates={trainedDates}
        annotation={annotation}
        onImport={openImport}
      />
    );
  });

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ fontFamily: C.fDisplay, fontSize: 22, fontWeight: 900, letterSpacing: 2,
        textTransform: 'uppercase', color: C.text, marginBottom: 20 }}>
        Health
      </div>

      {sectionHeader('Readiness Breakdown', 'activity')}
      <HealthInsightCard
        title={readiness.recovery ? `${readiness.recovery.score}% · ${readiness.recovery.label}` : 'Health data needed'}
        subtitle={readiness.summary}
        tone={readiness.recovery?.color || C.amber}
      >
        <HealthFactorGrid factors={readiness.factors} />
      </HealthInsightCard>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Sleep', 'moon')}
        <SleepBreakdownCard healthData={healthData} />
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Cardiovascular', 'heart')}
        <HealthInsightCard
          title="Recovery signals"
          subtitle="HRV and resting heart rate are the main daily nervous-system signals. Blood oxygen and cardio fitness are useful context, but they should not be treated as diagnoses."
          tone={C.green}
        />
        {metricPanels.hrv}
        {metricPanels.restingHr}
        {metricPanels.bloodOxygen}
        {metricPanels.cardio}
        {hrvCorrelation && (
          <div style={{ ...st.card(), marginBottom: 16, borderColor: hrvCorrelation.pct >= 0 ? C.green + '55' : C.amber + '55' }}>
            {sectionHeader('Workout Correlation', 'activity')}
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.45 }}>
              Your HRV was <span style={{ color: hrvCorrelation.pct >= 0 ? C.green : C.amber, fontWeight: 700 }}>
                {Math.abs(hrvCorrelation.pct)}% {hrvCorrelation.pct >= 0 ? 'higher' : 'lower'}
              </span> on workout days this month.
            </div>
            <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted, marginTop: 8 }}>
              Workout avg {hrvCorrelation.workoutAvg} ms · Rest avg {hrvCorrelation.restAvg} ms
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Movement & Energy', 'footprints')}
        <HealthInsightCard
          title="Daily movement"
          subtitle="Steps and active calories support weight loss and general fitness. IronLog treats very high activity as extra load only when recovery is also under pressure."
          tone={C.blue}
        />
        {metricPanels.steps}
        {metricPanels.activeCal}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Training Response', 'dumbbell')}
        {renderTraining()}
      </div>

      <div style={{ marginTop: 24 }}>
        {sectionHeader('Data Tools', 'upload')}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <button onClick={() => { setBulkImportOpen(true); setBulkText(''); setBulkError(''); setBulkResult(''); }}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, fontFamily: C.fMono, cursor: 'pointer', textDecoration: 'underline' }}>
            Manual import (Health Auto Export JSON)
          </button>
        </div>
      </div>

      {bulkImportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(23,33,43,0.45)', zIndex: 500,
          display: 'flex', alignItems: 'flex-end', padding: 14 }}>
          <div style={{ ...st.card(), width: '100%', maxWidth: 560, margin: '0 auto 10px', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>
                  Health Auto Export
                </div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>HRV · Resting HR · Sleep · Steps · Active Cal · SpO2</div>
              </div>
              <button onClick={() => setBulkImportOpen(false)} style={{ background: C.dim, border: 'none', borderRadius: 6, width: 34, height: 34, color: C.text, cursor: 'pointer' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 8 }}>
              Open the <strong style={{ color: C.text }}>Health Auto Export</strong> app, export last 30 days as JSON, then paste the full file contents here.
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
              placeholder='{"data":{"metrics":[{"name":"heart_rate_variability",...}]}}'
              style={{ ...st.inp, textAlign: 'left', padding: 12, resize: 'vertical', lineHeight: 1.4, fontSize: 12 }} />
            {bulkError  && <div style={{ color: C.red,   fontSize: 12, marginTop: 8 }}>{bulkError}</div>}
            {bulkResult && <div style={{ color: C.green, fontSize: 12, marginTop: 8 }}>{bulkResult}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button onClick={() => setBulkImportOpen(false)} style={{ ...st.ghost }}>Done</button>
              <button onClick={confirmBulkImport} disabled={!bulkText.trim()} style={{ ...st.btn(), opacity: bulkText.trim() ? 1 : 0.45 }}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {importMetric && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(23,33,43,0.45)', zIndex: 500,
          display: 'flex', alignItems: 'flex-end', padding: 14 }}>
          <div style={{ ...st.card(), width: '100%', maxWidth: 560, margin: '0 auto 10px', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: C.fDisplay, fontSize: 18, fontWeight: 800, color: C.text, textTransform: 'uppercase' }}>
                  Import {importMetric.title}
                </div>
                <div style={{ fontFamily: C.fMono, fontSize: 10, color: C.muted }}>{importMetric.storage}</div>
              </div>
              <button onClick={() => setImportMetric(null)} style={{ background: C.dim, border: 'none', borderRadius: 6, width: 34, height: 34, color: C.text, cursor: 'pointer' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 8 }}>
              Paste either <span style={{ fontFamily: C.fMono }}>[{'{'}date,value{'}'}]</span> JSON or the Shortcuts blob format with newline-separated dates and values.
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8}
              placeholder='{"dates":"2026-05-06\n2026-05-07","values":"19.05\n22.54"}'
              style={{ ...st.inp, textAlign: 'left', padding: 12, resize: 'vertical', lineHeight: 1.4, fontSize: 12 }} />
            {importError && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{importError}</div>}
            {importResult && <div style={{ color: C.green, fontSize: 12, marginTop: 8 }}>{importResult}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button onClick={() => setImportMetric(null)} style={{ ...st.ghost }}>Done</button>
              <button onClick={confirmImport} disabled={!importText.trim()} style={{ ...st.btn(), opacity: importText.trim() ? 1 : 0.45 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RIDES
// ═══════════════════════════════════════════════════════════════════════
function Rides({ rides, setRides }) {
  const [open, setOpen] = useState(false);
  const [dur, setDur] = useState('');
  const [dist, setDist] = useState('');
  const [rpe, setRpe] = useState('');
  const [type, setType] = useState('moderate');
  const [notes, setNotes] = useState('');

  function log() {
    if (!dur) return;
    const ride = { id: Date.now().toString(), date: new Date().toISOString(), duration: +dur, distance: dist ? +dist : null, effort: rpe ? +rpe : null, type, notes };
    setRides(p => [...p, ride]);
    pushRide(ride); // fire-and-forget cloud backup
    setOpen(false); setDur(''); setDist(''); setRpe(''); setType('moderate'); setNotes('');
  }

  const typeColor = { easy: C.green, moderate: C.amber, hard: C.blue, hilly: C.amber, recovery: C.green, intervals: C.blue, sprinkles: C.blue, tempo: C.amber, long: C.green };
  const sorted = [...rides].reverse();

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={st.h2}>Rides</div>
        <button style={{ ...st.btnSm(), padding: '8px 14px' }} onClick={() => setOpen(!open)}>+ Log Ride</button>
      </div>

      {open && (
        <div style={{ ...st.card(), marginBottom: 16 }}>
          <div style={{ ...st.col(12) }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ ...st.label, marginBottom: 5 }}>Duration (min)</div>
                <input type="number" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} style={{ ...st.inp }} placeholder="e.g. 45" />
              </div>
              <div>
                <div style={{ ...st.label, marginBottom: 5 }}>Distance (km)</div>
                <input type="number" inputMode="decimal" value={dist} onChange={e => setDist(e.target.value)} style={{ ...st.inp }} placeholder="e.g. 18.5" />
              </div>
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Ride type</div>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }}>
                <option value="easy">Easy — felt easy, could talk</option>
                <option value="moderate">Moderate — working steadily</option>
                <option value="hard">Hard — really pushed it</option>
                <option value="hilly">Hilly — lots of climbing</option>
                <option value="recovery">Recovery — very easy spin</option>
              </select>
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Effort (1–10)</div>
              <input type="number" inputMode="numeric" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)} style={{ ...st.inp }} placeholder="e.g. 5" />
            </div>
            <div>
              <div style={{ ...st.label, marginBottom: 5 }}>Notes</div>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="How was it?" />
            </div>
            <button style={{ ...st.btn() }} onClick={log}>Save Ride</button>
          </div>
        </div>
      )}

      {/* Programme guide */}
      <div style={{ ...st.card(), marginBottom: 16, padding: '12px 14px' }}>
        <div style={{ ...st.label, marginBottom: 8 }}>Programme Guide</div>
        {[
          { phase: 'Wks 1–2', text: '2 rides/week · 20–30 min · keep it easy, conversational pace' },
          { phase: 'Wks 3–4', text: '2–3/week · 25–40 min · mostly easy, occasionally moderate effort' },
          { phase: 'Wk 5+',   text: '3/week · mix of easy, moderate, and one harder or hilly ride' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0', borderBottom: i < 2 ? `1px solid ${C.dim}` : 'none' }}>
            <span style={{ fontFamily: C.fMono, color: C.amber, minWidth: 56 }}>{r.phase}</span>
            <span style={{ color: C.muted }}>{r.text}</span>
          </div>
        ))}
      </div>

      {!rides.length ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>○</div>
          <div style={{ fontFamily: C.fDisplay, fontSize: 14, textTransform: 'uppercase' }}>No rides logged yet</div>
        </div>
      ) : (
        <div style={{ ...st.col() }}>
          {sorted.map(r => (
            <div key={r.id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
              <div>
                <div style={{ ...st.row, marginBottom: 4 }}>
                  <span style={st.pill(typeColor[r.type] || C.muted)}>{r.type}</span>
                  {r.effort && <span style={{ ...st.mono(11, C.muted) }}>RPE {r.effort}</span>}
                </div>
                {r.notes && <div style={{ fontSize: 12, color: C.muted }}>{r.notes}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {r.distance != null && (
                  <div style={{ fontFamily: C.fMono, fontSize: 22, color: C.amber, lineHeight: 1 }}>{r.distance}<span style={{ fontSize: 11, color: C.muted }}>km</span></div>
                )}
                <div style={{ fontFamily: C.fMono, fontSize: r.distance != null ? 15 : 22, color: C.text, lineHeight: 1.4 }}>{r.duration}<span style={{ fontSize: 11, color: C.muted }}>min</span></div>
                <div style={{ ...st.mono(10, C.muted) }}>{fmtDate(r.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PRESET EXERCISE LIBRARY
// ═══════════════════════════════════════════════════════════════════════
const PRESET_LIBRARY = {
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
const IRON_EXERCISES = {
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

const MUSCLE_META = {
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

function applyMuscleMeta(library) {
  Object.entries(library).forEach(([id, ex]) => {
    const [primaryMuscle, secondaryMuscle] = MUSCLE_META[id] || [null, null];
    ex.primary = primaryMuscle ? [primaryMuscle] : [];
    ex.secondary = secondaryMuscle ? [secondaryMuscle] : [];
    ex.primaryMuscle = primaryMuscle;
    ex.secondaryMuscle = secondaryMuscle;
  });
}

applyMuscleMeta(EXERCISES);
applyMuscleMeta(PRESET_LIBRARY);
applyMuscleMeta(IRON_EXERCISES);

function applyStretchMeta() {
  STRETCH_LIBRARY.forEach(s => {
    const [p, sec] = STRETCH_MUSCLE_META[s.id] || [null, null];
    s.primary      = p   ? [p]   : [];
    s.secondary    = sec ? [sec] : [];
    s.sciatica     = STRETCH_SCIATICA_IDS.has(s.id);
    s.cross_legged = STRETCH_CROSS_LEGGED_IDS.has(s.id);
  });
}
applyStretchMeta();

// ═══════════════════════════════════════════════════════════════════════
// MANAGE (Exercise Library + Workout Builder)
// ═══════════════════════════════════════════════════════════════════════
const MUSCLE_FILTERS = ['All','Push','Pull','Hinge','Legs','Quads','Hamstrings','Glutes','Shoulders','Arms','Core'];
const EMPTY_FORM = { name: '', muscle: 'Arms', unit: 'kg', defaultSets: 3, defaultReps: 10, repMax: 10, cue: '' };

function Manage({ customExercises, setCustomExercises, workoutCustom, setWorkoutCustom, workoutHidden, setWorkoutHidden, allExercises, driveSync, onDriveSave, onDriveLoad, onCloudSync, onDemoOpen }) {
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [addWktPicker, setAddWktPicker] = useState(null); // exId being placed into a workout
  const [expandedLib, setExpandedLib] = useState(null);  // exId currently expanded in library
  const [libDemoModal, setLibDemoModal] = useState(null); // { id, name } for in-app demo
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wktTab, setWktTab] = useState('A');
  const [addingTo, setAddingTo] = useState(null);
  const [wktSearch, setWktSearch] = useState('');
  const [librarySubTab, setLibrarySubTab]   = useState('exercises');
  const [expandedStretch, setExpandedStretch] = useState(null);
  const [libStretchModal, setLibStretchModal] = useState(null); // stretch object for demo modal
  const [strFilter, setStrFilter]            = useState('all'); // 'all' | 'sciatica' | 'crosslegged'

  // All exercises that can be browsed/added (workout exercises + presets + user-created custom)
  const libraryEntries = [
    ...Object.entries(EXERCISES),
    ...Object.entries(PRESET_LIBRARY),
    ...Object.entries(IRON_EXERCISES),
    ...Object.entries(customExercises),
  ];

  const allInAnyWorkout = new Set(
    ['A','B','C'].flatMap(k => [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])])
  );

  const filtered = libraryEntries.filter(([, ex]) => {
    const mMatch = muscle === 'All' || ex.muscle === muscle || ex.primaryMuscle === muscle;
    const sMatch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase());
    return mMatch && sMatch;
  });

  function addToWorkout(wKey, exId) {
    setWorkoutCustom(prev => ({ ...prev, [wKey]: [...(prev[wKey] || []), exId] }));
    setAddWktPicker(null);
    setAddingTo(null);
  }

  function removeFromWorkout(wKey, exId) {
    setWorkoutCustom(prev => ({ ...prev, [wKey]: (prev[wKey] || []).filter(id => id !== exId) }));
  }

  function saveCustom() {
    if (!form.name.trim()) return;
    const id = 'custom_' + Date.now();
    setCustomExercises(prev => ({ ...prev, [id]: {
      name: form.name.trim(), muscle: form.muscle, unit: form.unit,
      defaultSets: Number(form.defaultSets) || 3,
      defaultReps: Number(form.defaultReps) || 10,
      repMax: Number(form.repMax) || Number(form.defaultReps) || 10,
      cue: form.cue.trim(), isCustom: true,
    }}));
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function deleteCustom(id) {
    setCustomExercises(prev => { const n = { ...prev }; delete n[id]; return n; });
    setWorkoutCustom(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(k => { n[k] = (n[k] || []).filter(eid => eid !== id); });
      return n;
    });
  }

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...st.h2, marginBottom: 16 }}>Manage</div>

      {/* Sub-tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 20, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        {[['library','Library'],['workouts','Workouts'],['backup','Backup']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? C.amber : C.dim, color: tab === id ? '#fff' : C.muted,
            border: 'none', padding: '11px', fontFamily: C.fDisplay, fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Library tab ── */}
      {tab === 'library' && (
        <div>
          {/* Exercises / Stretches sub-tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['exercises','Exercises'],['stretches','Stretches']].map(([id, label]) => (
              <button key={id}
                onClick={() => { setLibrarySubTab(id); setExpandedStretch(null); setExpandedLib(null); }}
                style={{
                  background: librarySubTab === id ? C.amber : C.dim,
                  color: librarySubTab === id ? '#fff' : C.muted,
                  border: `1px solid ${librarySubTab === id ? C.amber : C.border}`,
                  borderRadius: 20, padding: '6px 16px', fontSize: 12, fontFamily: C.fDisplay,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                }}>{label}</button>
            ))}
          </div>

          {/* ── Exercises sub-tab ── */}
          {librarySubTab === 'exercises' && (
          <div>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...st.inp, textAlign: 'left', padding: '10px 12px', marginBottom: 10 }}
            placeholder="Search exercises…" />

          {/* Muscle filter pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
            {MUSCLE_FILTERS.map(m => (
              <button key={m} onClick={() => setMuscle(m)} style={{
                background: muscle === m ? C.amber : C.dim,
                color: muscle === m ? '#fff' : C.muted,
                border: `1px solid ${muscle === m ? C.amber : C.border}`,
                borderRadius: 20, padding: '5px 12px', fontSize: 11, fontFamily: C.fMono,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{m}</button>
            ))}
          </div>

          {/* Exercise cards */}
          <div style={{ ...st.col(8), marginBottom: 20 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 24, fontSize: 13 }}>No exercises match. Try creating a custom one below.</div>
            )}
            {filtered.map(([id, ex]) => {
              const inWorkouts = ['A','B','C'].filter(k =>
                [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])].includes(id)
              );
              const isAdding = addWktPicker === id;
              const isExpanded = expandedLib === id;
              return (
                <div key={id} style={{ ...st.card(), borderColor: ex.isCustom ? C.amber + '44' : C.border, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Card header — tappable to expand/collapse */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                    onClick={() => setExpandedLib(isExpanded ? null : id)}>
                    <ExerciseIcon id={id} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{ex.name}</span>
                        {ex.isCustom && <span style={{ ...st.pill(), fontSize: 9 }}>Custom</span>}
                        <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={st.pill(C.muted)}>{ex.primaryMuscle || ex.muscle}</span>
                        {ex.secondaryMuscle && <span style={{ ...st.pill('#e8f0ff'), color: '#5b8fdc', fontSize: 9 }}>{ex.secondaryMuscle}</span>}
                        <span style={{ ...st.mono(10, C.muted) }}>{ex.defaultSets} sets · {ex.isTimed ? `${ex.defaultDuration}s` : `${ex.defaultReps}${ex.repMax && ex.repMax !== ex.defaultReps ? '–' + ex.repMax : ''} reps`} · {ex.unit}</span>
                        {ex.perSide && <span style={st.pill(C.blue)}>Per side</span>}
                      </div>
                    </div>
                    {ex.isCustom && (
                      <button onClick={e => { e.stopPropagation(); deleteCustom(id); }} style={{ background: C.red + '18', border: `1px solid ${C.red}33`, borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
                    )}
                  </div>

                  {/* Expanded detail — muscle diagram + cue */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <div onClick={() => onDemoOpen && onDemoOpen(id)} style={{ cursor: 'pointer' }}>
                          <ExerciseIcon id={id} size={96} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                        <MuscleDiagram
                          primary={ex.primary || []}
                          secondary={ex.secondary || []}
                          size="medium"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: ex.cue ? 10 : 0 }}>
                        {(ex.primaryMuscle || ex.muscle) && (
                          <span style={{ background: C.amberDim, color: C.amber, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                            ● {ex.primaryMuscle || ex.muscle}
                          </span>
                        )}
                        {ex.secondaryMuscle && (
                          <span style={{ background: '#e8f0ff', color: '#5b8fdc', fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                            ○ {ex.secondaryMuscle}
                          </span>
                        )}
                      </div>
                      {ex.cue && (
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 6, padding: '8px 0' }}>
                          {ex.cue}
                        </div>
                      )}
                      {ex.demoId ? (
                        <button onClick={() => setLibDemoModal({ id: ex.demoId, name: ex.name })}
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: C.amber, cursor: 'pointer' }}>
                          ▶ Watch demo
                        </button>
                      ) : ex.demo ? (
                        <a href={ex.demo} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: C.amber, textDecoration: 'none' }}>
                          ▶ Watch demo
                        </a>
                      ) : null}
                    </div>
                  )}

                  {/* Already-in badges */}
                  {inWorkouts.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                      {inWorkouts.map(k => (
                        <span key={k} style={{ ...st.pill(C.green), fontSize: 9 }}>In Workout {k}</span>
                      ))}
                    </div>
                  )}

                  {/* Add to workout */}
                  {isAdding ? (
                    <div>
                      <div style={{ ...st.label, marginBottom: 6, fontSize: 9 }}>Add to which workout?</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['A','B','C'].map(k => {
                          const alreadyIn = [...WORKOUTS[k].exercises, ...(workoutCustom[k] || [])].includes(id);
                          return (
                            <button key={k} onClick={() => !alreadyIn && addToWorkout(k, id)} style={{
                              flex: 1, background: alreadyIn ? C.dim : C.amber, color: alreadyIn ? C.muted : '#fff',
                              border: 'none', borderRadius: 4, padding: '8px', fontFamily: C.fDisplay,
                              fontSize: 16, fontWeight: 700, cursor: alreadyIn ? 'default' : 'pointer',
                              opacity: alreadyIn ? 0.4 : 1,
                            }}>{k}</button>
                          );
                        })}
                        <button onClick={() => setAddWktPicker(null)} style={{ ...st.btnSm(C.dim, C.muted), flex: 1 }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setAddWktPicker(id)} style={{ ...st.btnSm(), fontSize: 12, flex: 1 }}>
                        ＋ Add to Workout
                      </button>
                      {ex.demoId ? (
                        <button onClick={() => setLibDemoModal({ id: ex.demoId, name: ex.name })} style={{
                          ...st.btnSm(C.dim, C.muted), fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                        }}>
                          <span style={{ color: C.red }}>▶</span> Demo
                        </button>
                      ) : ex.demo ? (
                        <a href={ex.demo} target="_blank" rel="noopener noreferrer" style={{
                          ...st.btnSm(C.dim, C.muted), fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ color: C.red }}>▶</span> Demo
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create custom */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <div style={{ ...st.label, marginBottom: 8 }}>Can't find what you need?</div>
            <button style={{ ...st.btn(showForm ? C.dim : C.surface, showForm ? C.muted : C.amber), border: `1px solid ${showForm ? C.border : C.amber}`, marginBottom: showForm ? 12 : 0 }}
              onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}>
              {showForm ? '✕ Cancel' : '＋ Create Custom Exercise'}
            </button>
            {showForm && (
              <div style={{ ...st.card(), borderColor: C.amber + '33' }}>
                <div style={{ ...st.col(12) }}>
                  <div>
                    <div style={{ ...st.label, marginBottom: 5 }}>Exercise Name *</div>
                    <input value={form.name} onChange={e => f('name', e.target.value)}
                      style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="e.g. Cable Lateral Raise" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ ...st.label, marginBottom: 5 }}>Muscle Group</div>
                      <select value={form.muscle} onChange={e => f('muscle', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 8px' }}>
                        {['Arms','Shoulders','Push','Pull','Hinge','Legs','Glutes','Core','Balance','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ ...st.label, marginBottom: 5 }}>Load Type</div>
                      <select value={form.unit} onChange={e => f('unit', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 8px' }}>
                        <option value="kg">Weight (kg)</option>
                        <option value="bw">Bodyweight</option>
                        <option value="band">Band</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Sets</div><input type="number" inputMode="numeric" value={form.defaultSets} onChange={e => f('defaultSets', e.target.value)} style={{ ...st.inp }} /></div>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Start Reps</div><input type="number" inputMode="numeric" value={form.defaultReps} onChange={e => f('defaultReps', e.target.value)} style={{ ...st.inp }} /></div>
                    <div><div style={{ ...st.label, marginBottom: 5 }}>Top Reps</div><input type="number" inputMode="numeric" value={form.repMax} onChange={e => f('repMax', e.target.value)} style={{ ...st.inp }} /></div>
                  </div>
                  <div>
                    <div style={{ ...st.label, marginBottom: 5 }}>Form Cue (optional)</div>
                    <input value={form.cue} onChange={e => f('cue', e.target.value)} style={{ ...st.inp, textAlign: 'left', padding: '10px 12px' }} placeholder="e.g. Keep elbows high throughout" />
                  </div>
                  <button style={{ ...st.btn(), opacity: form.name.trim() ? 1 : 0.4 }} onClick={saveCustom}>Save Exercise</button>
                </div>
              </div>
            )}
          </div>
          </div>
          )}

          {/* ── Stretches sub-tab ── */}
          {librarySubTab === 'stretches' && (
            <div style={{ ...st.col(8) }}>
              {/* Filter toggle — All / Sciatica / Cross-legged */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button onClick={() => setStrFilter('all')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'all' ? C.border : C.dim}`,
                    background: strFilter === 'all' ? C.dim : 'transparent',
                    color: strFilter === 'all' ? '#fff' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  All
                </button>
                <button onClick={() => setStrFilter('sciatica')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'sciatica' ? '#a78bfa' : C.dim}`,
                    background: strFilter === 'sciatica' ? '#2d1b4e' : 'transparent',
                    color: strFilter === 'sciatica' ? '#a78bfa' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  ◈ Sciatica
                </button>
                <button onClick={() => setStrFilter('crosslegged')}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: `1px solid ${strFilter === 'crosslegged' ? '#34d399' : C.dim}`,
                    background: strFilter === 'crosslegged' ? '#0a2e1e' : 'transparent',
                    color: strFilter === 'crosslegged' ? '#34d399' : C.muted,
                    fontFamily: C.fDisplay, fontSize: 11, cursor: 'pointer' }}>
                  ⊕ Cross-legged
                </button>
              </div>

              {STRETCH_LIBRARY.filter(s =>
                strFilter === 'all' ||
                (strFilter === 'sciatica'     && s.sciatica)     ||
                (strFilter === 'crosslegged'  && s.cross_legged)
              ).map((s) => {
                const isExp    = expandedStretch === s.id;
                const imgDir   = s.imageDir || 'stretches';
                const holdLabel = s.suggestedSecs
                  ? (s.bilateral ? `${s.suggestedSecs}s each side` : `${s.suggestedSecs}s`)
                  : null;
                return (
                  <div key={s.id} style={{ ...st.card(), display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Collapsed header — tappable */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                      onClick={() => setExpandedStretch(isExp ? null : s.id)}>
                      <img
                        src={`assets/icons/${imgDir}/${s.id}.png`}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', background: '#EEF3FF', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                        alt={s.name}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontFamily: C.fDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.name}</span>
                          <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 11, flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ ...st.mono(11, C.muted) }}>{s.targets}</span>
                          {s.sciatica     && <span style={{ background: '#2d1b4e', color: '#a78bfa', fontSize: 9, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono, fontWeight: 700 }}>Sciatica</span>}
                          {s.cross_legged && <span style={{ background: '#0a2e1e', color: '#34d399',  fontSize: 9, borderRadius: 20, padding: '2px 8px', fontFamily: C.fMono, fontWeight: 700 }}>Cross-legged</span>}
                          {s.bilateral   && <span style={{ ...st.pill(C.amber), fontSize: 9 }}>Both sides</span>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExp && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        {/* Image(s) — dual side-by-side for stretches with id2; tappable to animate */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}
                          onClick={() => setLibStretchModal(s)} title="Tap to animate">
                          {[s.id, s.id2].filter(Boolean).map(imgId => {
                            const sz = s.id2 ? 140 : 180;
                            return (
                              <img key={imgId}
                                src={`assets/icons/${imgDir}/${imgId}.png`}
                                style={{ width: sz, height: sz, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
                                onError={e => { e.target.style.opacity = 0.2; }}
                                alt={s.name}
                              />
                            );
                          })}
                        </div>
                        {/* Muscle diagram */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                          <MuscleDiagram primary={s.primary || []} secondary={s.secondary || []} size="medium" />
                        </div>
                        {/* Muscle pills */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                          {s.primary && s.primary[0] && (
                            <span style={{ background: C.amberDim, color: C.amber, fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                              ● {s.primary[0]}
                            </span>
                          )}
                          {s.secondary && s.secondary[0] && (
                            <span style={{ background: '#e8f0ff', color: '#5b8fdc', fontSize: 11, borderRadius: 20, padding: '3px 10px', fontFamily: C.fMono }}>
                              ○ {s.secondary[0]}
                            </span>
                          )}
                        </div>
                        {/* Hold time */}
                        {holdLabel && (
                          <div style={{ textAlign: 'center', fontSize: 11, color: C.amber, fontFamily: C.fMono, marginBottom: s.cue ? 8 : 0 }}>
                            ⏱ {holdLabel}
                          </div>
                        )}
                        {/* Caution banner */}
                        {s.caution && (
                          <div style={{ background: '#3a2800', border: `1px solid ${C.amber}`, borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontFamily: C.fMono, color: C.amber, fontWeight: 700, marginBottom: 2 }}>⚠ CAUTION</div>
                            <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontFamily: C.fMono }}>{s.caution}</div>
                          </div>
                        )}
                        {/* Cue text */}
                        {s.cue && (
                          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, padding: '8px 0' }}>
                            {s.cue}
                          </div>
                        )}
                        {/* Watch demo */}
                        {s.demoId && (
                          <button onClick={() => setLibStretchModal({ ...s, _ytDemo: true })}
                            style={{ background: 'none', border: 'none', padding: '4px 0 0', fontSize: 12, color: C.amber, cursor: 'pointer', fontFamily: C.fBody, textAlign: 'left' }}>
                            ▶ Watch demo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Workouts tab ── */}
      {tab === 'workouts' && (
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            Add or remove exercises from each workout. Tap Remove to hide a built-in exercise, Restore to bring it back.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
            {['A','B','C'].map(k => (
              <button key={k} onClick={() => { setWktTab(k); setAddingTo(null); setWktSearch(''); }} style={{
                background: wktTab === k ? C.amber : C.dim, color: wktTab === k ? '#fff' : C.muted,
                border: 'none', borderRadius: 5, padding: '8px', fontFamily: C.fDisplay, fontSize: 18, fontWeight: 700, cursor: 'pointer',
              }}>{k}</button>
            ))}
          </div>

          {(() => {
            const key = wktTab;
            const baseIds = WORKOUTS[key].exercises;
            const extraIds = workoutCustom[key] || [];
            const inWorkout = new Set([...baseIds, ...extraIds]);
            const available = [...Object.entries(PRESET_LIBRARY), ...Object.entries(customExercises)]
              .filter(([id]) => !inWorkout.has(id))
              .filter(([, ex]) => !wktSearch || ex.name.toLowerCase().includes(wktSearch.toLowerCase()));

            return (
              <div>
                <div style={{ ...st.label, marginBottom: 4 }}>Workout {key} · {WORKOUTS[key].title}</div>
                <div style={{ ...st.col(4), marginBottom: 14 }}>
                  {baseIds.map(id => {
                    const isHidden = (workoutHidden[key] || []).includes(id);
                    return (
                      <div key={id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', opacity: isHidden ? 0.45 : 1 }}>
                        <div>
                          <span style={{ fontSize: 13, textDecoration: isHidden ? 'line-through' : 'none' }}>{allExercises[id]?.name || id}</span>
                          <span style={{ ...st.mono(10, C.muted), marginLeft: 8 }}>{allExercises[id]?.muscle}</span>
                        </div>
                        {isHidden ? (
                          <button onClick={() => setWorkoutHidden(prev => ({ ...prev, [key]: (prev[key] || []).filter(eid => eid !== id) }))}
                            style={{ background: C.green + '18', border: '1px solid ' + C.green + '44', borderRadius: 4, color: C.green, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Restore</button>
                        ) : (
                          <button onClick={() => setWorkoutHidden(prev => ({ ...prev, [key]: [...(prev[key] || []), id] }))}
                            style={{ background: C.red + '18', border: '1px solid ' + C.red + '44', borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                        )}
                      </div>
                    );
                  })}
                  {extraIds.map(id => (
                    <div key={id} style={{ ...st.card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderColor: C.amber + '44' }}>
                      <div><span style={{ fontSize: 13 }}>{allExercises[id]?.name || id}</span><span style={{ ...st.mono(10, C.muted), marginLeft: 8 }}>{allExercises[id]?.muscle}</span></div>
                      <button onClick={() => removeFromWorkout(key, id)} style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 4, color: C.red, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>

                {addingTo === key ? (
                  <div>
                    <input value={wktSearch} onChange={e => setWktSearch(e.target.value)}
                      style={{ ...st.inp, textAlign: 'left', padding: '10px 12px', marginBottom: 10 }}
                      placeholder="Search exercises…" autoFocus />
                    <div style={{ ...st.col(4), maxHeight: 340, overflowY: 'auto', marginBottom: 8 }}>
                      {available.length === 0
                        ? <div style={{ fontSize: 12, color: C.muted, padding: 16, textAlign: 'center' }}>{wktSearch ? 'No matches.' : 'All exercises already in this workout.'}</div>
                        : available.map(([id, ex]) => (
                          <button key={id} onClick={() => addToWorkout(key, id)} style={{
                            ...st.card(), width: '100%', textAlign: 'left', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', background: ex.isCustom ? C.amber + '0a' : C.card,
                          }}>
                            <div>
                              <div style={{ fontSize: 13 }}>{ex.name}</div>
                              <div style={{ ...st.mono(10, C.muted) }}>{ex.defaultSets}×{ex.isTimed ? ex.defaultDuration + 's' : ex.defaultReps + ' reps'} · {ex.unit}</div>
                            </div>
                            <span style={st.pill(ex.isCustom ? C.amber : C.muted)}>{ex.muscle}</span>
                          </button>
                        ))
                      }
                    </div>
                    <button style={{ ...st.ghost }} onClick={() => { setAddingTo(null); setWktSearch(''); }}>Cancel</button>
                  </div>
                ) : (
                  <button style={{ ...st.btn() }} onClick={() => setAddingTo(key)}>＋ Add Exercise to Workout {key}</button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Backup tab ── */}
      {tab === 'backup' && (
        <div>
          <div style={{ ...st.card(), marginBottom: 16 }}>
            <div style={{ ...st.label, marginBottom: 10 }}>Cloud Sync</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: driveSync?.cloudStatus === 'ok' ? C.green : driveSync?.cloudStatus === 'error' ? C.red : C.muted, fontFamily: C.fMono }}>
                {driveSync?.cloudStatus === 'ok' && `☁ Synced ${driveSync.lastCloudSync ? new Date(driveSync.lastCloudSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''}`}
                {driveSync?.cloudStatus === 'error' && '☁ Sync failed'}
                {driveSync?.cloudStatus === 'syncing' && '☁ Syncing…'}
                {(!driveSync?.cloudStatus || driveSync.cloudStatus === 'idle') && '☁ Supabase auto-sync on'}
              </span>
              <button onClick={onCloudSync} style={{ ...st.btnSm(C.dim, C.muted), fontSize: 11, marginLeft: 'auto' }}>
                Sync now
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              Sessions and rides are backed up automatically. Use JSON backup only for manual archives or emergency restore.
            </div>
          </div>

          <div style={{ ...st.card(), marginBottom: 16 }}>
            <div style={{ ...st.label, marginBottom: 10 }}>JSON Backup & Restore</div>
            {driveSync?.status === 'error' && (
              <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: C.fMono }}>⚠ {driveSync.error}</div>
            )}
            {driveSync?.status === 'done' && driveSync.lastSync && (
              <div style={{ fontSize: 11, color: C.green, marginBottom: 10, fontFamily: C.fMono }}>
                ✓ Exported {new Date(driveSync.lastSync).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={onDriveSave} style={{ ...st.btn() }}>
                ↓ Export JSON
              </button>
              <label style={{ ...st.btn(C.dim, C.muted), textAlign: 'center', cursor: 'pointer', border: `1px solid ${C.border}` }}>
                ↑ Import JSON
                <input type="file" accept=".json" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) onDriveLoad(e.target.files[0]); e.target.value = ''; }} />
              </label>
            </div>
          </div>

          <button
            onClick={() => window.location.reload(true)}
            style={{ ...st.btn(C.dim, C.muted), width: '100%', fontSize: 12 }}
          >
            ↺ Check for updates
          </button>
        </div>
      )}
      {libDemoModal && (
        <YouTubeModal
          ytId={libDemoModal.id}
          title={libDemoModal.name}
          onClose={() => setLibDemoModal(null)}
        />
      )}
      {libStretchModal && !libStretchModal._ytDemo && (
        <StretchDemoModal stretch={libStretchModal} onClose={() => setLibStretchModal(null)} />
      )}
      {libStretchModal?.demoId && libStretchModal._ytDemo && (
        <YouTubeModal ytId={libStretchModal.demoId} title={libStretchModal.name} onClose={() => setLibStretchModal(null)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EXERCISE DEMO MODAL
// ═══════════════════════════════════════════════════════════════════════
function ExerciseDemoModal({ exerciseId, onClose }) {
  const [frames, setFrames] = React.useState([]);
  const [seqIdx, setSeqIdx] = React.useState(0);

  // Probe for available demo frames (up to 3)
  React.useEffect(() => {
    setFrames([]);
    setSeqIdx(0);
    let checked = 0;
    const found = [];
    for (let i = 1; i <= 3; i++) {
      const img = new window.Image();
      const src = `assets/demos/${exerciseId}_${i}.png?v=${APP_BUILD}`;
      const idx = i - 1;
      img.onload  = () => { found[idx] = src; checked++; if (checked === 3) setFrames(found.filter(Boolean)); };
      img.onerror = () => {                    checked++; if (checked === 3) setFrames(found.filter(Boolean)); };
      img.src = src;
    }
  }, [exerciseId]);

  // Ping-pong cycle: 2 frames → [0,1], 3 frames → [0,1,2,1]
  React.useEffect(() => {
    if (frames.length < 2) return;
    const seq = frames.length >= 3 ? [0, 1, 2, 1] : [0, 1];
    const id = setInterval(() => setSeqIdx(p => (p + 1) % seq.length), 450);
    return () => clearInterval(id);
  }, [frames]);

  const seq = frames.length >= 3 ? [0, 1, 2, 1] : [0, 1];
  const currentSrc = frames.length > 0 ? frames[seq[seqIdx]] : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(10,15,40,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {currentSrc ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#EEF3FF',
            borderRadius: 28,
            padding: 16,
            boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
          }}
        >
          <img
            src={currentSrc}
            style={{ width: 300, height: 300, objectFit: 'contain', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: C.fMono, fontSize: 11, letterSpacing: 1 }}>
          NO DEMO YET
        </div>
      )}
      <div style={{
        position: 'absolute', top: 24, right: 24,
        color: 'rgba(255,255,255,0.5)', fontSize: 28, lineHeight: 1, cursor: 'pointer',
      }}>✕</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// YOUTUBE EMBED MODAL
function YouTubeModal({ ytId, title, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(5,10,30,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, padding: '0 12px', boxSizing: 'border-box' }}
      >
        {title && (
          <div style={{ fontFamily: C.fCond, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
            {title}
          </div>
        )}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, color: 'rgba(255,255,255,0.7)', padding: '8px 24px',
            fontSize: 13, cursor: 'pointer',
          }}>✕ Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STRETCH DEMO MODAL  (animated frames from assets/demos/stretches/)
function StretchDemoModal({ stretch, onClose }) {
  const [frames, setFrames] = React.useState([]);
  const [seqIdx, setSeqIdx] = React.useState(0);

  React.useEffect(() => {
    setFrames([]);
    setSeqIdx(0);
    // Probe all frame slots across primary id and optional id2
    const ids = [stretch.id, stretch.id2].filter(Boolean);
    const found = [];
    let checked = 0;
    const total = ids.length * 3;
    ids.forEach((sid, si) => {
      for (let fi = 1; fi <= 3; fi++) {
        const img = new window.Image();
        const src = `assets/demos/stretches/${sid}_${fi}.png?v=${APP_BUILD}`;
        const slot = si * 3 + fi - 1;
        img.onload  = () => { found[slot] = src; checked++; if (checked === total) setFrames(found.filter(Boolean)); };
        img.onerror = () => {                    checked++; if (checked === total) setFrames(found.filter(Boolean)); };
        img.src = src;
      }
    });
  }, [stretch.id]);

  React.useEffect(() => {
    if (frames.length < 2) return;
    const id = setInterval(() => setSeqIdx(p => (p + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [frames]);

  const currentSrc = frames.length > 0 ? frames[seqIdx] : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10,15,40,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
        {currentSrc ? (
          <div style={{ background: '#EEF3FF', borderRadius: 28, padding: 16, boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
            <img src={currentSrc} style={{ width: 300, height: 300, objectFit: 'contain', display: 'block' }} />
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: C.fMono, fontSize: 11, letterSpacing: 1 }}>NO ANIMATION YET</div>
        )}
        <div style={{ fontFamily: C.fDisplay, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', textAlign: 'center' }}>{stretch.name}</div>
      </div>
      <div style={{ position: 'absolute', top: 24, right: 24, color: 'rgba(255,255,255,0.5)', fontSize: 28, lineHeight: 1, cursor: 'pointer' }}>✕</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WARMUP / FINISHER ICON MODAL
function WarmupDemoModal({ item, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(10,15,40,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#EEF3FF',
          borderRadius: 28,
          padding: 20,
          boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          maxWidth: 320, margin: 24,
        }}
      >
        <img
          src={`assets/icons/warmup/${item.id}.png`}
          style={{ width: 260, height: 260, objectFit: 'contain', display: 'block' }}
          onError={e => { e.target.style.opacity = 0.2; }}
        />
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1a2a4a', textAlign: 'center', fontFamily: C.fMono }}>
          {item.text}
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 24, right: 24,
        color: 'rgba(255,255,255,0.5)', fontSize: 28, lineHeight: 1, cursor: 'pointer',
      }}>✕</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════
export default function App() {
  const [demoExId, setDemoExId] = useState(null);
  const [warmupDemoItem, setWarmupDemoItem] = useState(null);
  const [view, setView] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [rides, setRides] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState('A');
  const [customExercises, setCustomExercises] = useState({});
  const [workoutCustom, setWorkoutCustom] = useState({ A: [], B: [], C: [] });
  const [workoutHidden, setWorkoutHidden] = useState({ A: [], B: [], C: [] });
  const [ready, setReady] = useState(false);
  const [driveSync, setDriveSync] = useState({ status: 'idle', lastSync: null, error: null });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [preStartSwaps, setPreStartSwaps] = useState({});
  const [ironView, setIronView] = useState(false);
  const [healthData, setHealthData] = useState({
    hrv: [], restingHr: [], steps: [], activeCal: [], cardio: [], sleep: [], bloodOxygen: [],
    sleepDeep: [], sleepRem: [], sleepCore: [], sleepAwake: [], sleepInBed: [], sleepEfficiency: [],
  });
  const [watchData, setWatchData] = useState({ matches: [], workouts: [], samples: [], ecg: [] });

  // Keep a ref to current data so export always uses the latest state
  const dataRef = useRef({});

  const allExercises = { ...EXERCISES, ...PRESET_LIBRARY, ...IRON_EXERCISES, ...customExercises };
  const coachRec = computeCoachRecommendation(sessions, rides, selectedWorkout);
  const recovery = computeRecovery(healthData);

  useEffect(() => {
    dataRef.current = { sessions, rides, customExercises, workoutCustom };
  }, [sessions, rides, customExercises, workoutCustom]);

  useEffect(() => {
    (async () => {
      const [
        s, r, a, ce, wc, wh, hrv, restingHr, steps, activeCal, cardio, sleep, bloodOxygen,
        sleepDeep, sleepRem, sleepCore, sleepAwake, sleepInBed, sleepEfficiency,
      ] = await Promise.all([
        load('il_sessions'), load('il_rides'), load('il_active'),
        load('il_custom_exercises'), load('il_workout_custom'), load('il_workout_hidden'),
        load('il_health_hrv'), load('il_health_resting_hr'), load('il_health_steps'),
        load('il_health_active_cal'), load('il_health_cardio'), load('il_health_sleep'), load('il_health_blood_oxygen'),
        load('il_health_sleep_deep'), load('il_health_sleep_rem'), load('il_health_sleep_core'),
        load('il_health_sleep_awake'), load('il_health_sleep_in_bed'), load('il_health_sleep_efficiency'),
      ]);
      const localSessions = migrateSessions(s);
      const localRides    = r || [];

      // Attempt cloud restore — only replaces local if cloud has more records
      const [cloudSessions, cloudRides, cloudHealth, cloudWatch] = await Promise.all([
        pullSessions(localSessions),
        pullRides(localRides),
        pullHealthMetrics(),
        pullWatchWorkouts(),
      ]);
      const finalSessions = cloudSessions || localSessions;
      const finalRides    = cloudRides    || localRides;

      setSessions(finalSessions);
      setRides(finalRides);
      if (a)  setActiveSession(migrateSession(a));
      if (ce) setCustomExercises(ce);
      if (wc) setWorkoutCustom(wc);
      if (wh) setWorkoutHidden(wh);

      const localHealth = {
        hrv: hrv || [], restingHr: restingHr || [], steps: steps || [], activeCal: activeCal || [],
        cardio: cardio || [], sleep: sleep || [], bloodOxygen: bloodOxygen || [],
        sleepDeep: sleepDeep || [], sleepRem: sleepRem || [], sleepCore: sleepCore || [],
        sleepAwake: sleepAwake || [], sleepInBed: sleepInBed || [], sleepEfficiency: sleepEfficiency || [],
      };
      setHealthData(mergeHealthData(cloudHealth, localHealth));
      setWatchData(cloudWatch || { matches: [], workouts: [], samples: [], ecg: [] });
      setSelectedWorkout(nextWorkout(finalSessions));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    fetch('version.json?t=' + Date.now())
      .then(r => r.json())
      .then(d => { if (d.v && d.v > APP_BUILD) setUpdateAvailable(true); })
      .catch(() => {});
  }, []);

  useEffect(() => { if (ready) save('il_sessions', sessions); }, [sessions, ready]);
  useEffect(() => { if (ready) save('il_rides', rides); }, [rides, ready]);
  useEffect(() => { if (ready) save('il_active', activeSession); }, [activeSession, ready]);
  useEffect(() => { if (ready) save('il_custom_exercises', customExercises); }, [customExercises, ready]);
  useEffect(() => { if (ready) save('il_workout_custom', workoutCustom); }, [workoutCustom, ready]);
  useEffect(() => { if (ready) save('il_workout_hidden', workoutHidden); }, [workoutHidden, ready]);
  useEffect(() => { if (ready) save('il_health_hrv', healthData.hrv); }, [healthData.hrv, ready]);
  useEffect(() => { if (ready) save('il_health_resting_hr', healthData.restingHr); }, [healthData.restingHr, ready]);
  useEffect(() => { if (ready) save('il_health_steps', healthData.steps); }, [healthData.steps, ready]);
  useEffect(() => { if (ready) save('il_health_active_cal', healthData.activeCal); }, [healthData.activeCal, ready]);
  useEffect(() => { if (ready) save('il_health_cardio', healthData.cardio); }, [healthData.cardio, ready]);
  useEffect(() => { if (ready) save('il_health_sleep', healthData.sleep); }, [healthData.sleep, ready]);
  useEffect(() => { if (ready) save('il_health_blood_oxygen', healthData.bloodOxygen); }, [healthData.bloodOxygen, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_deep', healthData.sleepDeep); }, [healthData.sleepDeep, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_rem', healthData.sleepRem); }, [healthData.sleepRem, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_core', healthData.sleepCore); }, [healthData.sleepCore, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_awake', healthData.sleepAwake); }, [healthData.sleepAwake, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_in_bed', healthData.sleepInBed); }, [healthData.sleepInBed, ready]);
  useEffect(() => { if (ready) save('il_health_sleep_efficiency', healthData.sleepEfficiency); }, [healthData.sleepEfficiency, ready]);

  function handleExport() {
    exportData(dataRef.current);
    setDriveSync({ status: 'done', lastSync: new Date().toISOString(), error: null });
  }

  async function handleImport(file) {
    if (!file) return;
    setDriveSync(s => ({ ...s, status: 'loading', error: null }));
    try {
      const data = validateBackup(await importData(file));
      setActiveSession(null);
      if (data.sessions)        setSessions(migrateSessions(data.sessions));
      if (data.rides)           setRides(data.rides);
      if (data.customExercises) setCustomExercises(data.customExercises);
      if (data.workoutCustom)   setWorkoutCustom(data.workoutCustom);
      if (data.sessions)        setSelectedWorkout(nextWorkout(data.sessions));
      setDriveSync({ status: 'done', lastSync: new Date().toISOString(), error: null });
    } catch (e) {
      setDriveSync(s => ({ ...s, status: 'error', error: e.message }));
    }
  }

  async function handleCloudSync() {
    if (activeSession) return; // never sync mid-workout
    setDriveSync(s => ({ ...s, cloudStatus: 'syncing' }));
    try {
      const { sessions: cur, rides: curRides } = dataRef.current;
      await Promise.all([
        ...cur.map(pushSession),
        ...curRides.map(pushRide),
      ]);
      setDriveSync(s => ({ ...s, cloudStatus: 'ok', lastCloudSync: new Date().toISOString() }));
    } catch (e) {
      setDriveSync(s => ({ ...s, cloudStatus: 'error' }));
    }
  }

  function handleComplete(sess) {
    setSessions(p => [...p, sess]);
    setActiveSession(null);
    pushSession(sess); // fire-and-forget cloud backup
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: C.fMono, color: C.amber, letterSpacing: 1 }}>LOADING...</div>
    </div>
  );

  return (
    <>
      <FontLoader />
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{margin:0;background:${C.bg};}
        input,select,textarea{outline:none;-webkit-appearance:none;appearance:none;}
        input:focus,select:focus,textarea:focus{border-color:${C.amber}!important;}
        select option{background:${C.surface};color:${C.text};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${C.border};}
        ::placeholder{color:${C.muted};}
      `}</style>
      <div style={st.screen}>
        {view === 'preStart' && (
          <PreStartScreen
            selectedWorkout={selectedWorkout}
            coachRec={coachRec}
            preStartSwaps={preStartSwaps}
            setPreStartSwaps={setPreStartSwaps}
            allExercises={allExercises}
            sessions={sessions}
            workoutCustom={workoutCustom}
            workoutHidden={workoutHidden}
            setActiveSession={setActiveSession}
            setView={setView}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard sessions={sessions} rides={rides} setView={setView} activeSession={activeSession}
            selectedWorkout={selectedWorkout} setSelectedWorkout={setSelectedWorkout}
            allExercises={allExercises} workoutCustom={workoutCustom}
            workoutHidden={workoutHidden} setWorkoutHidden={setWorkoutHidden}
            driveSync={driveSync} onCloudSync={handleCloudSync}
            updateAvailable={updateAvailable} onWarmupOpen={setWarmupDemoItem}
            onDemoOpen={setDemoExId}
            coachRec={coachRec} showWhy={showWhy} setShowWhy={setShowWhy}
            healthData={healthData} watchData={watchData} />
        )}
        {view === 'workout' && (
          <>
            {!activeSession && (
              <div style={{ display: 'flex', background: C.dim, borderRadius: 10, padding: 3, margin: '12px 14px 0', gap: 3 }}>
                {[['My Split', false], ['🔩 Iron Series', true]].map(([label, val]) => (
                  <button key={label} onClick={() => setIronView(val)} style={{
                    flex: 1, padding: '7px 4px',
                    borderRadius: 7, border: 'none',
                    background: ironView === val ? C.card : 'transparent',
                    color: ironView === val ? C.text : C.muted,
                    fontFamily: C.fCond, fontSize: 13, fontWeight: 700,
                    boxShadow: ironView === val ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                    cursor: 'pointer',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {ironView && !activeSession ? (
              <IronSeriesView
                sessions={sessions}
                allExercises={allExercises}
                onDemoOpen={setDemoExId}
                onStart={key => {
                  const sess = buildSession(key, sessions, allExercises, workoutCustom, workoutHidden);
                  if (sess) {
                    setIronView(false);
                    setActiveSession(sess);
                  }
                }}
              />
            ) : (
              <ActiveWorkout
                sessions={sessions}
                activeSession={activeSession}
                setActiveSession={setActiveSession}
                onComplete={handleComplete}
                setView={setView}
                selectedWorkout={selectedWorkout}
                setSelectedWorkout={setSelectedWorkout}
                allExercises={allExercises}
                workoutCustom={workoutCustom}
                workoutHidden={workoutHidden}
                setWorkoutHidden={setWorkoutHidden}
                onDemoOpen={setDemoExId}
                onWarmupOpen={setWarmupDemoItem}
                coachRec={coachRec}
                showWhy={showWhy}
                setShowWhy={setShowWhy}
                recovery={recovery}
                watchData={watchData}
              />
            )}
          </>
        )}
        {(view === 'stretch' || view === 'stretch_setup') && <StretchSetup onBegin={() => setView('stretch_active')} onSkip={() => setView('dashboard')} />}
        {view === 'stretch_active' && <StretchActive onDone={() => setView('dashboard')} />}
        {view === 'history' && <History sessions={sessions} setSessions={setSessions} allExercises={allExercises} watchData={watchData} />}
        {view === 'progress' && <ProgressScreen sessions={sessions} allExercises={allExercises} workouts={WORKOUTS} formatDate={fmtShortDate} Chart={MiniLineChart} />}
        {view === 'health'   && <HealthView sessions={sessions} allExercises={allExercises} healthData={healthData} setHealthData={setHealthData} />}
        {view === 'rides' && <RidesScreen rides={rides} setRides={setRides} onCloudSave={pushRide} />}
        {view === 'manage' && (
          <Manage
            customExercises={customExercises}
            setCustomExercises={setCustomExercises}
            workoutCustom={workoutCustom}
            setWorkoutCustom={setWorkoutCustom}
            workoutHidden={workoutHidden}
            setWorkoutHidden={setWorkoutHidden}
            allExercises={allExercises}
            driveSync={driveSync}
            onDriveSave={handleExport}
            onDriveLoad={handleImport}
            onCloudSync={handleCloudSync}
            onDemoOpen={setDemoExId}
          />
        )}
      </div>
      <Nav view={view} setView={setView} hasActive={!!activeSession} Icon={Icon} />
      {demoExId && <ExerciseDemoModal exerciseId={demoExId} onClose={() => setDemoExId(null)} />}
      {warmupDemoItem && <WarmupDemoModal item={warmupDemoItem} onClose={() => setWarmupDemoItem(null)} />}
    </>
  );
}
