import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dumbbell, ChevronLeft, ChevronRight, Check, Video, TrendingUp, RotateCcw, Flame, Settings, CalendarDays, Timer, BarChart3, MessageCircle, X } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { storage } from "./storage";

// ---------- PLAN DATA ----------
const DAYS = [
  { key: "tue", label: "Tuesday", short: "TUE", focus: "Chest & Push — Strength" },
  { key: "wed", label: "Wednesday", short: "WED", focus: "Legs, Glutes & Abs — Strength" },
  { key: "thu", label: "Thursday", short: "THU", focus: "Chest & Biceps — Hypertrophy" },
  { key: "fri", label: "Friday", short: "FRI", focus: "Thighs, Glutes & Abs" },
];

const BENCH_PCTS = [0.875, 0.9, 0.925, 0.95, 0.975, 0.85];
const SQUAT_PCTS = [0.792, 0.833, 0.854, 0.896, 0.917, 0.771];

// a 5-6 minute warm-up tailored to each day's movement pattern, not loggable, just a routine to run through
const WARMUPS = {
  tue: {
    title: "Chest & Push Warm-Up",
    duration: "5-6 min",
    steps: [
      "Arm circles, 20 seconds each direction",
      "Band pull-aparts or empty-bar pull-aparts, 15 reps",
      "Push-up to downward dog, 8 slow reps",
      "Shoulder dislocates with a band or broomstick, 10 reps",
      "Light bench press with just the bar, 2 sets of 10",
    ],
  },
  wed: {
    title: "Legs, Glutes & Abs Warm-Up",
    duration: "5-6 min",
    steps: [
      "Leg swings, 10 each direction per leg",
      "Bodyweight squats, 15 reps, pause at the bottom on the last 3",
      "Glute bridges, 15 reps",
      "Walking knee hugs, 10 steps each leg",
      "Empty bar or light goblet squats, 2 sets of 8",
    ],
  },
  thu: {
    title: "Chest & Biceps Warm-Up",
    duration: "5-6 min",
    steps: [
      "Arm circles, 20 seconds each direction",
      "Light band curls or empty-bar curls, 15 reps",
      "Push-up to downward dog, 8 slow reps",
      "Wrist and forearm rotations, 15 seconds each way",
      "Light incline press with just the bar, 2 sets of 10",
    ],
  },
  fri: {
    title: "Thighs & Glutes Warm-Up",
    duration: "5-6 min",
    steps: [
      "Leg swings, 10 each direction per leg",
      "Walking lunges, no weight, 8 steps each leg",
      "Glute bridges, 15 reps",
      "Bodyweight Bulgarian split squat, 6 reps each leg",
      "Ankle bounces or light calf raises, 15 reps",
    ],
  },
};

const roundTo25 = (n) => Math.round(n / 2.5) * 2.5;

const mk = (id, name, sets, reps, note, query, increment = 2.5) => ({
  id,
  name,
  sets,
  reps,
  note,
  type: "strength",
  increment,
  video: `https://www.youtube.com/results?search_query=${encodeURIComponent(query || name + " proper form")}`,
});

const mkCardio = (id, name, note, query, target = "500m") => ({
  id,
  name,
  note,
  type: "cardio",
  target,
  video: `https://www.youtube.com/results?search_query=${encodeURIComponent(query || name + " technique")}`,
});

const CARDIO_NOTES = [
  "Baseline effort. Go hard but controlled and log your time, this is what you're chasing from here.",
  "Aim to match or shave a second or two off week 1.",
  "Push for a new best. Small chunks off your time count.",
  "Same again, keep hunting a faster split.",
  "Peak week, empty the tank on this one.",
  "Deload. Easy, steady pace, this isn't about time this week.",
];

function conditioning(weekIdx) {
  const note = CARDIO_NOTES[weekIdx];
  return [
    mkCardio("skierg_500", "SkiErg 500m", note, "skierg technique 500m", "500m"),
    mkCardio("row_500", "Row 500m", note, "rowing machine technique 500m Concept2", "500m"),
    mkCardio("battle_ropes", "Battle Ropes", note, "battle ropes technique intervals", "6 x 30 sec on / 30 sec off"),
    mkCardio("sled_push_pull", "Sled Push & Pull", note, "sled push pull technique HYROX", "20m push + 20m pull"),
    mkCardio("hyrox_lunge_carry", "Weighted Lunge Walk", note, "hyrox sandbag lunge technique", "100m"),
  ];
}

function buildPlan(weekIdx, benchBase, squatBase) {
  const benchNum = parseFloat(benchBase);
  const squatNum = parseFloat(squatBase);
  const bench = benchNum ? roundTo25(benchNum * BENCH_PCTS[weekIdx]) : null;
  const squat = squatNum ? roundTo25(squatNum * SQUAT_PCTS[weekIdx]) : null;
  const deload = weekIdx === 5;
  const benchNote = bench ? `Work up to ~${bench}kg` : "Set your bench baseline in Settings";
  const squatNote = squat ? `Work up to ~${squat}kg` : "Set your squat baseline in Settings";

  return {
    tue: [
      mk("bench", "Barbell Bench Press", 5, "5", benchNote, "barbell bench press technique Alan Thrall", 2.5),
      mk("incline_db", "Incline Dumbbell Press", 4, "8", deload ? "Moderate weight" : "Push for 2-3kg up on last set", "incline dumbbell press form Jeff Nippard", 2),
      mk("dips", "Weighted Dips", 3, "10", deload ? "Bodyweight only" : "Add weight belt if 10 is easy", "weighted dips proper form", 2.5),
      mk("push_press", "Double DB Push Press", 4, "6", "Base at 30kg per hand, drive from legs", "dumbbell push press technique", 2),
      mk("cable_fly", "Cable Fly", 3, "12", "Slow negative, squeeze at top", "cable fly form", 1),
      mk("hanging_leg_raise", "Hanging Leg Raise", 3, "15", "Control the swing", "hanging leg raise proper form", 1),
      mk("plank", "Plank", 3, "45 sec", "Brace, don't let hips sag", "plank correct form", 1),
      ...conditioning(weekIdx),
    ],
    wed: [
      mk("squat", "Back Squat", 5, "5", squatNote, "back squat technique Squat University", 2.5),
      mk("rdl", "Romanian Deadlift", 4, "8", "Feel it in the hamstrings, not the lower back", "romanian deadlift form", 2.5),
      mk("lunges", "Weighted Walking Lunges", 3, "12 per leg", "HYROX-relevant, keep torso upright and stride controlled rather than rushed", "walking lunges form", 1),
      mk("sled_push", "Weighted Sled Push", 4, "20m", "Low body angle, drive through the legs, this is the actual HYROX load, not a light warm-up", "sled push technique HYROX", 5),
      mk("hip_thrust", "Hip Thrust", 4, "10", "Full lockout, squeeze glutes hard", "barbell hip thrust technique", 2.5),
      mk("leg_press", "Leg Press", 3, "15", "Full range, don't lock knees out hard", "leg press proper form", 5),
      mk("woodchop", "Cable Woodchop", 3, "12 per side", "Rotate through the core, not just arms", "cable woodchop technique", 1),
      ...conditioning(weekIdx),
    ],
    thu: [
      mk("incline_bb", "Incline Barbell Press", 4, "8", "Moderate weight, focus on the squeeze", "incline barbell bench press form", 2.5),
      mk("db_bench", "Dumbbell Bench Press", 4, "10", "Full stretch at the bottom", "dumbbell bench press form", 2),
      mk("bb_curl", "Barbell Curl", 4, "10", "No swinging, control the eccentric", "barbell curl proper form", 1),
      mk("hammer_curl", "Hammer Curl", 3, "12", "Hits the brachialis, keep elbows pinned", "hammer curl form", 1),
      mk("cable_curl", "Cable Curl", 3, "15", "Constant tension, squeeze at top", "cable curl form", 1),
      mk("cable_crunch", "Cable Crunch", 3, "15", "Curl the spine, don't just bend at hips", "cable crunch proper form", 1),
      ...conditioning(weekIdx),
    ],
    fri: [
      mk("bulgarian_split_squat", "Bulgarian Split Squat", 4, "8 per leg", "Brutal but effective, go lighter than you think", "bulgarian split squat technique", 1),
      mk("hip_thrust_2", "Hip Thrust", 4, "12", "Higher reps than Wednesday, lighter load", "barbell hip thrust technique", 2.5),
      mk("leg_curl", "Leg Curl", 3, "12", "Slow and controlled", "seated leg curl form", 2),
      mk("leg_extension", "Leg Extension", 3, "15", "Pause at the top", "leg extension proper form", 2),
      mk("calf_raise", "Calf Raises", 3, "15", "Full stretch at bottom, pause at top", "standing calf raise form", 2.5),
      mk("bicycle_crunch", "Bicycle Crunch", 3, "20", "Slow, controlled rotation", "bicycle crunch proper form", 1),
      ...conditioning(weekIdx),
    ],
  };
}

const WEEK_NOTES = [
  "Technique week. Land on the working weights below and don't chase failure, get the movement patterns dialled in.",
  "Same weights as week 1, but push for cleaner reps and slightly better bar speed.",
  "Progression begins. Add load on the main lifts where form held last week.",
  "Keep pushing the main lifts. Accessories can creep up in weight if reps are easy.",
  "Peak week. This is the hardest week of the block, main lifts are at their heaviest.",
  "Deload. Same movements, lighter weight, fewer hard sets. Let the body recover before the next block.",
];

const BODY_FIELDS = [
  { key: "bodyweight", label: "Bodyweight", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "arm", label: "Arm (flexed)", unit: "cm" },
];

// post-workout meal per training day, aimed at recovery without blowing the daily calorie budget
const POST_WORKOUT = {
  tue: { meal: "Grilled chicken breast, sweet potato, steamed greens", kcal: 450, protein: "40g protein" },
  wed: { meal: "Baked salmon, brown rice, broccoli", kcal: 500, protein: "35g protein" },
  thu: { meal: "Greek yoghurt, berries, honey, scoop of protein powder", kcal: 350, protein: "35g protein" },
  fri: { meal: "Prawn stir-fry, quinoa, mixed vegetables", kcal: 470, protein: "38g protein" },
};

// one low-calorie dinner per day of the week, roughly 450-550kcal, designed to sit under a 2000kcal day
// alongside a breakfast and lunch you're already managing yourself
const DINNERS = [
  { day: "Monday", meal: "Baked cod, roasted vegetables, small portion new potatoes", kcal: 480 },
  { day: "Tuesday", meal: "Turkey chilli with cauliflower rice", kcal: 500 },
  { day: "Wednesday", meal: "Grilled chicken Caesar salad, light dressing", kcal: 450 },
  { day: "Thursday", meal: "Prawn and vegetable stir-fry, small portion noodles", kcal: 520 },
  { day: "Friday", meal: "Baked salmon, asparagus, quinoa", kcal: 540 },
  { day: "Saturday", meal: "Lean beef mince stuffed peppers", kcal: 500 },
  { day: "Sunday", meal: "Vegetable and chickpea curry, cauliflower rice", kcal: 480 },
];

const NUTRITION_CHECKS_KEY = "workout-nutrition-checks-v1";

// pre-written coaching notes, no live AI, just genuinely useful cues for the moment you finish a set
const COACH_TIPS = {
  bench: "Keep your feet planted and a slight arch in your back, drive the bar in a straight line, not a curve. If your shoulders ache more than your chest, your elbows are probably flaring too wide.",
  incline_db: "Set the bench to 30 degrees, any steeper and it turns into a shoulder press. Let the dumbbells come down to the sides of your chest, not your collarbone.",
  dips: "Lean forward slightly to keep this chest-dominant rather than triceps-dominant. Stop the descent when your shoulders dip below your elbows, going lower just strains the joint.",
  push_press: "Dip at the knees, not the hips, then drive up hard and punch the dumbbells overhead. If your lower back arches at the top, your core isn't bracing enough.",
  cable_fly: "Keep a soft bend in the elbows throughout, this is a hug motion, not a press. Squeeze and hold half a second at the point your hands meet.",
  hanging_leg_raise: "Curl your pelvis up rather than just swinging your legs, that's what actually works the abs. If you're swinging a lot, drop the reps and slow right down.",
  plank: "Squeeze your glutes and think about pulling your belly button to your spine. Hips sagging is the number one sign you're fatiguing, that's your cue to stop the set.",
  squat: "Break at the hips and knees together, chest stays tall. Push your knees out in the same direction as your toes, don't let them cave in on the way up.",
  rdl: "Soft knees, hinge at the hips and push them back like closing a car boot with your bum. The bar should stay close, almost brushing your legs, the whole way down.",
  lunges: "Front knee tracks over your foot, not past your toes. Most of the weight should stay in the front heel, not the back knee.",
  hip_thrust: "Bench should hit just below your shoulder blades. Drive through your heels and squeeze your glutes hard at the top, don't just extend your back.",
  hip_thrust_2: "Same setup as your heavier days, but focus on a slow controlled tempo since the weight's lighter here. Pause a full second at the top of every rep.",
  leg_press: "Feet roughly shoulder width, don't let your lower back round off the pad at the bottom, that's your depth limit for the day.",
  woodchop: "Rotate through your torso and hips together, keep your arms relatively straight, they're just transmitting the force, not generating it.",
  incline_bb: "Same bar path as flat bench, just angled, keep your wrists stacked directly over your elbows at the bottom.",
  db_bench: "Let the dumbbells travel slightly inward as you press, following a natural arc rather than straight up, that's easier on the shoulders.",
  bb_curl: "Elbows pinned to your sides the entire rep. If you're swinging your torso to finish a rep, the weight's too heavy.",
  hammer_curl: "Thumbs up throughout, this targets the forearm and the outer arm differently to a regular curl, don't twist into a normal curl halfway.",
  cable_curl: "The cable keeps tension on through the whole range, so don't rush the top, that's where most of the benefit is.",
  cable_crunch: "Move from your ribs, not your hips, kneel far enough back that you can round your spine properly into the crunch.",
  bulgarian_split_squat: "Back foot up on the bench, most of the work should be felt in the front leg. If your back knee is doing the work, your front foot's too close to the bench.",
  leg_curl: "Slow the lowering phase down deliberately, that's where hamstrings actually build most of their strength.",
  leg_extension: "Point your toes slightly up and pause at the top for a beat, don't let momentum carry the weight back down.",
  calf_raise: "Full stretch at the bottom, genuine pause at the top. Most people cut the range short and wonder why calves don't grow.",
  bicycle_crunch: "Slow and controlled beats fast and sloppy every time here, rotate your ribcage towards the opposite knee rather than just pulling with your neck.",
  skierg_500: "Drive with your legs first, then finish with your arms, not the other way round. Long powerful pulls beat short frantic ones.",
  row_500: "Legs, then hips, then arms on the drive, reverse it coming back. If your arms are burning out early, you're probably pulling too much with them too soon.",
  sled_push: "Low body angle, almost like pushing into a wall, short choppy steps drive more power than long strides. Keep your arms locked out, don't let the sled steer you.",
  battle_ropes: "Power comes from your legs and core, not just your arms, stay in a slight squat throughout. Big waves beat fast tiny ones for actual conditioning value.",
  sled_push_pull: "Same low angle and short steps on the push. On the pull, sit back like a reverse row and walk backwards under control, don't yank with your arms alone.",
  hyrox_lunge_carry: "Keep the load close to your body, controlled stride length, this is about pacing for distance, not rushing individual steps.",
};

// --- reporting helpers ---

// weekly total tonnage across all four training days, for the whole-block chart
function weeklyTonnageSeries(logsObj, benchBase, squatBase) {
  return Array.from({ length: 6 }, (_, w) => {
    const plan = buildPlan(w, benchBase, squatBase);
    let total = 0;
    DAYS.forEach((d) => {
      total += computeTonnage(logsObj, w, d.key, plan[d.key]);
    });
    return { week: `W${w + 1}`, tonnage: total };
  });
}

// top set weight per week for a given lift, e.g. bench on Tuesday
function weeklyTopLiftSeries(logsObj, dayKey, exerciseId, numSets) {
  return Array.from({ length: 6 }, (_, w) => ({
    week: `W${w + 1}`,
    weight: maxSetWeight(getSets(logsObj, w, dayKey, exerciseId, numSets)) || null,
  }));
}

// a body measurement across the six weeks, for charting
function bodyFieldSeries(bodyLogsObj, field) {
  return Array.from({ length: 6 }, (_, w) => {
    const wk = bodyLogsObj[`w${w + 1}`];
    const v = wk ? parseFloat(wk[field]) : null;
    return { week: `W${w + 1}`, value: v || null };
  });
}

// first logged value vs most recent logged value for a body measurement
function fieldTrend(bodyLogsObj, field) {
  let first = null;
  let last = null;
  for (let w = 1; w <= 6; w++) {
    const v = bodyLogsObj[`w${w}`] && parseFloat(bodyLogsObj[`w${w}`][field]);
    if (v) {
      if (first === null) first = v;
      last = v;
    }
  }
  if (first === null) return null;
  return { first, last, diff: +(last - first).toFixed(1) };
}

// counts every PR hit across the whole block, strength and cardio combined
function countBlockPRs(logsObj, benchBase, squatBase) {
  let count = 0;
  for (let w = 0; w < 6; w++) {
    const plan = buildPlan(w, benchBase, squatBase);
    DAYS.forEach((d) => {
      plan[d.key].forEach((ex) => {
        if (ex.type === "cardio") {
          if (isCardioPR(logsObj, w, d.key, ex.id)) count++;
        } else {
          if (isPR(logsObj, w, d.key, ex.id, ex.sets)) count++;
        }
      });
    });
  }
  return count;
}

function blockStats(logsObj, bodyLogsObj, benchBase, squatBase) {
  const tonnageSeries = weeklyTonnageSeries(logsObj, benchBase, squatBase);
  const totalTonnage = tonnageSeries.reduce((a, b) => a + (b.tonnage || 0), 0);
  const prCount = countBlockPRs(logsObj, benchBase, squatBase);
  const bw = fieldTrend(bodyLogsObj, "bodyweight");
  return { totalTonnage, prCount, bwChange: bw ? bw.diff : null };
}

// a discipline reminder for each training day, meant to be read before you touch a weight
const DAY_QUOTES = {
  tue: "Discipline is remembering what you want most, not what you want right now.",
  wed: "You don't have to feel like it. You just have to show up anyway.",
  thu: "Consistency is the only cheat code that's ever actually worked.",
  fri: "The rep you're tempted to skip is usually the one that changes you.",
};

// silly but roughly real-world reference points for the tonnage counter, ascending order
const TONNAGE_COMPARISONS = [
  { kg: 50, label: "a large dog" },
  { kg: 300, label: "a baby cow" },
  { kg: 500, label: "a grand piano" },
  { kg: 1000, label: "a small car" },
  { kg: 1500, label: "a great white shark" },
  { kg: 3000, label: "a hippo" },
  { kg: 6000, label: "an African elephant" },
  { kg: 12000, label: "a London double-decker bus" },
];

function tonnageComparison(kg) {
  if (kg <= 0) return { current: null, next: TONNAGE_COMPARISONS[0] };
  let current = null;
  let next = null;
  for (let i = 0; i < TONNAGE_COMPARISONS.length; i++) {
    if (TONNAGE_COMPARISONS[i].kg <= kg) {
      current = TONNAGE_COMPARISONS[i];
    } else {
      next = TONNAGE_COMPARISONS[i];
      break;
    }
  }
  return { current, next };
}

// total kg shifted today: sum of each individual set's own weight x reps, now that sets are logged separately
function computeTonnage(logs, weekIdx, dayKey, exercises) {
  let total = 0;
  exercises.forEach((ex) => {
    if (ex.type === "cardio") return;
    if (String(ex.reps).toLowerCase().includes("sec")) return; // planks etc, not a rep-based lift
    const sets = getSets(logs, weekIdx, dayKey, ex.id, ex.sets);
    sets.forEach((s) => {
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps) || parseInt(ex.reps) || 0;
      if (w && r) total += w * r;
    });
  });
  return Math.round(total);
}

const META_KEY = "workout-meta-v1";
const ARCHIVE_KEY = "workout-archive-v1";
const logsKeyForBlock = (blockNum) => `workout-logs-block-${blockNum}`;
const bodyKeyForBlock = (blockNum) => `workout-body-block-${blockNum}`;
const logKey = (week, day, exerciseId) => `w${week + 1}-${day}-${exerciseId}`;

// returns a fixed-length array of {weight, reps} for every set of an exercise, filling in blanks
function getSets(logs, weekIdx, dayKey, exerciseId, numSets) {
  const entry = logs[logKey(weekIdx, dayKey, exerciseId)];
  const sets = (entry && entry.sets) || [];
  return Array.from({ length: numSets }, (_, i) => sets[i] || { weight: "", reps: "" });
}

function maxSetWeight(sets) {
  let max = 0;
  sets.forEach((s) => {
    const w = parseFloat(s.weight);
    if (w && w > max) max = w;
  });
  return max || null;
}

function isPR(logs, weekIdx, dayKey, exerciseId, numSets) {
  const currentMax = maxSetWeight(getSets(logs, weekIdx, dayKey, exerciseId, numSets));
  if (!currentMax) return false;
  for (let w = 0; w < 6; w++) {
    if (w === weekIdx) continue;
    const otherMax = maxSetWeight(getSets(logs, w, dayKey, exerciseId, numSets));
    if (otherMax && otherMax >= currentMax) return false;
  }
  return true;
}

// "mm:ss" or "ss" -> total seconds, null if not parseable
function timeToSeconds(str) {
  if (!str) return null;
  const parts = String(str).split(":").map((p) => parseFloat(p));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

// for cardio, a PR is a faster (lower) time than every other week logged
function isCardioPR(logs, weekIdx, dayKey, exerciseId) {
  const current = logs[logKey(weekIdx, dayKey, exerciseId)];
  const currentSecs = timeToSeconds(current && current.time);
  if (currentSecs === null) return false;
  for (let w = 0; w < 6; w++) {
    if (w === weekIdx) continue;
    const l = logs[logKey(w, dayKey, exerciseId)];
    const otherSecs = timeToSeconds(l && l.time);
    if (otherSecs !== null && otherSecs <= currentSecs) return false;
  }
  return true;
}

// looks back through previous weeks for the heaviest set logged on this exercise, and suggests the next jump
// deload weeks suggest a drop instead of a rise
function suggestedWeight(logs, weekIdx, dayKey, exerciseId, numSets, increment, isDeload) {
  for (let w = weekIdx - 1; w >= 0; w--) {
    const prevMax = maxSetWeight(getSets(logs, w, dayKey, exerciseId, numSets));
    if (prevMax) {
      const suggested = isDeload ? roundTo25(prevMax * 0.85) : roundTo25(prevMax + increment);
      return { suggested, prevWeight: prevMax, prevWeek: w + 1 };
    }
  }
  return null;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function weekFromDate(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 0;
  return Math.min(5, Math.floor(diffDays / 7));
}

// maps today's real weekday onto the plan, returns null on a rest day (Mon, Sat, Sun)
function todaysDayKey() {
  const map = { 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
  return map[new Date().getDay()] || null;
}

const DEFAULT_META = { blockNum: 1, startDate: todayStr(), benchBase: "", squatBase: "" };

// ---------- DESIGN TOKENS ----------
// Black, teal and white. One accent (teal) used only for calls to action, PRs and the timer.
const C = {
  page: "#F4F3EF",
  card: "#FFFFFF",
  ink: "#111111",
  sub: "#5C5C5C",
  note: "#7A7A7A",
  line: "#111111",
  accent: "#0E6E67",
  good: "#3FAFA3",
};

function SplashScreen({ dayKey, onEnter }) {
  const dayInfo = DAYS.find((d) => d.key === dayKey);
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: C.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
      <Dumbbell size={40} color={C.accent} strokeWidth={2.5} />
      <h1 className="mt-4 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: "0.03em" }}>
        READY TO TRAIN?
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#BFBFBF", fontFamily: "'Inter', sans-serif" }}>
        {dayInfo ? `Today is ${dayInfo.label}, time for ${dayInfo.focus}.` : "Today's a rest day, recovery is training too."}
      </p>
      <button
        onClick={onEnter}
        className="mt-8 px-8 py-3 rounded-full font-bold text-sm"
        style={{ backgroundColor: C.accent, color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
      >
        {dayInfo ? "Let's go" : "Open tracker"}
      </button>
    </div>
  );
}

export default function WorkoutTracker() {
  const [meta, setMeta] = useState(DEFAULT_META);
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayKey, setDayKey] = useState("tue");
  const [logs, setLogs] = useState({});
  const [bodyLogs, setBodyLogs] = useState({});
  const [archive, setArchive] = useState([]);
  const [nutritionChecks, setNutritionChecks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(null);
  const [activeTip, setActiveTip] = useState(null);
  const [warmupOpen, setWarmupOpen] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState("workout");
  const [restSeconds, setRestSeconds] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) return;
    const id = setInterval(() => setRestSeconds((s) => (s === null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(id);
  }, [restSeconds]);

  useEffect(() => {
    (async () => {
      let loadedMeta = DEFAULT_META;
      try {
        const res = await storage.get(META_KEY);
        if (res && res.value) loadedMeta = JSON.parse(res.value);
      } catch (e) {}
      setMeta(loadedMeta);
      setWeekIdx(weekFromDate(loadedMeta.startDate));
      const todayKey = todaysDayKey();
      if (todayKey) setDayKey(todayKey);

      try {
        const res = await storage.get(logsKeyForBlock(loadedMeta.blockNum));
        if (res && res.value) setLogs(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(bodyKeyForBlock(loadedMeta.blockNum));
        if (res && res.value) setBodyLogs(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(ARCHIVE_KEY);
        if (res && res.value) setArchive(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(NUTRITION_CHECKS_KEY);
        if (res && res.value) setNutritionChecks(JSON.parse(res.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const persistMeta = useCallback(async (next) => {
    setMeta(next);
    try {
      await storage.set(META_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Could not save settings", e);
    }
  }, []);

  const persist = useCallback(
    async (next) => {
      setLogs(next);
      try {
        await storage.set(logsKeyForBlock(meta.blockNum), JSON.stringify(next));
      } catch (e) {
        console.error("Could not save", e);
      }
    },
    [meta.blockNum]
  );

  const persistBody = useCallback(
    async (next) => {
      setBodyLogs(next);
      try {
        await storage.set(bodyKeyForBlock(meta.blockNum), JSON.stringify(next));
      } catch (e) {
        console.error("Could not save", e);
      }
    },
    [meta.blockNum]
  );

  const persistNutrition = useCallback(async (next) => {
    setNutritionChecks(next);
    try {
      await storage.set(NUTRITION_CHECKS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Could not save", e);
    }
  }, []);

  const startNewBlock = async (newStartDate, newBenchBase, newSquatBase) => {
    const nextArchive = [
      ...archive,
      { blockNum: meta.blockNum, startDate: meta.startDate, benchBase: meta.benchBase, squatBase: meta.squatBase, logs, bodyLogs },
    ];
    setArchive(nextArchive);
    try {
      await storage.set(ARCHIVE_KEY, JSON.stringify(nextArchive));
    } catch (e) {
      console.error("Could not archive block", e);
    }
    const newMeta = { blockNum: meta.blockNum + 1, startDate: newStartDate, benchBase: newBenchBase, squatBase: newSquatBase };
    await persistMeta(newMeta);
    setLogs({});
    setBodyLogs({});
    setWeekIdx(weekFromDate(newStartDate));
    setView("workout");
  };

  // bundles everything into one file so it can be moved to a new phone, or handed to Claude
  // to help plan the next block based on what actually happened in this one
  const exportAllData = () => {
    const payload = { meta, logs, bodyLogs, archive, nutritionChecks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-tracker-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importAllData = async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed.meta) throw new Error("That doesn't look like a workout tracker backup file.");
    setMeta(parsed.meta);
    setLogs(parsed.logs || {});
    setBodyLogs(parsed.bodyLogs || {});
    setArchive(parsed.archive || []);
    setNutritionChecks(parsed.nutritionChecks || {});
    setWeekIdx(weekFromDate(parsed.meta.startDate));
    await storage.set(META_KEY, JSON.stringify(parsed.meta));
    await storage.set(logsKeyForBlock(parsed.meta.blockNum), JSON.stringify(parsed.logs || {}));
    await storage.set(bodyKeyForBlock(parsed.meta.blockNum), JSON.stringify(parsed.bodyLogs || {}));
    await storage.set(ARCHIVE_KEY, JSON.stringify(parsed.archive || []));
    await storage.set(NUTRITION_CHECKS_KEY, JSON.stringify(parsed.nutritionChecks || {}));
  };

  const plan = useMemo(() => buildPlan(weekIdx, meta.benchBase, meta.squatBase), [weekIdx, meta.benchBase, meta.squatBase]);
  const exercises = plan[dayKey];
  const day = DAYS.find((d) => d.key === dayKey);

  const updateLog = (exerciseId, field, value) => {
    const key = logKey(weekIdx, dayKey, exerciseId);
    const existing = logs[key] || {};
    setLogs({ ...logs, [key]: { ...existing, [field]: value } });
  };

  const updateSetLog = (exerciseId, setIdx, field, value, numSets) => {
    const key = logKey(weekIdx, dayKey, exerciseId);
    const existing = logs[key] || {};
    const existingSets = existing.sets || [];
    const newSets = Array.from({ length: numSets }, (_, i) =>
      i === setIdx ? { ...(existingSets[i] || { weight: "", reps: "" }), [field]: value } : existingSets[i] || { weight: "", reps: "" }
    );
    setLogs({ ...logs, [key]: { ...existing, sets: newSets } });
  };

  const saveEntry = (exerciseId) => {
    persist(logs);
    setSavedFlash(exerciseId);
    setTimeout(() => setSavedFlash(null), 1200);
    if (COACH_TIPS[exerciseId]) setActiveTip(exerciseId);
  };

  const completedCount = exercises.filter((ex) => {
    if (ex.type === "cardio") {
      const l = logs[logKey(weekIdx, dayKey, ex.id)];
      return !!(l && l.time);
    }
    return !!maxSetWeight(getSets(logs, weekIdx, dayKey, ex.id, ex.sets));
  }).length;

  const isBlockFinished = weekFromDate(meta.startDate) >= 5 && weekIdx === 5;
  const pct = Math.round((completedCount / exercises.length) * 100);
  const tonnage = useMemo(() => computeTonnage(logs, weekIdx, dayKey, exercises), [logs, weekIdx, dayKey, exercises]);
  const tonnageInfo = tonnageComparison(tonnage);

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: C.page, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {showSplash && (
        <SplashScreen
          dayKey={todaysDayKey()}
          onEnter={() => setShowSplash(false)}
        />
      )}

      {/* Masthead */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: C.ink }}>
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={22} color="#FFFFFF" strokeWidth={2.5} />
              <h1 className="font-display text-3xl text-white">BLOCK {meta.blockNum}</h1>
            </div>
            <button onClick={() => setView("settings")} className="p-2 rounded-full" style={{ backgroundColor: "#2A2A2A" }} aria-label="Settings">
              <Settings size={18} color={view === "settings" ? C.accent : "#FFFFFF"} />
            </button>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#BFBFBF" }}>
            Chest · Biceps · Abs · Thighs & Glutes, self-run
          </p>

          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              ["workout", "Workout"],
              ["history", "History"],
              ["body", "Body"],
              ["nutrition", "Nutrition"],
              ["report", "Report"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition"
                style={
                  view === key
                    ? { backgroundColor: C.accent, color: "#FFFFFF" }
                    : { backgroundColor: "#2A2A2A", color: "#D9D9D9" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "workout" && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setWeekIdx((w) => Math.max(0, w - 1))}
              disabled={weekIdx === 0}
              className="p-2 rounded-full disabled:opacity-30"
              style={{ backgroundColor: C.ink }}
              aria-label="Previous week"
            >
              <ChevronLeft size={20} color="#FFFFFF" />
            </button>
            <div className="text-center">
              <div className="font-display text-5xl leading-none" style={{ color: C.ink }}>
                WEEK {weekIdx + 1}
              </div>
              {weekIdx === weekFromDate(meta.startDate) && (
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold mt-1" style={{ color: C.sub }}>
                  <CalendarDays size={11} /> TODAY'S WEEK
                </div>
              )}
              {weekIdx === 4 && (
                <div className="flex items-center justify-center gap-1 text-xs font-bold mt-1" style={{ color: C.accent }}>
                  <Flame size={12} /> PEAK WEEK
                </div>
              )}
              {weekIdx === 5 && (
                <div className="text-xs font-bold mt-1" style={{ color: C.sub }}>
                  DELOAD
                </div>
              )}
            </div>
            <button
              onClick={() => setWeekIdx((w) => Math.min(5, w + 1))}
              disabled={weekIdx === 5}
              className="p-2 rounded-full disabled:opacity-30"
              style={{ backgroundColor: C.ink }}
              aria-label="Next week"
            >
              <ChevronRight size={20} color="#FFFFFF" />
            </button>
          </div>
          <p className="text-sm text-center mt-2 px-4" style={{ color: C.sub }}>
            {WEEK_NOTES[weekIdx]}
          </p>

          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: C.ink }}>
            <p className="font-display text-2xl leading-snug text-white text-center">"{DAY_QUOTES[dayKey]}"</p>
          </div>

          {isBlockFinished && (
            <div className="mt-4 rounded-xl p-3 text-center" style={{ backgroundColor: C.ink }}>
              <p className="text-sm text-white font-semibold">This block is done. Nice work.</p>
              <div className="flex gap-2 justify-center mt-2">
                <button
                  onClick={() => setView("report")}
                  className="text-sm font-bold rounded-lg px-4 py-1.5"
                  style={{ backgroundColor: "#FFFFFF", color: C.ink }}
                >
                  See your report
                </button>
                <button
                  onClick={() => setView("settings")}
                  className="text-sm font-bold rounded-lg px-4 py-1.5"
                  style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
                >
                  Start block {meta.blockNum + 1}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 mt-5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDayKey(d.key)}
                className="py-2 rounded-lg text-sm font-bold border-2 transition"
                style={
                  dayKey === d.key
                    ? { backgroundColor: C.ink, color: "#FFFFFF", borderColor: C.ink }
                    : { backgroundColor: C.card, color: C.ink, borderColor: "#DDDBD5" }
                }
              >
                {d.short}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="font-display text-2xl" style={{ color: C.ink }}>
              {day.focus.toUpperCase()}
            </h2>
            <span className="text-xs font-bold" style={{ color: C.sub }}>
              {completedCount}/{exercises.length} logged
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: "#E4E2DB" }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.accent }} />
          </div>

          {WARMUPS[dayKey] && (
            <div className="mt-4 rounded-xl border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <button
                onClick={() => setWarmupOpen((o) => !o)}
                className="w-full flex items-center justify-between p-3"
              >
                <span className="text-sm font-bold flex items-center gap-2" style={{ color: C.ink }}>
                  <Timer size={16} style={{ color: C.accent }} />
                  {WARMUPS[dayKey].title} · {WARMUPS[dayKey].duration}
                </span>
                <span className="text-xs font-bold" style={{ color: C.accent }}>
                  {warmupOpen ? "hide" : "show"}
                </span>
              </button>
              {warmupOpen && (
                <ol className="px-4 pb-4 space-y-1.5">
                  {WARMUPS[dayKey].steps.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: C.sub }}>
                      <span className="font-bold shrink-0" style={{ color: C.ink }}>
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {exercises.map((ex) => {
              const key = logKey(weekIdx, dayKey, ex.id);
              const entry = logs[key] || {};
              const isSaved = savedFlash === ex.id;
              const pr = ex.type === "cardio" ? isCardioPR(logs, weekIdx, dayKey, ex.id) : isPR(logs, weekIdx, dayKey, ex.id, ex.sets);
              const suggestion =
                ex.type === "cardio" ? null : suggestedWeight(logs, weekIdx, dayKey, ex.id, ex.sets, ex.increment || 2.5, weekIdx === 5);
              const noteToShow = suggestion
                ? weekIdx === 5
                  ? `Deload to ~${suggestion.suggested}kg, down from ${suggestion.prevWeight}kg in week ${suggestion.prevWeek}`
                  : `Aim for ~${suggestion.suggested}kg, up from ${suggestion.prevWeight}kg in week ${suggestion.prevWeek}`
                : ex.note;
              const setRows = ex.type === "cardio" ? [] : getSets(logs, weekIdx, dayKey, ex.id, ex.sets);
              return (
                <div key={ex.id} className="rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg leading-tight" style={{ color: C.ink }}>
                          {ex.name}
                        </h3>
                        {pr && (
                          <span
                            className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
                          >
                            <Flame size={10} /> PR
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.sub }}>
                        {ex.type === "cardio" ? ex.target : `${ex.sets} sets × ${ex.reps} reps`}
                      </p>
                      <p className="text-sm mt-1 italic" style={{ color: C.note }}>
                        {noteToShow}
                      </p>
                    </div>
                    <a
                      href={ex.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 shrink-0"
                      style={{ color: C.ink }}
                    >
                      <Video size={20} />
                      <span className="text-[10px] font-bold">form</span>
                    </a>
                    {COACH_TIPS[ex.id] && (
                      <button
                        onClick={() => setActiveTip(activeTip === ex.id ? null : ex.id)}
                        className="flex flex-col items-center gap-0.5 shrink-0"
                        style={{ color: activeTip === ex.id ? C.accent : C.ink }}
                      >
                        <MessageCircle size={20} />
                        <span className="text-[10px] font-bold">coach</span>
                      </button>
                    )}
                  </div>

                  {activeTip === ex.id && COACH_TIPS[ex.id] && (
                    <div className="mt-3 rounded-lg p-3 border-2 flex items-start gap-2" style={{ backgroundColor: "#EAF5F4", borderColor: C.accent }}>
                      <MessageCircle size={16} className="shrink-0 mt-0.5" style={{ color: C.accent }} />
                      <p className="text-sm flex-1" style={{ color: C.ink }}>
                        {COACH_TIPS[ex.id]}
                      </p>
                      <button onClick={() => setActiveTip(null)} className="shrink-0" style={{ color: C.sub }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {ex.type === "cardio" ? (
                    <div className="flex items-end gap-2 mt-3">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                          Time (mm:ss)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={entry.time || ""}
                          onChange={(e) => updateLog(ex.id, "time", e.target.value)}
                          placeholder="1:45"
                          className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
                          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                        />
                      </div>
                      <button
                        onClick={() => saveEntry(ex.id)}
                        className="h-[38px] px-3 rounded-lg font-bold text-sm flex items-center gap-1 transition"
                        style={isSaved ? { backgroundColor: C.good, color: "#FFFFFF" } : { backgroundColor: C.ink, color: "#FFFFFF" }}
                      >
                        <Check size={16} />
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {setRows.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold w-10 shrink-0" style={{ color: C.sub }}>
                            Set {i + 1}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => updateSetLog(ex.id, i, "weight", e.target.value, ex.sets)}
                            placeholder="kg"
                            className="w-20 rounded-lg px-2 py-2 outline-none text-sm border-2 font-semibold text-center"
                            style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                          />
                          <input
                            type="text"
                            value={s.reps}
                            onChange={(e) => updateSetLog(ex.id, i, "reps", e.target.value, ex.sets)}
                            placeholder={ex.reps}
                            className="w-16 rounded-lg px-2 py-2 outline-none text-sm border-2 font-semibold text-center"
                            style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => saveEntry(ex.id)}
                        className="w-full h-[38px] px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition"
                        style={isSaved ? { backgroundColor: C.good, color: "#FFFFFF" } : { backgroundColor: C.ink, color: "#FFFFFF" }}
                      >
                        <Check size={16} />
                        {isSaved ? "Saved" : "Save all sets"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {tonnage > 0 && (
            <div className="mt-4 rounded-xl p-4 border-2 text-center" style={{ backgroundColor: C.card, borderColor: C.accent }}>
              <p className="text-xs uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                Today's tonnage
              </p>
              <p className="font-display text-4xl mt-1" style={{ color: C.accent }}>
                {tonnage.toLocaleString()} kg
              </p>
              {tonnageInfo.current && (
                <p className="text-sm mt-1" style={{ color: C.ink }}>
                  That's heavier than {tonnageInfo.current.label}
                  {tonnageInfo.next && (
                    <>
                      , {(tonnageInfo.next.kg - tonnage).toLocaleString()}kg off matching {tonnageInfo.next.label}
                    </>
                  )}
                  .
                </p>
              )}
              {!tonnageInfo.current && tonnageInfo.next && (
                <p className="text-sm mt-1" style={{ color: C.ink }}>
                  {(tonnageInfo.next.kg - tonnage).toLocaleString()}kg off matching {tonnageInfo.next.label}.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {view === "history" && <HistoryView logs={logs} onReset={() => persist({})} />}
      {view === "body" && <BodyView bodyLogs={bodyLogs} weekIdx={weekIdx} setWeekIdx={setWeekIdx} onSave={persistBody} />}
      {view === "nutrition" && <NutritionView checks={nutritionChecks} onSave={persistNutrition} />}
      {view === "report" && <ReportView logs={logs} bodyLogs={bodyLogs} meta={meta} archive={archive} />}
      {view === "settings" && (
        <SettingsView
          meta={meta}
          archive={archive}
          onStartNewBlock={startNewBlock}
          onUpdateMeta={persistMeta}
          onExport={exportAllData}
          onImport={importAllData}
        />
      )}

      {/* Floating rest timer */}
      <div className="fixed bottom-4 right-4 z-20">
        {timerOpen && (
          <div className="rounded-xl p-4 mb-2 w-48 shadow-xl border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            {restSeconds !== null ? (
              <div className="text-center">
                <div className="font-display text-5xl" style={{ color: restSeconds === 0 ? C.good : C.accent }}>
                  {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, "0")}
                </div>
                <p className="text-xs mt-1 font-semibold" style={{ color: C.sub }}>
                  {restSeconds === 0 ? "Rest's up" : "resting"}
                </p>
                <button
                  onClick={() => setRestSeconds(null)}
                  className="mt-2 text-xs font-bold rounded-lg px-3 py-1"
                  style={{ backgroundColor: "#EFEDE7", color: C.ink }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-wide font-bold mb-2 text-center" style={{ color: C.sub }}>
                  Rest timer
                </p>
                <div className="flex gap-1.5 justify-center">
                  {[60, 90, 120].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRestSeconds(s)}
                      className="font-bold text-sm rounded-lg px-2.5 py-1.5"
                      style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setTimerOpen((o) => !o)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg font-display text-lg"
          style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
        >
          {restSeconds !== null ? `${restSeconds}` : <Timer size={22} />}
        </button>
      </div>
    </div>
  );
}

function SettingsView({ meta, archive, onStartNewBlock, onUpdateMeta, onExport, onImport }) {
  const [startDate, setStartDate] = useState(meta.startDate);
  const [benchBase, setBenchBase] = useState(meta.benchBase);
  const [squatBase, setSquatBase] = useState(meta.squatBase);
  const [confirmingNewBlock, setConfirmingNewBlock] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const currentWeek = weekFromDate(startDate);

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await onImport(file);
      setImportStatus("Backup restored.");
    } catch (err) {
      setImportStatus("That file couldn't be read, check it's the right backup file.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: C.ink }}>
        <Settings size={18} /> SETTINGS
      </h2>

      <div className="rounded-xl p-4 border-2 mt-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
          Block {meta.blockNum} start date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
        />
        <p className="text-sm mt-2" style={{ color: C.sub }}>
          Based on this date, you're currently in Week {currentWeek + 1}.
        </p>
        <button
          onClick={() => onUpdateMeta({ ...meta, startDate })}
          className="mt-3 text-sm font-bold rounded-lg px-4 py-1.5"
          style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
        >
          Save date
        </button>
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.ink }}>
          Current baseline lifts
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Bench (kg)
            </label>
            <input
              type="number"
              value={benchBase}
              onChange={(e) => setBenchBase(e.target.value)}
              placeholder="e.g. 80"
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Squat (kg)
            </label>
            <input
              type="number"
              value={squatBase}
              onChange={(e) => setSquatBase(e.target.value)}
              placeholder="e.g. 100"
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
        </div>
        <button
          onClick={() => onUpdateMeta({ ...meta, benchBase: parseFloat(benchBase), squatBase: parseFloat(squatBase) })}
          className="mt-3 text-sm font-bold rounded-lg px-4 py-1.5"
          style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
        >
          Save baselines
        </button>
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.accent }}>
        <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>
          Start a new six week block
        </p>
        <p className="text-sm mb-3" style={{ color: C.sub }}>
          This archives block {meta.blockNum}'s logs (you won't lose them) and opens a fresh six weeks starting from a new
          date, with new baseline lifts based on wherever you've ended up.
        </p>
        {!confirmingNewBlock ? (
          <button
            onClick={() => setConfirmingNewBlock(true)}
            className="text-sm font-bold rounded-lg px-4 py-1.5"
            style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
          >
            Start block {meta.blockNum + 1}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: C.ink }}>
              New block starts <strong>{startDate}</strong> with bench base <strong>{benchBase}kg</strong> and squat base{" "}
              <strong>{squatBase}kg</strong>. Update the fields above first if these have changed, then confirm.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onStartNewBlock(startDate, parseFloat(benchBase), parseFloat(squatBase));
                  setConfirmingNewBlock(false);
                }}
                className="text-sm font-bold rounded-lg px-4 py-1.5"
                style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
              >
                Confirm, start new block
              </button>
              <button onClick={() => setConfirmingNewBlock(false)} className="text-sm px-2" style={{ color: C.sub }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>
          Backup & Restore
        </p>
        <p className="text-sm mb-3" style={{ color: C.sub }}>
          Export everything to move to a new phone, or to send to Claude at the end of a block.
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={onExport} className="text-sm font-bold rounded-lg px-4 py-1.5" style={{ backgroundColor: C.ink, color: "#FFFFFF" }}>
            Export backup
          </button>
          <label className="text-sm font-bold rounded-lg px-4 py-1.5 cursor-pointer" style={{ backgroundColor: C.accent, color: "#FFFFFF" }}>
            Import backup
            <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
        {importStatus && (
          <p className="text-sm mt-2" style={{ color: C.sub }}>
            {importStatus}
          </p>
        )}
      </div>

      {archive.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: C.sub }}>
            Past blocks
          </p>
          {archive.map((a) => (
            <div key={a.blockNum} className="text-sm py-1 border-t" style={{ color: C.sub, borderColor: "#DDDBD5" }}>
              Block {a.blockNum}, started {a.startDate}, bench base {a.benchBase}kg, squat base {a.squatBase}kg
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl p-3 border-2 text-center" style={{ backgroundColor: C.card, borderColor: C.line }}>
      <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
        {label}
      </p>
      <p className="font-display text-3xl mt-1" style={{ color: C.ink }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: C.note }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ReportView({ logs, bodyLogs, meta, archive }) {
  const tonnageSeries = useMemo(() => weeklyTonnageSeries(logs, meta.benchBase, meta.squatBase), [logs, meta.benchBase, meta.squatBase]);
  const benchSeries = useMemo(() => weeklyTopLiftSeries(logs, "tue", "bench", 5), [logs]);
  const squatSeries = useMemo(() => weeklyTopLiftSeries(logs, "wed", "squat", 5), [logs]);
  const bwSeries = useMemo(() => bodyFieldSeries(bodyLogs, "bodyweight"), [bodyLogs]);
  const waistSeries = useMemo(() => bodyFieldSeries(bodyLogs, "waist"), [bodyLogs]);
  const bwTrend = fieldTrend(bodyLogs, "bodyweight");
  const waistTrend = fieldTrend(bodyLogs, "waist");
  const totalTonnage = tonnageSeries.reduce((a, b) => a + (b.tonnage || 0), 0);
  const prCount = countBlockPRs(logs, meta.benchBase, meta.squatBase);

  const liftChartData = benchSeries.map((b, i) => ({ week: b.week, bench: b.weight, squat: squatSeries[i].weight }));
  const bodyChartData = bwSeries.map((b, i) => ({ week: b.week, bodyweight: b.value, waist: waistSeries[i].value }));

  const allBlocks = [
    ...archive.map((a) => ({ blockNum: a.blockNum, ...blockStats(a.logs, a.bodyLogs, a.benchBase, a.squatBase) })),
    { blockNum: meta.blockNum, ...blockStats(logs, bodyLogs, meta.benchBase, meta.squatBase), current: true },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-8">
      <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: C.ink }}>
        <BarChart3 size={18} /> BLOCK {meta.blockNum} REPORT
      </h2>
      <p className="text-sm mt-1 mb-4" style={{ color: C.sub }}>
        A rolling summary of what this block has actually done, updated as you log.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Bodyweight"
          value={bwTrend ? `${bwTrend.diff > 0 ? "+" : ""}${bwTrend.diff}kg` : "—"}
          sub={bwTrend ? `${bwTrend.first}kg → ${bwTrend.last}kg` : "Log your weight to see this"}
        />
        <StatCard
          label="Waist"
          value={waistTrend ? `${waistTrend.diff > 0 ? "+" : ""}${waistTrend.diff}cm` : "—"}
          sub={waistTrend ? `${waistTrend.first}cm → ${waistTrend.last}cm` : "Log your waist to see this"}
        />
        <StatCard label="Total tonnage" value={`${totalTonnage.toLocaleString()}kg`} sub="Moved so far this block" />
        <StatCard label="PRs hit" value={prCount} sub="Across every lift this block" />
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        STRENGTH PROGRESSION
      </h3>
      <p className="text-xs mb-2" style={{ color: C.sub }}>
        Top set each week, bench and squat.
      </p>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={liftChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="bench" stroke={C.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            <Line type="monotone" dataKey="squat" stroke={C.ink} strokeWidth={2} connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        BODY MEASUREMENTS
      </h3>
      <p className="text-xs mb-2" style={{ color: C.sub }}>
        Bodyweight and waist across the block.
      </p>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={bodyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="bodyweight" stroke={C.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            <Line type="monotone" dataKey="waist" stroke={C.ink} strokeWidth={2} connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        WEEKLY TONNAGE
      </h3>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tonnageSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Bar dataKey="tonnage" fill={C.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {allBlocks.length > 1 && (
        <>
          <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
            BLOCK BY BLOCK
          </h3>
          <p className="text-xs mb-2" style={{ color: C.sub }}>
            Total tonnage across every block you've run, current one included.
          </p>
          <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={allBlocks.map((b) => ({ name: `Block ${b.blockNum}`, tonnage: b.totalTonnage }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E4E2DB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip />
                <Bar dataKey="tonnage" fill={C.ink} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {allBlocks.map((b) => (
              <div key={b.blockNum} className="text-xs flex justify-between" style={{ color: C.sub }}>
                <span>
                  Block {b.blockNum}
                  {b.current ? " (current)" : ""}
                </span>
                <span>
                  {b.prCount} PRs, {b.bwChange !== null ? `${b.bwChange > 0 ? "+" : ""}${b.bwChange}kg bodyweight` : "no bodyweight logged"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-sm mt-6 text-center" style={{ color: C.note }}>
        This report updates live as you log. When you start a new block, it archives here and a fresh report begins.
      </p>
    </div>
  );
}

function NutritionView({ checks, onSave }) {
  const toggleDinner = (day) => {
    onSave({ ...checks, [day]: !checks[day] });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-6">
      <h2 className="font-display text-2xl" style={{ color: C.ink }}>
        POST-WORKOUT FUEL
      </h2>
      <p className="text-sm mt-1 mb-3" style={{ color: C.sub }}>
        Eat within 60 to 90 minutes of training to help recovery, without wrecking the day's calorie budget.
      </p>
      <div className="space-y-3">
        {DAYS.map((d) => {
          const meal = POST_WORKOUT[d.key];
          return (
            <div key={d.key} className="rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm" style={{ color: C.ink }}>
                  {d.label}
                </p>
                <span className="text-xs font-bold" style={{ color: C.accent }}>
                  ~{meal.kcal} kcal
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: C.ink }}>
                {meal.meal}
              </p>
              <p className="text-xs mt-1" style={{ color: C.sub }}>
                {meal.protein}
              </p>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-2xl mt-7" style={{ color: C.ink }}>
        LOW-CALORIE DINNERS
      </h2>
      <p className="text-sm mt-1 mb-3" style={{ color: C.sub }}>
        One dinner per day, roughly 450 to 550 kcal, leaving room for the breakfast and lunch you've already got sorted.
        Tick off as you go.
      </p>
      <div className="space-y-3">
        {DINNERS.map((d) => {
          const done = !!checks[d.day];
          return (
            <button
              key={d.day}
              onClick={() => toggleDinner(d.day)}
              className="w-full text-left rounded-xl p-4 border-2 flex items-start justify-between gap-3 transition"
              style={{
                backgroundColor: done ? C.ink : C.card,
                borderColor: C.line,
              }}
            >
              <div>
                <p className="font-bold text-sm" style={{ color: done ? "#FFFFFF" : C.ink }}>
                  {d.day}
                </p>
                <p className="text-sm mt-1" style={{ color: done ? "#D9D9D9" : C.ink }}>
                  {d.meal}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs font-bold" style={{ color: done ? "#FFFFFF" : C.accent }}>
                  ~{d.kcal} kcal
                </span>
                <span
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: done ? "#FFFFFF" : C.line, backgroundColor: done ? C.accent : "transparent" }}
                >
                  {done && <Check size={14} color="#FFFFFF" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-sm mt-4 text-center" style={{ color: C.note }}>
        These are a starting point, swap ingredients for whatever you like as long as you're in a similar ballpark.
      </p>
    </div>
  );
}

function BodyView({ bodyLogs, weekIdx, setWeekIdx, onSave }) {
  const weekData = bodyLogs[`w${weekIdx + 1}`] || {};

  const updateField = (field, value) => {
    onSave({ ...bodyLogs, [`w${weekIdx + 1}`]: { ...weekData, [field]: value } });
  };

  const startVal = (field) => {
    const w1 = bodyLogs["w1"];
    return w1 ? w1[field] : null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekIdx((w) => Math.max(0, w - 1))}
          disabled={weekIdx === 0}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ backgroundColor: C.ink }}
          aria-label="Previous week"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </button>
        <div className="font-display text-4xl leading-none" style={{ color: C.ink }}>
          WEEK {weekIdx + 1}
        </div>
        <button
          onClick={() => setWeekIdx((w) => Math.min(5, w + 1))}
          disabled={weekIdx === 5}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ backgroundColor: C.ink }}
          aria-label="Next week"
        >
          <ChevronRight size={20} color="#FFFFFF" />
        </button>
      </div>
      <p className="text-sm text-center mt-2" style={{ color: C.sub }}>
        Log this once a week, same day and time if you can (first thing in the morning is most consistent).
      </p>

      <div className="mt-5 space-y-3">
        {BODY_FIELDS.map((f) => {
          const val = weekData[f.key] || "";
          const start = startVal(f.key);
          const diff = start && val ? (parseFloat(val) - parseFloat(start)).toFixed(1) : null;
          return (
            <div key={f.key} className="rounded-xl p-4 border-2 flex items-center gap-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                  {f.label} ({f.unit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={val}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder="0"
                  className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
                  style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                />
              </div>
              {diff !== null && weekIdx > 0 && (
                <div className="text-xs font-bold shrink-0" style={{ color: diff.startsWith("-") ? C.good : diff === "0.0" ? C.sub : C.accent }}>
                  {diff > 0 ? `+${diff}` : diff} vs W1
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm mt-4 text-center pb-6" style={{ color: C.note }}>
        These numbers move slower than the weights on the bar. Don't read too much into week to week noise, look at the
        trend across all six weeks.
      </p>
    </div>
  );
}

function HistoryView({ logs, onReset }) {
  const allDays = buildPlan(0, 100, 120);
  const [confirmReset, setConfirmReset] = useState(false);

  const exerciseRows = useMemo(() => {
    const rows = [];
    Object.entries(allDays).forEach(([dayKey, exList]) => {
      exList.forEach((ex) => {
        const weeks = [];
        for (let w = 0; w < 6; w++) {
          if (ex.type === "cardio") {
            const l = logs[logKey(w, dayKey, ex.id)];
            weeks.push(l && l.time ? l.time : "—");
          } else {
            const sets = getSets(logs, w, dayKey, ex.id, ex.sets).filter((s) => s.weight);
            weeks.push(sets.length ? sets.map((s) => `${s.weight}${s.reps ? `×${s.reps}` : ""}`).join(" / ") : "—");
          }
        }
        rows.push({ dayKey, name: ex.name, weeks });
      });
    });
    return rows;
  }, [logs]);

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: C.ink }} />
          <h2 className="font-display text-2xl" style={{ color: C.ink }}>
            PROGRESS LOG
          </h2>
        </div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="text-xs flex items-center gap-1 font-semibold" style={{ color: C.sub }}>
            <RotateCcw size={12} /> Reset block
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: C.accent }}>Sure?</span>
            <button
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
              className="font-bold"
              style={{ color: C.accent }}
            >
              Yes
            </button>
            <button onClick={() => setConfirmReset(false)} style={{ color: C.sub }}>
              No
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th className="text-left py-2 pr-2 font-bold sticky left-0" style={{ backgroundColor: C.page, color: C.ink }}>
                Exercise
              </th>
              {[1, 2, 3, 4, 5, 6].map((w) => (
                <th key={w} className="text-center py-2 px-1 font-bold" style={{ color: C.ink }}>
                  W{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exerciseRows.map((row, i) => (
              <tr key={i} className="border-t-2" style={{ borderColor: "#DDDBD5" }}>
                <td className="py-2 pr-2 font-semibold sticky left-0" style={{ backgroundColor: C.page, color: C.ink }}>
                  {row.name}
                </td>
                {row.weeks.map((w, j) => (
                  <td key={j} className="text-center py-2 px-1 whitespace-nowrap" style={{ color: C.sub }}>
                    {w}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-4 text-center pb-6" style={{ color: C.note }}>
        This shows the current block only. Past blocks are kept safe under Settings.
      </p>
    </div>
  );
}
