"use client";
import { ChoiceCard, Segmented } from "../ui/Choice";
import { TextArea, TextInput } from "../ui/Field";
import { GOALS, EXPERIENCE, EQUIPMENT, SESSION_LENGTHS, PR_LIFTS } from "@/lib/profile";
import { cmToFtIn, ftInToCm, kgToDisplay, displayToKg, weightUnit } from "@/lib/units";

// The form works on a "draft" of display strings; these convert to/from the stored profile.
export function draftFromProfile(p = {}) {
  const units = p.units ?? "imperial";
  const { ft, in: inch } = p.heightCm ? cmToFtIn(p.heightCm) : { ft: "", in: "" };
  const show = (kg) => (kg ? String(kgToDisplay(kg, units)) : "");
  return {
    goals: p.goals ?? [],
    targetText: p.targetText ?? "",
    age: p.age ? String(p.age) : "",
    sex: p.sex ?? "",
    units,
    heightFt: String(ft),
    heightIn: String(inch),
    heightCm: p.heightCm ? String(Math.round(p.heightCm)) : "",
    weight: show(p.weightKg),
    goalWeight: show(p.goalWeightKg),
    experience: p.experience ?? "",
    prs: Object.fromEntries(PR_LIFTS.map(({ id }) => [id, show(p.prs?.[id])])),
    daysPerWeek: p.daysPerWeek ?? 4,
    sessionMinutes: p.sessionMinutes ?? 60,
    equipment: p.equipment ?? "",
    injuries: p.injuries ?? "",
  };
}

export function profileFromDraft(d) {
  const kg = (v) => {
    const n = displayToKg(v, d.units);
    return n && n > 0 ? n : null;
  };
  return {
    goals: d.goals,
    targetText: d.targetText.trim(),
    age: Number(d.age),
    sex: d.sex,
    units: d.units,
    heightCm: d.units === "metric" ? Number(d.heightCm) : ftInToCm(d.heightFt, d.heightIn),
    weightKg: kg(d.weight),
    goalWeightKg: kg(d.goalWeight),
    experience: d.experience,
    prs: Object.fromEntries(PR_LIFTS.map(({ id }) => [id, kg(d.prs[id])])),
    daysPerWeek: d.daysPerWeek,
    sessionMinutes: d.sessionMinutes,
    equipment: d.equipment,
    injuries: d.injuries.trim(),
  };
}

/** Switching units converts the numbers already typed so nothing is lost. */
export function switchUnits(d, units) {
  if (units === d.units) return d;
  return draftFromProfile({ ...profileFromDraft(d), units });
}

export const STEPS = [
  { id: "goals", title: "What are your goals?", subtitle: "Pick everything that matters to you — we'll balance them." },
  { id: "body", title: "Tell us about you", subtitle: "Used to tailor volume and starting weights." },
  { id: "experience", title: "Your training experience", subtitle: "Add your best lifts if you know them — it makes weights more accurate." },
  { id: "schedule", title: "Your schedule & equipment", subtitle: "We'll fit every session into the time you have." },
  { id: "limits", title: "Anything we should work around?", subtitle: "Injuries, pain or movements you want to avoid." },
];

export function validateStep(id, d) {
  const e = {};
  if (id === "goals" && !d.goals.length) e.goals = "Pick at least one goal";
  if (id === "body") {
    const age = Number(d.age);
    if (!d.age || age < 13 || age > 100) e.age = "Enter an age between 13 and 100";
    if (!d.sex) e.sex = "Select one";
    const cm = d.units === "metric" ? Number(d.heightCm) : ftInToCm(d.heightFt, d.heightIn);
    if (!cm || cm < 100 || cm > 250) e.height = "Enter a valid height";
    const kg = displayToKg(d.weight, d.units);
    if (!kg || kg < 30 || kg > 350) e.weight = "Enter a valid weight";
    if (d.goalWeight) {
      const g = displayToKg(d.goalWeight, d.units);
      if (!g || g < 30 || g > 350) e.goalWeight = "Enter a valid weight or leave blank";
    }
  }
  if (id === "experience") {
    if (!d.experience) e.experience = "Select your experience level";
    for (const { id: lift } of PR_LIFTS) {
      const v = d.prs[lift];
      if (v && (Number.isNaN(Number(v)) || Number(v) <= 0 || Number(v) > 1300)) e[`pr_${lift}`] = "Check this number";
    }
  }
  if (id === "schedule" && !d.equipment) e.equipment = "Select your equipment";
  return e;
}

const ErrorText = ({ children }) => (children ? <p className="mt-2 text-sm text-danger">{children}</p> : null);

export function StepFields({ id, draft: d, setDraft, errors = {} }) {
  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const u = weightUnit(d.units);

  if (id === "goals")
    return (
      <div className="space-y-5">
        <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Goals">
          {GOALS.map((g) => {
            const on = d.goals.includes(g.id);
            return (
              <ChoiceCard
                key={g.id}
                multi
                selected={on}
                label={g.label}
                hint={g.hint}
                onClick={() => set({ goals: on ? d.goals.filter((x) => x !== g.id) : [...d.goals, g.id] })}
              />
            );
          })}
        </div>
        <ErrorText>{errors.goals}</ErrorText>
        <TextArea
          label="Anything specific? (optional)"
          placeholder="e.g. Bench 225 lb by summer, run a 5K, lose 15 lb for a wedding"
          value={d.targetText}
          maxLength={300}
          onChange={(e) => set({ targetText: e.target.value })}
        />
      </div>
    );

  if (id === "body")
    return (
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-medium">Units</p>
          <Segmented
            label="Units"
            value={d.units}
            onChange={(units) => setDraft((prev) => switchUnits(prev, units))}
            options={[
              { value: "imperial", label: "lb / ft" },
              { value: "metric", label: "kg / cm" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Age" type="number" inputMode="numeric" value={d.age} onChange={(e) => set({ age: e.target.value })} error={errors.age} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Sex</p>
            <Segmented
              label="Sex"
              value={d.sex}
              onChange={(sex) => set({ sex })}
              options={[
                { value: "male", label: "M" },
                { value: "female", label: "F" },
                { value: "other", label: "Other" },
              ]}
            />
            <ErrorText>{errors.sex}</ErrorText>
          </div>
        </div>
        {d.units === "metric" ? (
          <TextInput label="Height" type="number" inputMode="numeric" suffix="cm" value={d.heightCm} onChange={(e) => set({ heightCm: e.target.value })} error={errors.height} />
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Height" type="number" inputMode="numeric" suffix="ft" value={d.heightFt} onChange={(e) => set({ heightFt: e.target.value })} aria-label="Height feet" />
              <TextInput label="&nbsp;" type="number" inputMode="numeric" suffix="in" value={d.heightIn} onChange={(e) => set({ heightIn: e.target.value })} aria-label="Height inches" />
            </div>
            <ErrorText>{errors.height}</ErrorText>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Current weight" type="number" inputMode="decimal" suffix={u} value={d.weight} onChange={(e) => set({ weight: e.target.value })} error={errors.weight} />
          <TextInput label="Goal weight" hint="Optional" type="number" inputMode="decimal" suffix={u} value={d.goalWeight} onChange={(e) => set({ goalWeight: e.target.value })} error={errors.goalWeight} />
        </div>
      </div>
    );

  if (id === "experience")
    return (
      <div className="space-y-5">
        <div className="space-y-2.5" role="radiogroup" aria-label="Experience">
          {EXPERIENCE.map((x) => (
            <ChoiceCard key={x.id} selected={d.experience === x.id} label={x.label} hint={x.hint} onClick={() => set({ experience: x.id })} />
          ))}
          <ErrorText>{errors.experience}</ErrorText>
        </div>
        <div>
          <p className="text-sm font-medium">Best lifts — 1 rep max (optional)</p>
          <p className="mb-3 text-sm text-muted">Skip any you don't know; we'll estimate safe starting weights.</p>
          <div className="grid grid-cols-2 gap-3">
            {PR_LIFTS.map((l) => (
              <TextInput
                key={l.id}
                label={l.label}
                type="number"
                inputMode="decimal"
                suffix={u}
                value={d.prs[l.id]}
                onChange={(e) => set({ prs: { ...d.prs, [l.id]: e.target.value } })}
                error={errors[`pr_${l.id}`]}
              />
            ))}
          </div>
        </div>
      </div>
    );

  if (id === "schedule")
    return (
      <div className="space-y-6">
        <div>
          <p className="mb-1.5 text-sm font-medium">Training days per week</p>
          <Segmented label="Days per week" value={d.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">Time per session</p>
          <Segmented label="Session length" value={d.sessionMinutes} onChange={(v) => set({ sessionMinutes: v })} options={SESSION_LENGTHS.map((n) => ({ value: n, label: `${n}m` }))} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">Where do you train?</p>
          <div className="space-y-2.5" role="radiogroup" aria-label="Equipment">
            {EQUIPMENT.map((x) => (
              <ChoiceCard key={x.id} selected={d.equipment === x.id} label={x.label} hint={x.hint} onClick={() => set({ equipment: x.id })} />
            ))}
          </div>
          <ErrorText>{errors.equipment}</ErrorText>
        </div>
      </div>
    );

  if (id === "limits")
    return (
      <TextArea
        label="Injuries or limitations (optional)"
        placeholder="e.g. Left knee pain on deep squats, lower back gets tight, shoulder impingement"
        value={d.injuries}
        maxLength={500}
        onChange={(e) => set({ injuries: e.target.value })}
        hint="Leave blank if none. This is not medical advice — check with a professional if you're in pain."
      />
    );

  return null;
}
