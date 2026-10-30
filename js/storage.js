export const STORAGE_KEY = "thehealthcalculator.data.v1";

export function createDefaultData() {
  return {
    version: 1,
    onboardingComplete: false,
    profile: {},
    preferences: { units: "metric", theme: "light", appearanceConfigured: false },
    entries: [],
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanNumber(value, min = 0, max = 100000) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
}

export function normalizeData(raw) {
  if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.entries) || !isObject(raw.profile)) {
    throw new Error("This file is not a valid TheHealthCalculator data export.");
  }
  const safe = createDefaultData();
  safe.onboardingComplete = Boolean(raw.onboardingComplete);
  safe.profile.age = cleanNumber(raw.profile.age, 1, 120);
  safe.profile.heightCm = cleanNumber(raw.profile.heightCm, 50, 260);
  safe.profile.equationOffset = [-161, -78, 5].includes(Number(raw.profile.equationOffset)) ? Number(raw.profile.equationOffset) : undefined;
  safe.profile.activityLevel = ["sedentary", "light", "moderate", "veryActive", "extraActive"].includes(raw.profile.activityLevel) ? raw.profile.activityLevel : undefined;
  safe.preferences.units = raw.preferences?.units === "imperial" ? "imperial" : "metric";
  safe.preferences.theme = raw.preferences?.theme === "dark" ? "dark" : "light";
  safe.preferences.appearanceConfigured = raw.preferences?.appearanceConfigured === true;
  safe.entries = raw.entries.map((entry) => {
    if (!isObject(entry) || typeof entry.id !== "string" || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || new Date(`${entry.date}T12:00:00Z`).toISOString().slice(0, 10) !== entry.date) return null;
    const clean = { id: entry.id, date: entry.date, createdAt: typeof entry.createdAt === "string" ? entry.createdAt : `${entry.date}T12:00:00.000Z` };
    const limits = {
      weightKg: [1, 500], waistCm: [20, 250], hipCm: [20, 250],
      systolic: [30, 300], diastolic: [20, 250], restingHeartRate: [20, 250],
      sleepHours: [0.1, 24], exerciseMinutes: [0, 1440],
    };
    for (const [key, [min, max]] of Object.entries(limits)) {
      const value = cleanNumber(entry[key], min, max);
      if (value !== undefined) clean[key] = value;
    }
    return Object.keys(clean).length > 3 ? clean : null;
  }).filter(Boolean);
  return safe;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    return normalizeData(JSON.parse(raw));
  } catch {
    return createDefaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sortEntries(entries, direction = "asc") {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  return direction === "desc" ? sorted.reverse() : sorted;
}
