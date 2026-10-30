import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultData, normalizeData } from "../js/storage.js";

test("new profiles default to light mode and the original monochrome appearance", () => {
  const data = createDefaultData();
  assert.equal(data.preferences.theme, "light");
  assert.equal(data.preferences.appearanceConfigured, false);
  assert.equal("accentColor" in data.preferences, false);
});

test("light and dark appearance preferences survive data normalization", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: { age: 30 },
    preferences: { units: "metric", theme: "dark", appearanceConfigured: true },
    entries: [],
  });
  assert.equal(data.preferences.theme, "dark");
  assert.equal(data.preferences.appearanceConfigured, true);
  assert.equal("accentColor" in data.preferences, false);
});

test("legacy accent colors are ignored without affecting existing profile data", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: { age: 28 },
    preferences: { units: "imperial", theme: "dark", accentColor: "violet", appearanceConfigured: true },
    entries: [],
  });
  assert.equal(data.preferences.units, "imperial");
  assert.equal(data.preferences.theme, "dark");
  assert.equal(data.profile.age, 28);
  assert.equal(data.preferences.appearanceConfigured, true);
  assert.equal("accentColor" in data.preferences, false);
});

test("older profile exports without appearance preferences remain compatible", () => {
  const data = normalizeData({
    version: 1,
    onboardingComplete: true,
    profile: {},
    preferences: { units: "imperial" },
    entries: [],
  });
  assert.equal(data.preferences.units, "imperial");
  assert.equal(data.preferences.theme, "light");
  assert.equal(data.preferences.appearanceConfigured, false);
});
