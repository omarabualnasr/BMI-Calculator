import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultData, normalizeData } from "../js/storage.js";

test("new profiles default to light mode and blue accent", () => {
  const data = createDefaultData();
  assert.equal(data.preferences.theme, "light");
  assert.equal(data.preferences.accentColor, "blue");
  assert.equal(data.preferences.appearanceConfigured, false);
});

test("appearance preferences survive data normalization", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: { age: 30 },
    preferences: { units: "metric", theme: "dark", accentColor: "violet", appearanceConfigured: true },
    entries: [],
  });
  assert.equal(data.preferences.theme, "dark");
  assert.equal(data.preferences.accentColor, "violet");
  assert.equal(data.preferences.appearanceConfigured, true);
});

test("older profile exports without accent color remain compatible", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: {},
    preferences: { units: "imperial", theme: "dark" },
    entries: [],
  });
  assert.equal(data.preferences.units, "imperial");
  assert.equal(data.preferences.theme, "dark");
  assert.equal(data.preferences.accentColor, "blue");
  assert.equal(data.preferences.appearanceConfigured, false);
});

test("unknown accent colors safely fall back to blue", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: {},
    preferences: { accentColor: "neon-purple" },
    entries: [],
  });
  assert.equal(data.preferences.accentColor, "blue");
});
