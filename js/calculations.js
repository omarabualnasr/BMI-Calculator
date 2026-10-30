/**
 * Transparent, deterministic calculations for TheHealthCalculator.
 * All body measurements are stored in metric units internally.
 * Missing or invalid inputs return null; no defaults are invented.
 */

export const ACTIVITY_FACTORS = Object.freeze({
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
});

export function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function calculateBMI(weightKg, heightCm) {
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(heightCm)) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function classifyAdultBMI(bmi, age) {
  if (!isPositiveNumber(bmi) || !Number.isFinite(age) || age < 20) return null;
  if (bmi < 18.5) return { label: "Below the adult reference range", tone: "neutral" };
  if (bmi < 25) return { label: "Within the adult reference range", tone: "good" };
  if (bmi < 30) return { label: "Overweight range", tone: "caution" };
  if (bmi < 35) return { label: "Obesity class I range", tone: "caution" };
  if (bmi < 40) return { label: "Obesity class II range", tone: "caution" };
  return { label: "Obesity class III range", tone: "caution" };
}

export function calculateWaistHeightRatio(waistCm, heightCm) {
  if (!isPositiveNumber(waistCm) || !isPositiveNumber(heightCm)) return null;
  return waistCm / heightCm;
}

export function classifyWaistHeightRatio(ratio, age, bmi) {
  if (!isPositiveNumber(ratio) || !Number.isFinite(age) || age < 18 || !isPositiveNumber(bmi) || bmi >= 35) return null;
  if (ratio < 0.4) return { label: "Below the 0.4–0.49 reference band", tone: "neutral" };
  if (ratio < 0.5) return { label: "Within the 0.4–0.49 reference band", tone: "good" };
  if (ratio < 0.6) return { label: "Increased central adiposity range", tone: "caution" };
  return { label: "Higher central adiposity range", tone: "caution" };
}

export function calculateWaistHipRatio(waistCm, hipCm) {
  if (!isPositiveNumber(waistCm) || !isPositiveNumber(hipCm)) return null;
  return waistCm / hipCm;
}

/** Mifflin–St Jeor resting energy estimate; equationOffset is +5, -161, or -78. */
export function calculateBMR(weightKg, heightCm, age, equationOffset) {
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(heightCm) || !Number.isFinite(age) || age < 18 || !Number.isFinite(equationOffset)) return null;
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + equationOffset;
}

export function calculateTDEE(bmr, activityLevel) {
  const factor = ACTIVITY_FACTORS[activityLevel];
  if (!isPositiveNumber(bmr) || !Number.isFinite(factor)) return null;
  return bmr * factor;
}

export function calculateBodySurfaceArea(weightKg, heightCm) {
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(heightCm)) return null;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function calculatePulsePressure(systolic, diastolic) {
  if (!isPositiveNumber(systolic) || !isPositiveNumber(diastolic) || systolic <= diastolic) return null;
  return systolic - diastolic;
}

export function calculateMeanArterialPressure(systolic, diastolic) {
  if (!isPositiveNumber(systolic) || !isPositiveNumber(diastolic) || systolic <= diastolic) return null;
  return (systolic + (2 * diastolic)) / 3;
}

export function deriveMetrics(profile = {}, entry = {}) {
  const bmi = calculateBMI(entry.weightKg, profile.heightCm);
  const waistHeightRatio = calculateWaistHeightRatio(entry.waistCm, profile.heightCm);
  const waistHipRatio = calculateWaistHipRatio(entry.waistCm, entry.hipCm);
  const bmr = calculateBMR(entry.weightKg, profile.heightCm, profile.age, profile.equationOffset);
  return {
    bmi,
    bmiCategory: classifyAdultBMI(bmi, profile.age),
    waistHeightRatio,
    waistHeightCategory: classifyWaistHeightRatio(waistHeightRatio, profile.age, bmi),
    waistHipRatio,
    bmr,
    tdee: calculateTDEE(bmr, profile.activityLevel),
    bodySurfaceArea: calculateBodySurfaceArea(entry.weightKg, profile.heightCm),
    pulsePressure: calculatePulsePressure(entry.systolic, entry.diastolic),
    meanArterialPressure: calculateMeanArterialPressure(entry.systolic, entry.diastolic),
  };
}

export function round(value, decimals = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
