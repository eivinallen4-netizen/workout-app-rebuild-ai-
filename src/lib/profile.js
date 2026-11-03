import { z } from "zod";

export const GOALS = [
  { id: "strength", label: "Get stronger", hint: "Lift heavier on the big lifts" },
  { id: "muscle", label: "Build muscle", hint: "Add size and shape" },
  { id: "fat_loss", label: "Lose fat", hint: "Lean out while keeping muscle" },
  { id: "endurance", label: "Improve endurance", hint: "Better conditioning and stamina" },
  { id: "mobility", label: "Move better", hint: "Flexibility, joints and posture" },
  { id: "general", label: "General health", hint: "Feel fit and energetic" },
];

export const EXPERIENCE = [
  { id: "beginner", label: "Beginner", hint: "Under 1 year of regular training" },
  { id: "intermediate", label: "Intermediate", hint: "1–3 years, comfortable with the main lifts" },
  { id: "advanced", label: "Advanced", hint: "3+ years of structured training" },
];

export const EQUIPMENT = [
  { id: "gym", label: "Full gym", hint: "Barbells, machines, cables" },
  { id: "dumbbells", label: "Home – dumbbells", hint: "Adjustable dumbbells and a bench" },
  { id: "bodyweight", label: "Bodyweight only", hint: "No equipment needed" },
];

export const SESSION_LENGTHS = [30, 45, 60, 90];

export const PR_LIFTS = [
  { id: "bench", label: "Bench press" },
  { id: "squat", label: "Squat" },
  { id: "deadlift", label: "Deadlift" },
  { id: "ohp", label: "Overhead press" },
];

const optKg = z.number().min(0).max(600).nullable().optional();

export const profileSchema = z.object({
  goals: z.array(z.enum(GOALS.map((g) => g.id))).min(1, "Pick at least one goal"),
  targetText: z.string().trim().max(300).optional().default(""),
  age: z.number().int().min(13, "Must be 13 or older").max(100),
  sex: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(100, "Check your height").max(250, "Check your height"),
  weightKg: z.number().min(30, "Check your weight").max(350, "Check your weight"),
  goalWeightKg: optKg,
  units: z.enum(["imperial", "metric"]),
  experience: z.enum(EXPERIENCE.map((e) => e.id)),
  prs: z
    .object({ bench: optKg, squat: optKg, deadlift: optKg, ohp: optKg })
    .optional()
    .default({}),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionMinutes: z.number().int().refine((v) => SESSION_LENGTHS.includes(v), "Invalid session length"),
  equipment: z.enum(EQUIPMENT.map((e) => e.id)),
  injuries: z.string().trim().max(500).optional().default(""),
});

export const DEFAULT_PROFILE = {
  goals: [],
  targetText: "",
  age: "",
  sex: "",
  heightCm: null,
  weightKg: null,
  goalWeightKg: null,
  units: "imperial",
  experience: "",
  prs: {},
  daysPerWeek: 4,
  sessionMinutes: 60,
  equipment: "",
  injuries: "",
};

export const goalLabel = (id) => GOALS.find((g) => g.id === id)?.label ?? id;
