// Rule-based coach: builds a sensible weekly plan from the profile with no AI required.
import { WEEKDAYS } from "./dates";
import { pickExercise } from "./exerciseLibrary";
import { normalizePlan } from "./plan";
import { roundToPlates } from "./units";

const TEMPLATES = {
  fullA: { focus: ["Full Body"], slots: ["squat", "hpush", "hpull", "hinge", "vpush", "core", "lunge", "biceps", "triceps"] },
  fullB: { focus: ["Full Body"], slots: ["hinge", "vpush", "vpull", "lunge", "hpush", "core", "hamstring", "shoulder_iso"], variant: 1 },
  fullC: { focus: ["Full Body"], slots: ["squat", "hpush", "hpull", "glute", "vpull", "core", "calves", "triceps"], variant: 2 },
  upperA: { focus: ["Chest", "Back", "Shoulders"], slots: ["hpush", "hpull", "vpush", "vpull", "shoulder_iso", "triceps", "biceps", "chest_iso"] },
  upperB: { focus: ["Back", "Chest", "Arms"], slots: ["vpull", "hpush", "hpull", "vpush", "biceps", "triceps", "shoulder_iso", "chest_iso"], variant: 1 },
  lowerA: { focus: ["Quads", "Glutes", "Core"], slots: ["squat", "hinge", "lunge", "quad", "calves", "core", "hamstring"] },
  lowerB: { focus: ["Hamstrings", "Glutes", "Core"], slots: ["hinge", "squat", "glute", "hamstring", "lunge", "core", "calves"], variant: 1 },
  push: { focus: ["Chest", "Shoulders", "Triceps"], slots: ["hpush", "vpush", "chest_iso", "shoulder_iso", "triceps", "hpush"] },
  pull: { focus: ["Back", "Biceps"], slots: ["vpull", "hpull", "shoulder_iso", "biceps", "core", "hpull"] },
  legs: { focus: ["Legs", "Core"], slots: ["squat", "hinge", "lunge", "quad", "hamstring", "calves", "core"] },
  pushB: { focus: ["Shoulders", "Chest", "Triceps"], slots: ["vpush", "hpush", "shoulder_iso", "chest_iso", "triceps"], variant: 1 },
  pullB: { focus: ["Back", "Biceps"], slots: ["hpull", "vpull", "biceps", "shoulder_iso", "core"], variant: 1 },
  legsB: { focus: ["Legs", "Glutes"], slots: ["hinge", "squat", "glute", "hamstring", "lunge", "calves"], variant: 1 },
};

const SPLITS = {
  2: { days: [0, 3], templates: ["fullA", "fullB"] },
  3: { days: [0, 2, 4], templates: ["fullA", "fullB", "fullC"] },
  4: { days: [0, 1, 3, 4], templates: ["upperA", "lowerA", "upperB", "lowerB"] },
  5: { days: [0, 1, 2, 4, 5], templates: ["push", "pull", "legs", "upperA", "lowerB"] },
  6: { days: [0, 1, 2, 3, 4, 5], templates: ["push", "pull", "legs", "pushB", "pullB", "legsB"] },
};

const PRESCRIPTION = {
  strength: { main: { sets: 5, reps: "5", rest: "3 min", pct: 0.8 }, acc: { sets: 3, reps: "8-10", rest: "90 sec" } },
  muscle: { main: { sets: 4, reps: "6-10", rest: "2 min", pct: 0.72 }, acc: { sets: 3, reps: "10-15", rest: "60-90 sec" } },
  fat_loss: { main: { sets: 3, reps: "8-12", rest: "90 sec", pct: 0.65 }, acc: { sets: 3, reps: "12-15", rest: "45-60 sec" }, finisher: true },
  endurance: { main: { sets: 3, reps: "12-15", rest: "60 sec", pct: 0.55 }, acc: { sets: 3, reps: "15-20", rest: "45 sec" }, finisher: true },
  general: { main: { sets: 3, reps: "8-12", rest: "90 sec", pct: 0.65 }, acc: { sets: 3, reps: "10-12", rest: "60 sec" } },
};
const GOAL_PRIORITY = ["strength", "muscle", "fat_loss", "endurance", "general", "mobility"];

// Typical 1RM as a multiple of bodyweight, used when the user doesn't know their PRs.
const STRENGTH_RATIOS = {
  beginner: { bench: 0.6, squat: 0.8, deadlift: 1.0, ohp: 0.4 },
  intermediate: { bench: 1.0, squat: 1.3, deadlift: 1.6, ohp: 0.6 },
  advanced: { bench: 1.3, squat: 1.7, deadlift: 2.1, ohp: 0.8 },
};

const MAX_EXERCISES = { 30: 4, 45: 5, 60: 6, 90: 7 };

function primaryGoal(goals) {
  const g = GOAL_PRIORITY.find((id) => goals.includes(id)) ?? "general";
  return g === "mobility" ? "general" : g;
}

function estimate1RM(profile, lift) {
  const known = profile.prs?.[lift];
  if (known) return { kg: known, estimated: false };
  const ratio = STRENGTH_RATIOS[profile.experience]?.[lift] ?? STRENGTH_RATIOS.beginner[lift];
  const sexFactor = profile.sex === "female" ? 0.65 : 1;
  return { kg: profile.weightKg * ratio * sexFactor, estimated: true };
}

function buildExercise(lib, { isMain, rx, profile }) {
  const p = isMain && lib.compound ? rx.main : rx.acc;
  let sets = p.sets;
  if (profile.experience === "beginner") sets = Math.max(2, sets - 1);
  if (profile.experience === "advanced" && isMain) sets += 1;

  let reps = p.reps;
  if (lib.timed) reps = lib.pattern === "recovery" ? "20-30 min" : "30-45 sec";

  let recommendedKg = null;
  let weightNote = "";
  if (lib.pr) {
    const { kg, estimated } = estimate1RM(profile, lib.pr);
    const pct = isMain && lib.compound ? rx.main.pct : rx.main.pct - 0.1;
    recommendedKg = roundToPlates(kg * lib.factor * pct, profile.units);
    if (estimated) weightNote = "Starting estimate — adjust to feel";
  } else if (lib.equip.includes("bodyweight")) {
    weightNote = "Bodyweight";
  } else {
    weightNote = "Leave 2 reps in the tank";
  }

  const notes =
    isMain && lib.compound && rx === PRESCRIPTION.strength
      ? "When you hit every rep on all sets with good form, add 5 lb / 2.5 kg next session."
      : `Use a weight where the last rep of each set is hard but clean. When you reach the top of the rep range on every set, increase the load.`;

  return { ...lib, sets, reps, rest: p.rest, recommendedKg, weightNote, notes };
}

function mobilityBlock(equipment, count, offset = 0) {
  const names = [];
  const out = [];
  for (let i = 0; out.length < count && i < 10; i++) {
    const ex = pickExercise("mobility", equipment, i + offset, names);
    if (!ex) break;
    names.push(ex.name);
    out.push({ ...ex, sets: 2, reps: ex.timed ? "45 sec" : "8 each side", rest: "30 sec", weightNote: "Bodyweight", notes: "Move slowly and breathe; never force a range of motion." });
  }
  return out;
}

const DAY_TIPS = {
  strength: ["Warm up with 2–3 lighter ramp-up sets before your first heavy lift.", "Rest fully between heavy sets — strength needs recovery.", "Log every set so you know exactly what to beat next time."],
  muscle: ["Control the lowering phase for 2–3 seconds.", "Train close to failure on the last set of each exercise.", "Aim for 1.6–2.2 g of protein per kg of bodyweight daily."],
  fat_loss: ["Keep rest periods short to keep your heart rate up.", "Stay in a modest calorie deficit and prioritise protein.", "Daily steps matter as much as the workout itself."],
  endurance: ["Keep moving between sets — short rests build work capacity.", "Breathe rhythmically and keep a sustainable pace.", "Hydrate before, during and after training."],
  general: ["Start with 5 minutes of light cardio to warm up.", "Focus on smooth, controlled reps over heavy weight.", "Consistency beats intensity — just show up."],
};

export function generateBuiltinPlan(profile) {
  const goal = primaryGoal(profile.goals);
  const rx = PRESCRIPTION[goal];
  const split = SPLITS[profile.daysPerWeek] ?? SPLITS[3];
  const maxEx = MAX_EXERCISES[profile.sessionMinutes] ?? 6;
  const wantsMobility = profile.goals.includes("mobility");

  const weeklyRoutine = WEEKDAYS.map((day, dayIdx) => {
    const slot = split.days.indexOf(dayIdx);
    if (slot === -1) {
      return {
        day,
        restDay: true,
        focus: ["Recovery", "Mobility"],
        tips: ["Rest days are when you actually get stronger.", "Optional: 15 minutes of mobility and a relaxed walk.", "Sleep 7–9 hours to recover well."],
        exercises: [...mobilityBlock(profile.equipment, wantsMobility ? 4 : 3, dayIdx), buildExercise(pickExercise("recovery", "bodyweight"), { isMain: false, rx, profile })],
      };
    }

    const t = TEMPLATES[split.templates[slot]];
    const used = [];
    const exercises = [];
    if (wantsMobility) exercises.push(...mobilityBlock(profile.equipment, 1, dayIdx));
    const budget = maxEx - (rx.finisher ? 1 : 0);

    for (const [i, pattern] of t.slots.entries()) {
      if (exercises.length >= budget) break;
      const lib = pickExercise(pattern, profile.equipment, t.variant ?? 0, used) ?? pickExercise(pattern, profile.equipment, 0, used);
      if (!lib) continue;
      used.push(lib.name);
      exercises.push(buildExercise(lib, { isMain: i < 2, rx, profile }));
    }
    if (rx.finisher) {
      const fin = pickExercise("conditioning", profile.equipment, slot);
      if (fin) exercises.push({ ...buildExercise(fin, { isMain: false, rx, profile }), sets: 4, reps: "30 sec on / 30 sec off", rest: "30 sec", recommendedKg: null, weightNote: "Moderate pace", notes: "Conditioning finisher — push the pace but keep form crisp." });
    }

    return { day, restDay: false, focus: t.focus, tips: DAY_TIPS[goal], exercises };
  });

  const summary = `A ${profile.daysPerWeek}-day ${goal.replace("_", " ")} focused plan for ${profile.equipment === "gym" ? "the gym" : profile.equipment === "dumbbells" ? "home with dumbbells" : "bodyweight training"}, with ~${profile.sessionMinutes}-minute sessions and recovery days built in.`;

  return normalizePlan({ summary, weeklyRoutine });
}
