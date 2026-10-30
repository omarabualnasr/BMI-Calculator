import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBMI,
  calculateBMR,
  calculateBodySurfaceArea,
  calculateMeanArterialPressure,
  calculatePulsePressure,
  calculateTDEE,
  calculateWaistHeightRatio,
  calculateWaistHipRatio,
  classifyAdultBMI,
  classifyWaistHeightRatio,
} from "../js/calculations.js";
import { normalizeData, createDefaultData } from "../js/storage.js";

test("BMI uses kilograms divided by metres squared", () => {
  assert.equal(calculateBMI(72, 180), 22.22222222222222);
  assert.equal(calculateBMI(undefined, 180), null);
});

test("adult BMI bands require age 20 or older", () => {
  assert.equal(classifyAdultBMI(22, 20).label, "Within the adult reference range");
  assert.equal(classifyAdultBMI(22, 19), null);
});

test("waist ratios need all paired measurements", () => {
  assert.equal(calculateWaistHeightRatio(80, 180), 80 / 180);
  assert.equal(calculateWaistHipRatio(80, 100), 0.8);
  assert.equal(calculateWaistHipRatio(80, null), null);
});

test("waist-to-height category is withheld without context or BMI below 35", () => {
  assert.equal(classifyWaistHeightRatio(0.52, 30, 24).label, "Increased central adiposity range");
  assert.equal(classifyWaistHeightRatio(0.52, 30, 36), null);
});

test("Mifflin–St Jeor and TDEE estimates use selected equation and activity inputs", () => {
  assert.equal(calculateBMR(80, 180, 30, 5), 1780);
  assert.equal(calculateTDEE(1780, "sedentary"), 2136);
  assert.equal(calculateBMR(80, 180, 30, undefined), null);
  assert.equal(calculateBMR(60, 160, 17, 5), null);
});

test("Mosteller BSA and blood-pressure derivatives calculate correctly", () => {
  assert.equal(calculateBodySurfaceArea(72, 180), Math.sqrt(3.6));
  assert.equal(calculatePulsePressure(120, 80), 40);
  assert.equal(calculateMeanArterialPressure(120, 80), 280 / 3);
  assert.equal(calculatePulsePressure(80, 120), null);
});

test("data import keeps only known numeric fields and preserves zero exercise minutes", () => {
  const base = createDefaultData();
  base.entries = [{ id: "a", date: "2026-10-30", createdAt: "2026-10-30T10:00:00.000Z", exerciseMinutes: 0, unknown: "ignored" }];
  const result = normalizeData(base);
  assert.equal(result.entries[0].exerciseMinutes, 0);
  assert.equal("unknown" in result.entries[0], false);
});
