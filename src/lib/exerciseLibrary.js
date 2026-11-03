// Exercise library used by the built-in plan generator and the "swap exercise" feature.
// `equip` lists the equipment setups that can perform the movement.
// `pr` + `factor` estimate a working weight from a 1RM (factor = share of that lift's 1RM, per hand for dumbbells).

const ALL = ["gym", "dumbbells", "bodyweight"];
const GYM = ["gym"];
const DB = ["gym", "dumbbells"];

export const LIBRARY = [
  // Squat
  { name: "Back Squat", pattern: "squat", equip: GYM, compound: true, pr: "squat", factor: 1, tip: "Brace your core, break at hips and knees together, and drive up through mid-foot." },
  { name: "Front Squat", pattern: "squat", equip: GYM, compound: true, pr: "squat", factor: 0.8, tip: "Keep elbows high and torso upright the whole rep." },
  { name: "Leg Press", pattern: "squat", equip: GYM, compound: true, tip: "Lower until hips start to tuck, then press without locking knees hard." },
  { name: "Goblet Squat", pattern: "squat", equip: DB, compound: true, pr: "squat", factor: 0.3, tip: "Hold the dumbbell at your chest and sit between your heels." },
  { name: "Tempo Bodyweight Squat", pattern: "squat", equip: ALL, compound: true, tip: "3 seconds down, pause, drive up fast." },
  // Hinge
  { name: "Deadlift", pattern: "hinge", equip: GYM, compound: true, pr: "deadlift", factor: 1, tip: "Bar over mid-foot, lats tight, push the floor away." },
  { name: "Romanian Deadlift", pattern: "hinge", equip: GYM, compound: true, pr: "deadlift", factor: 0.6, tip: "Soft knees, push hips back until you feel a deep hamstring stretch." },
  { name: "Dumbbell Romanian Deadlift", pattern: "hinge", equip: DB, compound: true, pr: "deadlift", factor: 0.25, tip: "Keep dumbbells close to your legs and back flat." },
  { name: "Single-Leg Romanian Deadlift", pattern: "hinge", equip: ALL, compound: true, tip: "Reach your back leg long and keep hips square." },
  // Horizontal push
  { name: "Bench Press", pattern: "hpush", equip: GYM, compound: true, pr: "bench", factor: 1, tip: "Shoulder blades pinched, controlled descent to lower chest, explosive press." },
  { name: "Incline Dumbbell Press", pattern: "hpush", equip: DB, compound: true, pr: "bench", factor: 0.3, tip: "30–45° bench, elbows slightly tucked, press up and in." },
  { name: "Dumbbell Bench Press", pattern: "hpush", equip: DB, compound: true, pr: "bench", factor: 0.35, tip: "Lower until a stretch in the chest, keep wrists stacked." },
  { name: "Push-Up", pattern: "hpush", equip: ALL, compound: true, tip: "Body in a straight line, chest to just above the floor." },
  { name: "Decline Push-Up", pattern: "hpush", equip: ALL, compound: true, tip: "Feet elevated; keep core tight and hips level." },
  // Vertical push
  { name: "Overhead Press", pattern: "vpush", equip: GYM, compound: true, pr: "ohp", factor: 1, tip: "Squeeze glutes, press in a straight line and move your head through." },
  { name: "Seated Dumbbell Shoulder Press", pattern: "vpush", equip: DB, compound: true, pr: "ohp", factor: 0.35, tip: "Don't arch your lower back; stop just short of lockout clash." },
  { name: "Pike Push-Up", pattern: "vpush", equip: ALL, compound: true, tip: "Hips high, lower the top of your head toward the floor." },
  // Horizontal pull
  { name: "Barbell Row", pattern: "hpull", equip: GYM, compound: true, pr: "deadlift", factor: 0.45, tip: "Hinge to ~45°, pull the bar to your lower ribs." },
  { name: "Seated Cable Row", pattern: "hpull", equip: GYM, compound: true, tip: "Chest tall, pull elbows back and squeeze shoulder blades." },
  { name: "One-Arm Dumbbell Row", pattern: "hpull", equip: DB, compound: true, pr: "deadlift", factor: 0.2, tip: "Pull toward your hip, not your armpit." },
  { name: "Inverted Row", pattern: "hpull", equip: ALL, compound: true, tip: "Use a sturdy table or bar; keep your body rigid like a plank." },
  // Vertical pull
  { name: "Pull-Up", pattern: "vpull", equip: GYM, compound: true, tip: "Start from a dead hang, drive elbows down to your sides." },
  { name: "Lat Pulldown", pattern: "vpull", equip: GYM, compound: true, tip: "Pull the bar to your upper chest with a slight lean back." },
  { name: "Dumbbell Pullover", pattern: "vpull", equip: DB, compound: false, tip: "Keep a slight bend in the elbows and feel the lats stretch." },
  { name: "Prone Y-T-W Raise", pattern: "vpull", equip: ALL, compound: false, tip: "Lie face down and lift arms through Y, T and W shapes slowly." },
  // Single leg
  { name: "Bulgarian Split Squat", pattern: "lunge", equip: ALL, compound: true, tip: "Rear foot on a bench, front shin roughly vertical." },
  { name: "Walking Lunge", pattern: "lunge", equip: ALL, compound: true, tip: "Long steps, back knee just kisses the floor." },
  { name: "Reverse Lunge", pattern: "lunge", equip: ALL, compound: true, tip: "Step back and keep weight in the front heel." },
  // Isolation / accessories
  { name: "Lying Leg Curl", pattern: "hamstring", equip: GYM, tip: "Control the lowering for 2–3 seconds." },
  { name: "Glute Bridge", pattern: "hamstring", equip: ALL, tip: "Drive through heels and squeeze glutes at the top." },
  { name: "Leg Extension", pattern: "quad", equip: GYM, tip: "Pause briefly at the top of each rep." },
  { name: "Cossack Squat", pattern: "quad", equip: ALL, tip: "Shift side to side, keep the straight leg's toes up." },
  { name: "Hip Thrust", pattern: "glute", equip: DB, pr: "deadlift", factor: 0.4, tip: "Chin tucked, ribs down, lock out with glutes not your back." },
  { name: "Cable Fly", pattern: "chest_iso", equip: GYM, tip: "Hug a big tree; keep a soft bend in the elbows." },
  { name: "Dumbbell Fly", pattern: "chest_iso", equip: DB, tip: "Lower until a stretch, then squeeze the chest together." },
  { name: "Lateral Raise", pattern: "shoulder_iso", equip: DB, tip: "Lead with the elbows and stop at shoulder height." },
  { name: "Face Pull", pattern: "shoulder_iso", equip: GYM, tip: "Pull the rope to your forehead and rotate thumbs back." },
  { name: "Dumbbell Curl", pattern: "biceps", equip: DB, tip: "Keep elbows pinned and avoid swinging." },
  { name: "Hammer Curl", pattern: "biceps", equip: DB, tip: "Neutral grip; squeeze at the top." },
  { name: "Cable Triceps Pushdown", pattern: "triceps", equip: GYM, tip: "Elbows tucked at your sides; fully extend." },
  { name: "Overhead Dumbbell Triceps Extension", pattern: "triceps", equip: DB, tip: "Keep elbows pointing forward, lower behind your head." },
  { name: "Bench Dip", pattern: "triceps", equip: ALL, tip: "Shoulders down and back; lower until elbows reach 90°." },
  { name: "Standing Calf Raise", pattern: "calves", equip: ALL, tip: "Full stretch at the bottom, pause at the top." },
  // Core
  { name: "Plank", pattern: "core", equip: ALL, timed: true, tip: "Squeeze glutes and pull elbows toward toes." },
  { name: "Dead Bug", pattern: "core", equip: ALL, tip: "Press your low back into the floor the entire time." },
  { name: "Hanging Knee Raise", pattern: "core", equip: GYM, tip: "Curl your pelvis up; avoid swinging." },
  // Conditioning
  { name: "Rowing Machine Intervals", pattern: "conditioning", equip: GYM, tip: "Push with legs first, then lean, then pull." },
  { name: "Dumbbell Thrusters", pattern: "conditioning", equip: DB, tip: "Squat and press in one fluid motion." },
  { name: "Burpees", pattern: "conditioning", equip: ALL, tip: "Move at a pace you can sustain with good form." },
  // Mobility & recovery
  { name: "World's Greatest Stretch", pattern: "mobility", equip: ALL, tip: "Lunge, elbow to instep, then rotate and reach up." },
  { name: "Cat-Cow", pattern: "mobility", equip: ALL, tip: "Move slowly segment by segment through your spine." },
  { name: "90/90 Hip Switch", pattern: "mobility", equip: ALL, tip: "Sit tall and rotate your knees side to side." },
  { name: "Couch Stretch", pattern: "mobility", equip: ALL, tip: "Squeeze the glute of the back leg to open the hip flexor." },
  { name: "Thoracic Rotations", pattern: "mobility", equip: ALL, tip: "On all fours, hand behind head, rotate elbow to the ceiling." },
  { name: "Deep Squat Hold", pattern: "mobility", equip: ALL, timed: true, tip: "Heels down, chest up, gently push knees out with elbows." },
  { name: "Easy Walk", pattern: "recovery", equip: ALL, timed: true, tip: "Conversational pace — this is active recovery." },
];

export function pickExercise(pattern, equipment, variant = 0, exclude = []) {
  const options = LIBRARY.filter(
    (e) => e.pattern === pattern && e.equip.includes(equipment) && !exclude.includes(e.name)
  );
  if (!options.length) return null;
  return options[variant % options.length];
}

export function alternativesFor(pattern, equipment, exclude = []) {
  return LIBRARY.filter((e) => e.pattern === pattern && e.equip.includes(equipment) && !exclude.includes(e.name));
}

export const findInLibrary = (name) => LIBRARY.find((e) => e.name.toLowerCase() === String(name).toLowerCase());
