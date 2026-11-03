// All weights are stored in kg and heights in cm; these helpers convert for display.
export const LB_PER_KG = 2.20462;

export const weightUnit = (units) => (units === "metric" ? "kg" : "lb");

export function kgToDisplay(kg, units) {
  if (kg == null || Number.isNaN(kg)) return null;
  const v = units === "metric" ? kg : kg * LB_PER_KG;
  return Math.round(v * 2) / 2;
}

export function displayToKg(value, units) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return units === "metric" ? n : n / LB_PER_KG;
}

export function formatWeight(kg, units) {
  const v = kgToDisplay(kg, units);
  return v == null ? "" : `${v} ${weightUnit(units)}`;
}

/** Rounds kg to a plate-friendly number in the user's units, returned in kg. */
export function roundToPlates(kg, units) {
  if (units === "metric") return Math.max(2.5, Math.round(kg / 2.5) * 2.5);
  const lb = Math.max(5, Math.round((kg * LB_PER_KG) / 5) * 5);
  return lb / LB_PER_KG;
}

export function cmToFtIn(cm) {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}

export const ftInToCm = (ft, inch) => (Number(ft || 0) * 12 + Number(inch || 0)) * 2.54;
