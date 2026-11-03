import "server-only";
import { goalLabel, EQUIPMENT } from "./profile";
import { normalizePlan } from "./plan";
import { displayToKg, kgToDisplay, weightUnit, cmToFtIn } from "./units";

const BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

export const aiConfigured = () => Boolean(process.env.OPENROUTER_API_KEY);
export const aiModel = () => process.env.OPENROUTER_MODEL || "anyrouter/free";

export class AIError extends Error {}

const TRANSIENT = /provider error \((408|429|5\d\d)\)|stream error|timed out|Could not reach|empty response|cut off/;

// Free routes are often rate-limited or briefly unavailable, so retry transient failures
// until the deadline, leaving the caller time to fall back.
async function chat(messages, { maxTokens = 16000, deadline = Date.now() + 100_000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    try {
      return await chatOnce(messages, { maxTokens, timeoutMs: remaining });
    } catch (e) {
      lastError = e;
      if (!TRANSIENT.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError ?? new AIError("AI request timed out.");
}

// Streams the response: free upstreams drop non-streaming requests that are silent for ~20s.
async function chatOnce(messages, { maxTokens, timeoutMs }) {
  if (!aiConfigured()) throw new AIError("No AI API key is configured.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Workout Planner",
      },
      body: JSON.stringify({
        model: aiModel(),
        messages,
        temperature: 0.6,
        max_tokens: maxTokens,
        stream: true,
        // Reasoning models otherwise spend the whole token budget thinking before answering.
        reasoning: { effort: "low", enabled: false },
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new AIError(`AI provider error (${res.status}): ${body?.error?.message || res.statusText}`);
    }

    let content = "";
    let finish = null;
    let buffer = "";
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }
        if (event.error) throw new AIError(`AI stream error: ${event.error.message || event.error.code}`);
        const choice = event.choices?.[0];
        content += choice?.delta?.content || "";
        finish = choice?.finish_reason || finish;
      }
    }
    if (!content.trim()) throw new AIError("AI returned an empty response.");
    if (finish === "length" && !content.includes("}")) throw new AIError("AI response was cut off.");
    return content;
  } catch (e) {
    if (e.name === "AbortError") throw new AIError("AI request timed out.");
    if (e instanceof AIError) throw e;
    throw new AIError(`Could not reach the AI provider: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text) {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new AIError("AI response did not contain JSON.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AIError("AI response was not valid JSON.");
  }
}

function describeProfile(p) {
  const u = weightUnit(p.units);
  const height = p.units === "metric" ? `${Math.round(p.heightCm)} cm` : (({ ft, in: i }) => `${ft}'${i}"`)(cmToFtIn(p.heightCm));
  const prs = Object.entries(p.prs ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${kgToDisplay(v, p.units)} ${u}`)
    .join(", ");
  return [
    `Goals: ${p.goals.map(goalLabel).join(", ")}${p.targetText ? ` — in their words: "${p.targetText}"` : ""}`,
    `Age ${p.age}, sex ${p.sex}, height ${height}, weight ${kgToDisplay(p.weightKg, p.units)} ${u}`,
    p.goalWeightKg ? `Goal bodyweight: ${kgToDisplay(p.goalWeightKg, p.units)} ${u}` : null,
    `Experience: ${p.experience}`,
    prs ? `Current 1-rep maxes: ${prs}` : "1-rep maxes unknown — estimate conservative starting weights from bodyweight and experience",
    `Trains ${p.daysPerWeek} days per week, about ${p.sessionMinutes} minutes per session`,
    `Equipment: ${EQUIPMENT.find((e) => e.id === p.equipment)?.label}`,
    p.injuries ? `Injuries / limitations: ${p.injuries}` : "No injuries reported",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM =
  "You are an expert, certified strength and conditioning coach. You design safe, evidence-based programs. You reply with a single valid JSON object and nothing else — no markdown, no commentary.";

export async function generateAIPlan(profile) {
  const u = weightUnit(profile.units);
  const prompt = `Design a personalised 7-day workout plan for this person:

${describeProfile(profile)}

Rules:
- Exactly ${profile.daysPerWeek} training days; the other days are rest/recovery days with "restDay": true and 2-4 light mobility or recovery items.
- Spread training days sensibly across the week with recovery between similar muscle groups.
- Fit each training session in ~${profile.sessionMinutes} minutes (including rest). Only use exercises possible with their equipment.
- Respect injuries: avoid aggravating movements and offer safer variations.
- Match sets/reps/rest to their goals. For main barbell lifts aimed at strength, use a 5x5 style scheme with progression notes.
- "recommendedWeight" is a NUMBER in ${u} for the working sets (per dumbbell for dumbbell exercises), or null for bodyweight/timed work.
- Keep tips short and practical.

Return JSON with exactly this shape:
{
  "summary": "2 sentence overview of the plan and why it fits them",
  "weeklyRoutine": [
    {
      "day": "Monday",
      "restDay": false,
      "focus": ["Chest", "Triceps"],
      "tips": ["tip 1", "tip 2", "tip 3"],
      "exercises": [
        { "name": "Bench Press", "sets": 5, "reps": "5", "rest": "2-3 min", "tip": "one-line cue", "notes": "how to progress", "recommendedWeight": 135 }
      ]
    }
  ]
}
Include all 7 days Monday through Sunday.`;

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt },
  ];

  // One shared budget so the route (maxDuration 120s) can still fall back to the built-in plan.
  const deadline = Date.now() + 100_000;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = extractJson(await chat(messages, { deadline }));
      const plan = normalizePlan(raw, { toKg: (n) => displayToKg(n, profile.units) });
      const trainingDays = plan.weeklyRoutine.filter((d) => !d.restDay).length;
      if (trainingDays === 0) throw new AIError("AI plan had no training days.");
      return plan;
    } catch (e) {
      lastError = e;
      if (!(e instanceof AIError) || /provider error \((401|402|403|404)\)/.test(e.message)) break;
    }
  }
  throw lastError;
}

export async function suggestAISwap(profile, day, exercise, reason) {
  const u = weightUnit(profile.units);
  const content = await chat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Athlete:\n${describeProfile(profile)}\n\nOn ${day.day} (${day.focus.join(", ")}) they need a replacement for "${exercise.name}" (${exercise.sets} x ${exercise.reps}).${reason ? ` Reason: ${reason}.` : ""}
Other exercises that day: ${day.exercises.map((e) => e.name).join(", ")}.
Return JSON: { "name": "...", "sets": 3, "reps": "8-12", "rest": "90 sec", "tip": "...", "notes": "...", "recommendedWeight": number in ${u} or null }`,
      },
    ],
    { maxTokens: 2000, deadline: Date.now() + 45_000 }
  );
  return extractJson(content);
}
