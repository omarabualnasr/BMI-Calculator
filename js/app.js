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
} from "./calculations.js";
import { createDefaultData, createId, loadData, saveData, sortEntries } from "./storage.js";

const root = document.querySelector("#app");
let data = loadData();
let state = {
  wizardIndex: 0,
  wizardAnswers: {},
  wizardValue: "",
  wizardError: "",
  tempUnits: data.preferences.units,
  toast: null,
};
let toastTimer;

const WORKSPACE_SECTIONS = [
  ["overview", "Overview"],
  ["measurements", "Measurements"],
  ["insights", "Insights"],
  ["reports", "Reports"],
];

const WIZARD_STEPS = [
  { key: "units", title: "Which units do you prefer?", copy: "Choose how measurements are displayed throughout your workspace.", type: "options", options: [{ value: "metric", label: "Metric", detail: "Centimetres and kilograms" }, { value: "imperial", label: "Imperial", detail: "Feet, inches and pounds" }], optional: false },
  { key: "age", title: "How old are you?", copy: "Age is used only by calculations that require it. Adult BMI categories are limited to adults aged 20 and above.", type: "number", suffix: "years", min: 1, max: 120, step: 1 },
  { key: "height", title: "What is your height?", copy: "Enter your height. It is used by BMI, body measurement ratios, BMR and body surface area calculations.", type: "number", suffixMetric: "cm", suffixImperial: "in", minMetric: 50, maxMetric: 260, minImperial: 19.7, maxImperial: 102.4, step: 0.1 },
  { key: "weight", title: "What is your current weight?", copy: "This creates your first dated measurement when you finish setup.", type: "number", suffixMetric: "kg", suffixImperial: "lb", minMetric: 1, maxMetric: 500, minImperial: 2.2, maxImperial: 1102, step: 0.1 },
  { key: "waist", title: "What is your waist measurement?", copy: "Optional. Use the same unit system you selected above.", type: "number", suffixMetric: "cm", suffixImperial: "in", minMetric: 20, maxMetric: 250, minImperial: 7.9, maxImperial: 98.4, step: 0.1 },
  { key: "hip", title: "What is your hip measurement?", copy: "Optional. This can be paired with waist measurement for a waist-to-hip ratio.", type: "number", suffixMetric: "cm", suffixImperial: "in", minMetric: 20, maxMetric: 250, minImperial: 7.9, maxImperial: 98.4, step: 0.1 },
  { key: "systolic", title: "What is your systolic blood pressure?", copy: "Enter the top number from a blood-pressure reading, in mmHg.", type: "number", suffix: "mmHg", min: 30, max: 300, step: 1 },
  { key: "diastolic", title: "What is your diastolic blood pressure?", copy: "Enter the bottom number from the same reading, in mmHg.", type: "number", suffix: "mmHg", min: 20, max: 250, step: 1 },
  { key: "restingHeartRate", title: "What is your resting heart rate?", copy: "Optional. Enter a recent resting reading, in beats per minute.", type: "number", suffix: "bpm", min: 20, max: 250, step: 1 },
  { key: "sleepHours", title: "How long do you usually sleep?", copy: "Optional. This records your entered duration; it does not assess sleep quality.", type: "number", suffix: "hours", min: 0.1, max: 24, step: 0.1 },
  { key: "activityLevel", title: "How active are you on a typical day?", copy: "Used only for a rough daily energy-expenditure estimate. Choose the closest description.", type: "options", options: [
    { value: "sedentary", label: "Sedentary", detail: "Mostly sitting, little planned exercise" },
    { value: "light", label: "Lightly active", detail: "Light exercise or walking 1–3 days/week" },
    { value: "moderate", label: "Moderately active", detail: "Moderate activity 3–5 days/week" },
    { value: "veryActive", label: "Very active", detail: "Hard exercise or physical work most days" },
    { value: "extraActive", label: "Extra active", detail: "Very hard training or physical work" },
  ] },
  { key: "equationOffset", title: "Which resting-energy equation should we use?", copy: "Mifflin–St Jeor uses a sex-specific constant. Choose the equation constant that best fits, or skip it. This choice is only used for the estimate.", type: "options", options: [
    { value: "5", label: "Male coefficient", detail: "Equation constant: +5" },
    { value: "-161", label: "Female coefficient", detail: "Equation constant: −161" },
    { value: "-78", label: "Midpoint coefficient", detail: "Equation constant: −78; an approximate midpoint, not a validated individual equation" },
  ] },
];

const ACTIVITY_LABELS = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  veryActive: "Very active",
  extraActive: "Extra active",
};

function icon(name, size = 18) {
  const paths = {
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    ruler: '<path d="m3 17 14-14 4 4L7 21H3z"/><path d="m14 6 4 4M11 9l2 2M8 12l2 2M5 15l2 2"/>',
    sparkles: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    scale: '<path d="M12 3v18M5 7h14M7 7l-4 6h8L7 7Zm10 0-4 6h8l-4-6ZM5 21h14"/>',
    heart: '<path d="M20.8 8.8c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.8 2.3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ruler2: '<path d="M4 4h16v16H4z"/><path d="M8 4v4m4-4v2m4-2v4m-8 10v-4m4 4v-2m4 2v-4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    chart: '<path d="M3 3v18h18M7 14l4-4 4 3 5-7"/>',
    heartPulse: '<path d="M20.8 8.8c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.8 2.3Z"/><path d="M7 12h3l1.5-3 2.2 6 1.3-3H18"/>',
    fileDown: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 12v6m-3-3 3 3 3-3"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  };
  const body = paths[name] || paths.info;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function todayISO() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}
function formatDate(dateString, options = { year: "numeric", month: "short", day: "numeric" }) {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat(undefined, options).format(date);
}
function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(value);
}
function kgToDisplay(value) { return data.preferences.units === "imperial" ? value * 2.2046226218 : value; }
function cmToDisplay(value) { return data.preferences.units === "imperial" ? value / 2.54 : value; }
function unitWeight() { return data.preferences.units === "imperial" ? "lb" : "kg"; }
function unitLength() { return data.preferences.units === "imperial" ? "in" : "cm"; }
function displayWeight(value, decimals = 1) { return `${formatNumber(kgToDisplay(value), decimals)} ${unitWeight()}`; }
function displayLength(value, decimals = 1) { return `${formatNumber(cmToDisplay(value), decimals)} ${unitLength()}`; }
function sortedDesc(entries = data.entries) { return sortEntries(entries, "desc"); }
function latestWith(key) { return sortedDesc().find((entry) => Number.isFinite(entry[key])); }
function latestWithPair(first, second) { return sortedDesc().find((entry) => Number.isFinite(entry[first]) && Number.isFinite(entry[second])); }
function currentMetrics() {
  const weight = latestWith("weightKg");
  const waist = latestWith("waistCm");
  const waistHip = latestWithPair("waistCm", "hipCm");
  const bp = latestWithPair("systolic", "diastolic");
  const joined = {
    weightKg: weight?.weightKg,
    waistCm: waist?.waistCm,
    hipCm: waistHip?.hipCm,
    systolic: bp?.systolic,
    diastolic: bp?.diastolic,
  };
  const bmi = calculateBMI(joined.weightKg, data.profile.heightCm);
  const whtr = calculateWaistHeightRatio(joined.waistCm, data.profile.heightCm);
  const bmr = calculateBMR(joined.weightKg, data.profile.heightCm, data.profile.age, data.profile.equationOffset);
  return {
    weight, waist, waistHip, bp,
    bmi,
    bmiCategory: classifyAdultBMI(bmi, data.profile.age),
    whtr,
    whtrCategory: classifyWaistHeightRatio(whtr, data.profile.age, bmi),
    whr: calculateWaistHipRatio(joined.waistCm, joined.hipCm),
    bmr,
    tdee: calculateTDEE(bmr, data.profile.activityLevel),
    bsa: calculateBodySurfaceArea(joined.weightKg, data.profile.heightCm),
    pulse: bp ? calculatePulsePressure(bp.systolic, bp.diastolic) : null,
    map: bp ? calculateMeanArterialPressure(bp.systolic, bp.diastolic) : null,
    heartRate: latestWith("restingHeartRate"),
    sleep: latestWith("sleepHours"),
    exercise: latestWith("exerciseMinutes"),
  };
}
function dateLabel(date) { return formatDate(date, { month: "short", day: "numeric" }); }
function entryValues(entry) {
  const bp = Number.isFinite(entry.systolic) || Number.isFinite(entry.diastolic)
    ? `${Number.isFinite(entry.systolic) ? `${Math.round(entry.systolic)}` : "—"}/${Number.isFinite(entry.diastolic) ? `${Math.round(entry.diastolic)}` : "—"}`
    : "—";
  return {
    weight: Number.isFinite(entry.weightKg) ? displayWeight(entry.weightKg) : "—",
    waist: Number.isFinite(entry.waistCm) ? displayLength(entry.waistCm) : "—",
    hip: Number.isFinite(entry.hipCm) ? displayLength(entry.hipCm) : "—",
    bp,
    hr: Number.isFinite(entry.restingHeartRate) ? `${Math.round(entry.restingHeartRate)} bpm` : "—",
    sleep: Number.isFinite(entry.sleepHours) ? `${formatNumber(entry.sleepHours)} h` : "—",
    exercise: Number.isFinite(entry.exerciseMinutes) ? `${formatNumber(entry.exerciseMinutes, 0)} min` : "—",
  };
}
function notify(message, type = "success") {
  state.toast = { message, type };
  render();
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    state.toast = null;
    const toast = root.querySelector(".toast");
    if (toast) toast.remove();
  }, 3000);
}
function applyTheme() {
  document.documentElement.dataset.theme = "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#ffffff");
}

function renderWorkspaceNav() {
  return `<nav class="workspace-nav" aria-label="Workspace sections">${WORKSPACE_SECTIONS.map(([id, label]) => `<a class="workspace-nav-link" href="#${id}" data-scroll-to="${id}">${label}</a>`).join("")}</nav>`;
}
function renderAppShell() {
  root.innerHTML = `<main class="workspace-shell"><header class="workspace-topbar"><div class="workspace-heading"><h1>Workspace</h1><p>Your measurements, calculations, insights, and report in one place.</p></div><button class="btn" type="button" data-action="reset-onboarding">${icon("refresh", 15)} Reset</button></header>${renderWorkspaceNav()}<div class="page-content workspace-content">${renderWorkspace()}</div></main>${state.toast ? `<div class="toast ${state.toast.type === "error" ? "error" : ""}" role="status">${esc(state.toast.message)}</div>` : ""}`;
  drawCharts();
}

function renderWorkspace() {
  return `<section class="workspace-section" id="overview" aria-labelledby="overview-title">${renderOverview()}</section>
    <section class="workspace-section" id="measurements" aria-labelledby="measurements-title">${renderMeasurements()}</section>
    <section class="workspace-section" id="insights" aria-labelledby="insights-title">${renderInsights()}</section>
    <section class="workspace-section" id="reports" aria-labelledby="reports-title">${renderReports()}</section>`;
}

function pageHeading(title, description, action = "") {
  const id = ({ Overview: "overview-title", Measurements: "measurements-title", Insights: "insights-title", Reports: "reports-title" })[title] || "";
  return `<div class="page-heading"><div><h2 ${id ? `id="${id}"` : ""}>${title}</h2><p>${description}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
}
function metricCard({ title, value, unit = "", note = "", iconName = "activity", badge = "" }) {
  const shown = value === null || value === undefined ? "—" : value;
  return `<article class="card metric-card"><div class="metric-head"><span>${title}</span><span class="metric-icon">${icon(iconName, 16)}</span></div><div class="metric-value">${shown}${unit ? ` <span class="metric-unit">${unit}</span>` : ""}</div><div class="metric-foot">${badge || note}</div></article>`;
}
function emptyState(title, copy, action = "") {
  return `<div class="empty-state"><div class="empty-icon">${icon("chart", 19)}</div><h3>${title}</h3><p>${copy}</p>${action}</div>`;
}
function renderOverview() {
  const m = currentMetrics();
  const cards = [];
  if (Number.isFinite(m.bmi)) cards.push(metricCard({ title: "Body mass index", value: formatNumber(m.bmi, 1), note: m.bmiCategory ? m.bmiCategory.label : "Value only · adult category not shown", iconName: "activity", badge: m.bmiCategory ? `<span class="pill ${m.bmiCategory.tone}">${esc(m.bmiCategory.label)}</span>` : `<span class="pill">Screening measure</span>` }));
  if (Number.isFinite(m.whtr)) cards.push(metricCard({ title: "Waist-to-height ratio", value: formatNumber(m.whtr, 2), note: m.whtrCategory ? m.whtrCategory.label : "Ratio calculated · interpretation not applied", iconName: "ruler2", badge: m.whtrCategory ? `<span class="pill ${m.whtrCategory.tone}">${esc(m.whtrCategory.label)}</span>` : `<span class="pill">Context required</span>` }));
  if (Number.isFinite(m.whr)) cards.push(metricCard({ title: "Waist-to-hip ratio", value: formatNumber(m.whr, 2), note: "Calculated from a paired waist and hip entry", iconName: "ruler" }));
  if (Number.isFinite(m.bmr)) cards.push(metricCard({ title: "Resting energy estimate", value: formatNumber(m.bmr, 0), unit: "kcal/day", note: "Mifflin–St Jeor estimate", iconName: "activity" }));
  if (Number.isFinite(m.tdee)) cards.push(metricCard({ title: "Daily energy estimate", value: formatNumber(m.tdee, 0), unit: "kcal/day", note: `Estimated using ${ACTIVITY_LABELS[data.profile.activityLevel].toLowerCase()} activity`, iconName: "chart" }));
  if (Number.isFinite(m.bsa)) cards.push(metricCard({ title: "Body surface area", value: formatNumber(m.bsa, 2), unit: "m²", note: "Mosteller estimate", iconName: "ruler2" }));
  if (Number.isFinite(m.pulse)) cards.push(metricCard({ title: "Pulse pressure", value: formatNumber(m.pulse, 0), unit: "mmHg", note: `From ${formatDate(m.bp.date)}`, iconName: "heart" }));
  if (Number.isFinite(m.map)) cards.push(metricCard({ title: "Mean arterial pressure", value: formatNumber(m.map, 0), unit: "mmHg", note: `Estimated from ${formatDate(m.bp.date)}`, iconName: "heartPulse" }));

  const latestRows = [];
  if (m.weight) latestRows.push(["Weight", displayWeight(m.weight.weightKg), formatDate(m.weight.date)]);
  if (m.waist) latestRows.push(["Waist", displayLength(m.waist.waistCm), formatDate(m.waist.date)]);
  if (m.bp) latestRows.push(["Blood pressure", `${Math.round(m.bp.systolic)}/${Math.round(m.bp.diastolic)} mmHg`, formatDate(m.bp.date)]);
  if (m.heartRate) latestRows.push(["Resting heart rate", `${Math.round(m.heartRate.restingHeartRate)} bpm`, formatDate(m.heartRate.date)]);
  if (m.sleep) latestRows.push(["Sleep duration", `${formatNumber(m.sleep.sleepHours)} hours`, formatDate(m.sleep.date)]);
  if (m.exercise) latestRows.push(["Exercise duration", `${formatNumber(m.exercise.exerciseMinutes, 0)} minutes`, formatDate(m.exercise.date)]);

  return `${pageHeading("Overview", "A clear summary of the measurements and calculations supported by your data.")}
    <div class="grid grid-4">${cards.length ? cards.join("") : `<div class="card" style="grid-column:1/-1">${emptyState("No calculations available yet", "Your overview will show results as soon as the information needed for a calculation is entered during onboarding.")}</div>`}</div>
    <div class="section-heading"><div><h2>Latest recorded values</h2><p>Only measurements entered during setup are shown.</p></div><span class="pill">${latestRows.length} available</span></div>
    ${latestRows.length ? `<div class="table-wrap"><table><thead><tr><th>Measurement</th><th>Latest value</th><th>Recorded</th></tr></thead><tbody>${latestRows.map(([name, value, date]) => `<tr><td><strong>${name}</strong></td><td>${value}</td><td>${date}</td></tr>`).join("")}</tbody></table></div>` : emptyState("No measurements recorded", "No measurement values were entered during onboarding.")}
    <div class="callout" style="margin-top:18px">${icon("info", 15)}<div><strong>Not a medical assessment.</strong> These calculations are estimates and screening measures. They cannot diagnose a condition or replace advice from a qualified health professional.</div></div>`;
}

function chartData() {
  const entries = sortEntries(data.entries, "asc");
  const charts = [];
  const weight = entries.filter((e) => Number.isFinite(e.weightKg));
  if (weight.length >= 2) charts.push({ id: "weight", title: "Weight history", subtitle: `${weight.length} recorded measurements`, unit: unitWeight(), series: [{ key: "value", label: "Weight", tone: "primary" }], points: weight.map((e) => ({ date: e.date, value: kgToDisplay(e.weightKg) })) });
  const bp = entries.filter((e) => Number.isFinite(e.systolic) && Number.isFinite(e.diastolic));
  if (bp.length >= 2) charts.push({ id: "bp", title: "Blood pressure history", subtitle: `${bp.length} complete paired readings`, unit: "mmHg", series: [{ key: "systolic", label: "Systolic", tone: "primary" }, { key: "diastolic", label: "Diastolic", tone: "secondary" }], points: bp.map((e) => ({ date: e.date, systolic: e.systolic, diastolic: e.diastolic })) });
  const hr = entries.filter((e) => Number.isFinite(e.restingHeartRate));
  if (hr.length >= 2) charts.push({ id: "heart-rate", title: "Resting heart rate", subtitle: `${hr.length} recorded measurements`, unit: "bpm", series: [{ key: "value", label: "Resting heart rate", tone: "primary" }], points: hr.map((e) => ({ date: e.date, value: e.restingHeartRate })) });
  const sleep = entries.filter((e) => Number.isFinite(e.sleepHours));
  if (sleep.length >= 2) charts.push({ id: "sleep", title: "Sleep duration", subtitle: `${sleep.length} recorded measurements`, unit: "hours", series: [{ key: "value", label: "Sleep duration", tone: "primary" }], points: sleep.map((e) => ({ date: e.date, value: e.sleepHours })) });
  const waist = entries.filter((e) => Number.isFinite(e.waistCm));
  if (waist.length >= 2) charts.push({ id: "waist", title: "Waist history", subtitle: `${waist.length} recorded measurements`, unit: unitLength(), series: [{ key: "value", label: "Waist", tone: "primary" }], points: waist.map((e) => ({ date: e.date, value: cmToDisplay(e.waistCm) })) });
  const exercise = entries.filter((e) => Number.isFinite(e.exerciseMinutes));
  if (exercise.length >= 2) charts.push({ id: "exercise", title: "Exercise duration", subtitle: `${exercise.length} recorded measurements`, unit: "minutes", series: [{ key: "value", label: "Exercise duration", tone: "primary" }], points: exercise.map((e) => ({ date: e.date, value: e.exerciseMinutes })) });
  return charts;
}
function chartCard(chart, index) {
  return `<article class="card chart-card"><div class="card-title-row"><div><h3 class="card-title">${esc(chart.title)}</h3><div class="card-description">${esc(chart.subtitle)}</div></div><span class="pill">${esc(chart.unit)}</span></div><div class="chart-wrap" data-chart="${esc(chart.id)}" aria-label="${esc(chart.title)}"></div><div class="chart-legend">${chart.series.map((series) => `<span><i class="legend-dot ${series.tone === "secondary" ? "secondary" : ""}"></i>${esc(series.label)}</span>`).join("")}</div></article>`;
}
function drawCharts() {
  const chartMap = new Map(chartData().map((chart) => [chart.id, chart]));
  root.querySelectorAll("[data-chart]").forEach((container) => {
    const chart = chartMap.get(container.dataset.chart);
    if (!chart) return;
    container.innerHTML = buildChartSvg(chart);
  });
}
function buildChartSvg(chart) {
  const width = 760, height = 220, left = 48, right = 18, top = 13, bottom = 33;
  const plotW = width - left - right, plotH = height - top - bottom;
  const values = chart.points.flatMap((point) => chart.series.map((series) => point[series.key])).filter(Number.isFinite);
  let min = Math.min(...values), max = Math.max(...values);
  if (min === max) { min -= Math.max(1, Math.abs(min) * .08); max += Math.max(1, Math.abs(max) * .08); }
  const pad = (max - min) * .14; min -= pad; max += pad;
  const x = (index) => left + (chart.points.length <= 1 ? plotW / 2 : (index / (chart.points.length - 1)) * plotW);
  const y = (value) => top + ((max - value) / (max - min)) * plotH;
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(chart.title)} chart">`;
  for (let i = 0; i <= 4; i++) {
    const val = max - ((max - min) * i / 4), yy = top + plotH * i / 4;
    svg += `<line class="chart-gridline" x1="${left}" x2="${width - right}" y1="${yy}" y2="${yy}"/><text class="chart-axis-text" x="${left - 9}" y="${yy + 3}" text-anchor="end">${formatNumber(val, 1)}</text>`;
  }
  chart.series.forEach((series) => {
    const coords = chart.points.map((point, i) => Number.isFinite(point[series.key]) ? [x(i), y(point[series.key]), point[series.key], point.date] : null).filter(Boolean);
    const className = series.tone === "secondary" ? "secondary" : "";
    if (coords.length) {
      svg += `<path class="chart-line ${className}" d="${coords.map(([xx, yy], i) => `${i ? "L" : "M"}${xx.toFixed(1)},${yy.toFixed(1)}`).join(" ")}"/>`;
      coords.forEach(([xx, yy, val, date]) => { svg += `<circle class="chart-point ${className}" cx="${xx}" cy="${yy}" r="3.5"><title>${esc(formatDate(date))}: ${formatNumber(val, 1)} ${esc(chart.unit)}</title></circle>`; });
    }
  });
  const maxLabels = 6;
  chart.points.forEach((point, i) => {
    if (chart.points.length > maxLabels && i % Math.ceil(chart.points.length / maxLabels) !== 0 && i !== chart.points.length - 1) return;
    svg += `<text class="chart-axis-text" x="${x(i)}" y="${height - 8}" text-anchor="middle">${esc(dateLabel(point.date))}</text>`;
  });
  svg += "</svg>";
  return svg;
}

function buildInsights() {
  const m = currentMetrics();
  const insights = [];
  if (Number.isFinite(m.bmi)) {
    const text = m.bmiCategory
      ? `Your BMI is ${formatNumber(m.bmi, 1)}. This falls in the “${m.bmiCategory.label.toLowerCase()}” adult screening range. BMI is a screening measure and should be considered alongside other information.`
      : `Your BMI is ${formatNumber(m.bmi, 1)}. An adult BMI category is not shown because your age is missing or below 20; adult cut-offs are not intended for children and younger adolescents.`;
    insights.push({ title: "Body mass index calculated", text, iconName: "activity", badge: m.bmiCategory?.label || "Value only", tone: m.bmiCategory?.tone || "neutral" });
  }
  if (Number.isFinite(m.whtr)) {
    const explanation = m.whtrCategory
      ? `Your waist-to-height ratio is ${formatNumber(m.whtr, 2)}. It is ${m.whtrCategory.label.toLowerCase()}. This screening guide is intended to be used alongside BMI in adults with BMI below 35.`
      : `Your waist-to-height ratio is ${formatNumber(m.whtr, 2)}. A reference interpretation was not applied because the age or BMI conditions for that guidance are not met or are unavailable.`;
    insights.push({ title: "Waist-to-height ratio calculated", text: explanation, iconName: "ruler2", badge: m.whtrCategory?.label || "Context required", tone: m.whtrCategory?.tone || "neutral" });
  }
  if (Number.isFinite(m.whr)) insights.push({ title: "Waist-to-hip ratio calculated", text: `Your recorded waist (${displayLength(m.waistHip.waistCm)}) divided by your recorded hip (${displayLength(m.waistHip.hipCm)}) gives ${formatNumber(m.whr, 2)}. No category is applied because interpretation depends on additional context.`, iconName: "ruler", badge: "Calculated" });
  if (m.bp && Number.isFinite(m.pulse) && Number.isFinite(m.map)) insights.push({ title: "Blood-pressure derivatives calculated", text: `From your paired ${Math.round(m.bp.systolic)}/${Math.round(m.bp.diastolic)} mmHg reading on ${formatDate(m.bp.date)}, pulse pressure is ${formatNumber(m.pulse, 0)} mmHg and estimated mean arterial pressure is ${formatNumber(m.map, 0)} mmHg. These arithmetic values are not a blood-pressure diagnosis or category.`, iconName: "heartPulse", badge: "Calculated" });
  const weights = sortEntries(data.entries).filter((entry) => Number.isFinite(entry.weightKg));
  if (weights.length >= 2) {
    const previous = weights[weights.length - 2], latest = weights[weights.length - 1], diff = latest.weightKg - previous.weightKg;
    const direction = diff > 0 ? "increased" : diff < 0 ? "decreased" : "did not change";
    insights.push({ title: "Weight compared with the previous record", text: `Your most recent recorded weight ${direction} by ${displayWeight(Math.abs(diff))} between ${formatDate(previous.date)} and ${formatDate(latest.date)}. This describes the two entries only; it does not explain the cause.`, iconName: "scale", badge: "Two records" });
  }
  const sleeps = sortEntries(data.entries).filter((entry) => Number.isFinite(entry.sleepHours));
  if (sleeps.length >= 2) {
    const average = sleeps.reduce((sum, entry) => sum + entry.sleepHours, 0) / sleeps.length;
    insights.push({ title: "Recorded sleep average", text: `Across ${sleeps.length} sleep entries, your average recorded duration is ${formatNumber(average, 1)} hours. Duration alone does not measure sleep quality.`, iconName: "clock", badge: "Average of records" });
  }
  const exercises = sortEntries(data.entries).filter((entry) => Number.isFinite(entry.exerciseMinutes));
  if (exercises.length >= 2) {
    const average = exercises.reduce((sum, entry) => sum + entry.exerciseMinutes, 0) / exercises.length;
    insights.push({ title: "Recorded exercise average", text: `Across ${exercises.length} exercise entries, your average recorded duration is ${formatNumber(average, 0)} minutes. This is an average of the entries you chose to record, not necessarily a daily average.`, iconName: "activity", badge: "Average of records" });
  }
  return insights;
}
function renderInsight(item) {
  return `<article class="insight"><div class="insight-mark">${icon(item.iconName || "info", 15)}</div><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>${item.badge ? `<span class="pill ${item.tone || ""}">${esc(item.badge)}</span>` : ""}</div></article>`;
}
function renderMeasurements() {
  const rows = sortedDesc();
  const charts = chartData();
  return `${pageHeading("Measurements", "The information you entered during onboarding, with its recorded date.")}
    <div class="callout" style="margin-bottom:15px">${icon("info", 15)}<div>Height is stored in your profile (${Number.isFinite(data.profile.heightCm) ? displayLength(data.profile.heightCm) : "not entered"}). Other readings are saved as dated entries. To start again with different information, use Reset at the top of this workspace.</div></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>Hip</th><th>BP (mmHg)</th><th>Resting HR</th><th>Sleep</th><th>Exercise</th></tr></thead><tbody>${rows.map((entry) => { const values = entryValues(entry); return `<tr><td><strong>${formatDate(entry.date)}</strong></td><td>${values.weight}</td><td>${values.waist}</td><td>${values.hip}</td><td>${values.bp}</td><td>${values.hr}</td><td>${values.sleep}</td><td>${values.exercise}</td></tr>`; }).join("")}</tbody></table></div><div class="card-description" style="margin-top:10px">${rows.length} record${rows.length === 1 ? "" : "s"} · Newest first</div>` : emptyState("No measurements recorded", "No measurement values were entered during onboarding.")}
    <div class="section-heading"><div><h2>Measurement trends</h2><p>Trend charts appear only when two or more dated readings exist for the same measurement.</p></div></div>
    ${charts.length ? `<div class="grid grid-2">${charts.map(chartCard).join("")}</div>` : `<div class="empty-state compact-empty"><p>There are not enough repeated measurements to create a trend chart. No sample data has been added.</p></div>`}`;
}
function renderInsights() {
  const insights = buildInsights();
  return `${pageHeading("Insights", "Calculations and observations based exclusively on the information you entered.")}
    ${insights.length ? `<div class="insight-list">${insights.map(renderInsight).join("")}</div>` : `<div class="card">${emptyState("No supported insights yet", "Insights appear only when the entered information supports a calculation or comparison. No missing information is assumed.")}</div>`}
    <div class="callout" style="margin-top:18px">${icon("shield", 15)}<div><strong>How insights work.</strong> Each observation identifies the measurement or calculation behind it. The app does not diagnose conditions, produce an overall health score, or infer lifestyle facts you did not enter.</div></div>`;
}

function reportRows() {
  const m = currentMetrics();
  const inputs = [];
  if (Number.isFinite(data.profile.age)) inputs.push(["Age", `${data.profile.age} years`]);
  if (Number.isFinite(data.profile.heightCm)) inputs.push(["Height", displayLength(data.profile.heightCm)]);
  if (m.weight) inputs.push(["Latest weight", displayWeight(m.weight.weightKg) + ` · ${formatDate(m.weight.date)}`]);
  if (m.waist) inputs.push(["Latest waist", displayLength(m.waist.waistCm) + ` · ${formatDate(m.waist.date)}`]);
  if (m.waistHip) inputs.push(["Paired hip measurement", displayLength(m.waistHip.hipCm) + ` · ${formatDate(m.waistHip.date)}`]);
  if (m.bp) inputs.push(["Latest paired blood pressure", `${Math.round(m.bp.systolic)}/${Math.round(m.bp.diastolic)} mmHg · ${formatDate(m.bp.date)}`]);
  if (m.heartRate) inputs.push(["Latest resting heart rate", `${Math.round(m.heartRate.restingHeartRate)} bpm · ${formatDate(m.heartRate.date)}`]);
  if (m.sleep) inputs.push(["Latest sleep duration", `${formatNumber(m.sleep.sleepHours)} hours · ${formatDate(m.sleep.date)}`]);
  if (m.exercise) inputs.push(["Latest exercise duration", `${formatNumber(m.exercise.exerciseMinutes, 0)} minutes · ${formatDate(m.exercise.date)}`]);
  if (data.profile.activityLevel) inputs.push(["Selected activity level", ACTIVITY_LABELS[data.profile.activityLevel]]);
  if (Number.isFinite(data.profile.equationOffset)) inputs.push(["Mifflin–St Jeor equation constant", `${data.profile.equationOffset > 0 ? "+" : ""}${data.profile.equationOffset}`]);
  const calculated = [];
  if (Number.isFinite(m.bmi)) calculated.push(["BMI", `${formatNumber(m.bmi, 1)} kg/m²`, "Weight ÷ height²; screening measure, not diagnosis."]);
  if (Number.isFinite(m.whtr)) calculated.push(["Waist-to-height ratio", formatNumber(m.whtr, 2), "Waist circumference ÷ height."]);
  if (Number.isFinite(m.whr)) calculated.push(["Waist-to-hip ratio", formatNumber(m.whr, 2), "Paired waist circumference ÷ hip circumference."]);
  if (Number.isFinite(m.bmr)) calculated.push(["Resting energy expenditure estimate", `${formatNumber(m.bmr, 0)} kcal/day`, "Mifflin–St Jeor prediction; not a measured metabolic rate."]);
  if (Number.isFinite(m.tdee)) calculated.push(["Daily energy expenditure estimate", `${formatNumber(m.tdee, 0)} kcal/day`, "Resting estimate multiplied by the selected activity factor."]);
  if (Number.isFinite(m.bsa)) calculated.push(["Body surface area", `${formatNumber(m.bsa, 2)} m²`, "Mosteller formula."]);
  if (Number.isFinite(m.pulse)) calculated.push(["Pulse pressure", `${formatNumber(m.pulse, 0)} mmHg`, "Systolic minus diastolic pressure from one paired record."]);
  if (Number.isFinite(m.map)) calculated.push(["Mean arterial pressure estimate", `${formatNumber(m.map, 0)} mmHg`, "(Systolic + 2 × diastolic) ÷ 3 from one paired record."]);
  return { inputs, calculated, insights: buildInsights() };
}
function renderReportDocument() {
  const report = reportRows();
  const rows = (items) => items.length ? items.map(([name, value, note]) => `<div class="report-row"><span>${esc(name)}${note ? `<small class="report-note" style="display:block">${esc(note)}</small>` : ""}</span><strong>${esc(value)}</strong></div>`).join("") : `<p class="report-note">No supported information has been recorded for this section.</p>`;
  return `<article class="card report-document"><h1 class="report-title">Personal health summary</h1><p class="report-meta">Generated ${formatDate(todayISO())} · ${data.entries.length} dated measurement record${data.entries.length === 1 ? "" : "s"}</p>
    <div class="report-section"><h3>Recorded profile and measurements</h3>${rows(report.inputs)}</div>
    <div class="report-section"><h3>Available calculations</h3>${rows(report.calculated)}</div>
    <div class="report-section"><h3>Data-backed observations</h3>${report.insights.length ? report.insights.map((item) => `<div class="report-row"><span><strong>${esc(item.title)}</strong><small class="report-note" style="display:block">${esc(item.text)}</small></span></div>`).join("") : `<p class="report-note">No observations can be generated from the information currently recorded.</p>`}</div>
    <div class="report-section"><h3>Important limitations</h3><p class="report-note">This report is a personal calculation summary, not a medical record or diagnosis. Estimates depend on the accuracy of the information entered and may not reflect an individual's measured physiology. BMI and waist ratios are screening measures. Energy expenditure is predicted, not measured. Discuss health concerns and medical decisions with a qualified health professional. Missing measurements are intentionally left blank.</p></div>
  </article>`;
}
function renderReports() {
  return `${pageHeading("Reports", "Review, print, or save a summary containing only the data you have entered.", `<div class="report-actions"><button class="btn" data-action="download-report">${icon("download", 14)} Download text</button><button class="btn btn-primary" data-action="print-report">${icon("fileDown", 14)} Print / save PDF</button></div>`)}${renderReportDocument()}`;
}

function renderWizard() {
  const step = WIZARD_STEPS[state.wizardIndex];
  const progress = ((state.wizardIndex + 1) / WIZARD_STEPS.length) * 100;
  let control = "";
  if (step.key === "units") {
    control = `<div class="option-list">${step.options.map((option) => `<button type="button" class="option-card ${state.tempUnits === option.value ? "selected" : ""}" data-wizard-option="${option.value}"><span class="option-radio"></span><span><strong>${option.label}</strong><small>${option.detail}</small></span></button>`).join("")}</div>`;
  } else if (step.type === "options") {
    control = `<div class="option-list">${step.options.map((option) => `<button type="button" class="option-card ${state.wizardValue === option.value ? "selected" : ""}" data-wizard-option="${option.value}"><span class="option-radio"></span><span><strong>${esc(option.label)}</strong><small>${esc(option.detail)}</small></span></button>`).join("")}</div>`;
  } else {
    const imperial = state.tempUnits === "imperial";
    const suffix = step.suffix || (imperial ? step.suffixImperial : step.suffixMetric);
    const min = imperial ? (step.minImperial ?? step.min) : (step.minMetric ?? step.min);
    const max = imperial ? (step.maxImperial ?? step.max) : (step.maxMetric ?? step.max);
    control = `<div class="wizard-input-wrap"><input class="input wizard-input" id="wizard-input" name="wizardValue" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step.step}" data-min="${min}" data-max="${max}" data-step="${step.step}" placeholder="Enter value" value="${esc(state.wizardValue)}" autocomplete="off"/><div class="number-stepper-group" role="group" aria-label="Adjust ${esc(step.title.toLowerCase())}"><button class="number-stepper-btn" type="button" data-stepper="-1" aria-label="Decrease value">−</button><button class="number-stepper-btn" type="button" data-stepper="1" aria-label="Increase value">+</button></div><span class="wizard-suffix">${suffix}</span></div>`;
  }
  root.innerHTML = `<main class="wizard-shell wizard-shell-simple"><div class="wizard-main"><div class="wizard-panel"><div class="wizard-top"><span>YOUR HEALTH PROFILE</span><span>Step ${state.wizardIndex + 1} of ${WIZARD_STEPS.length}</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><h2>${esc(step.title)}</h2><p class="wizard-copy">${esc(step.copy)}</p>${control}${state.wizardError ? `<div class="wizard-error" role="alert">${esc(state.wizardError)}</div>` : ""}<div class="wizard-actions"><button class="btn btn-ghost" type="button" data-action="wizard-back" ${state.wizardIndex === 0 ? "disabled" : ""}>${icon("back", 14)} Back</button><div class="wizard-actions-right">${step.optional === false ? "" : `<button class="btn" type="button" data-action="wizard-skip">Skip</button>`}<button class="btn btn-primary" type="button" data-action="wizard-next">${state.wizardIndex === WIZARD_STEPS.length - 1 ? "Finish setup" : "Continue"} ${icon("arrow", 14)}</button></div></div><p class="card-description" style="margin-top:28px">Skip optional questions and continue with the information you have.</p></div></div></main>`;
  const input = root.querySelector("#wizard-input");
  if (input) input.focus({ preventScroll: true });
}

function wizardCurrentValue() {
  const step = WIZARD_STEPS[state.wizardIndex];
  return step.key === "units" ? state.tempUnits : state.wizardValue;
}
function validateWizardStep() {
  const step = WIZARD_STEPS[state.wizardIndex];
  const raw = wizardCurrentValue();
  if (!raw) return "";
  if (step.type === "number") {
    const number = Number(raw);
    const imperial = state.tempUnits === "imperial";
    const min = imperial ? (step.minImperial ?? step.min) : (step.minMetric ?? step.min);
    const max = imperial ? (step.maxImperial ?? step.max) : (step.maxMetric ?? step.max);
    if (!Number.isFinite(number) || number < min || number > max) return `Enter a value between ${min} and ${max} ${step.suffix || (imperial ? step.suffixImperial : step.suffixMetric)}.`;
  }
  if (step.key === "age" && !Number.isInteger(Number(raw))) return "Enter age as a whole number of years.";
  return "";
}
function collectWizardAnswer(skip = false) {
  const step = WIZARD_STEPS[state.wizardIndex];
  if (step.key === "units") {
    data.preferences.units = state.tempUnits;
    return;
  }
  if (skip || !state.wizardValue) {
    delete state.wizardAnswers[step.key];
    return;
  }
  const raw = state.wizardValue;
  if (step.type === "number") {
    const number = Number(raw);
    const imperial = state.tempUnits === "imperial";
    let value = number;
    if (step.key === "height" || step.key === "waist" || step.key === "hip") value = imperial ? number * 2.54 : number;
    if (step.key === "weight") value = imperial ? number / 2.2046226218 : number;
    state.wizardAnswers[step.key] = value;
  } else {
    state.wizardAnswers[step.key] = raw;
  }
}
function wizardBack() {
  if (state.wizardIndex <= 0) return;
  state.wizardIndex -= 1;
  state.wizardError = "";
  const step = WIZARD_STEPS[state.wizardIndex];
  const saved = state.wizardAnswers[step.key];
  if (step.key === "height" || step.key === "waist" || step.key === "hip") {
    state.wizardValue = Number.isFinite(saved) ? String(formatNumber(cmToDisplay(saved), 1)) : "";
  } else if (step.key === "weight") {
    state.wizardValue = Number.isFinite(saved) ? String(formatNumber(kgToDisplay(saved), 1)) : "";
  } else {
    state.wizardValue = saved === undefined ? "" : String(saved);
  }
  renderWizard();
}

function wizardNext(skip = false) {
  if (!skip) {
    const error = validateWizardStep();
    if (error) { state.wizardError = error; renderWizard(); return; }
  }
  collectWizardAnswer(skip);
  state.wizardError = "";
  state.wizardValue = "";
  if (state.wizardIndex < WIZARD_STEPS.length - 1) {
    state.wizardIndex += 1;
    renderWizard();
    return;
  }
  finishWizard();
}
function finishWizard() {
  const answers = state.wizardAnswers;
  data.preferences.units = state.tempUnits;
  if (Number.isFinite(answers.age)) data.profile.age = answers.age;
  if (Number.isFinite(answers.height)) data.profile.heightCm = answers.height;
  if (answers.activityLevel) data.profile.activityLevel = answers.activityLevel;
  if (answers.equationOffset !== undefined) data.profile.equationOffset = Number(answers.equationOffset);
  const entry = { id: createId(), date: todayISO(), createdAt: new Date().toISOString() };
  const mapping = { weight: "weightKg", waist: "waistCm", hip: "hipCm", systolic: "systolic", diastolic: "diastolic", restingHeartRate: "restingHeartRate", sleepHours: "sleepHours" };
  for (const [source, target] of Object.entries(mapping)) if (Number.isFinite(answers[source])) entry[target] = answers[source];
  if (Object.keys(entry).length > 3) data.entries.push(entry);
  data.onboardingComplete = true;
  saveData(data);
  applyTheme();
  state.wizardAnswers = {};
  state.wizardIndex = 0;
  notify("Your health workspace is ready.");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function downloadReport() {
  const report = reportRows();
  const lines = [
    "HEALTH WORKSPACE — PERSONAL HEALTH SUMMARY",
    `Generated: ${formatDate(todayISO())}`,
    `Measurement records: ${data.entries.length}`,
    "",
    "RECORDED PROFILE AND MEASUREMENTS",
    ...(report.inputs.length ? report.inputs.map(([name, value]) => `${name}: ${value}`) : ["No profile or measurement values recorded."]),
    "",
    "AVAILABLE CALCULATIONS",
    ...(report.calculated.length ? report.calculated.map(([name, value, note]) => `${name}: ${value}${note ? ` — ${note}` : ""}`) : ["No calculations are currently available."]),
    "",
    "DATA-BACKED OBSERVATIONS",
    ...(report.insights.length ? report.insights.map((item) => `${item.title}: ${item.text}`) : ["No observations can be generated from the current data."]),
    "",
    "LIMITATIONS",
    "This summary is not a medical record or diagnosis. Calculations are estimates and screening measures. Missing measurements are intentionally left blank. Discuss medical decisions with a qualified health professional.",
  ];
  downloadFile(`health-workspace-report-${todayISO()}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
  notify("Text report exported");
}

function handleClick(event) {
  const stepper = event.target.closest("[data-stepper]");
  if (stepper) {
    const input = root.querySelector("#wizard-input");
    if (!input) return;
    const min = Number(input.dataset.min);
    const max = Number(input.dataset.max);
    const step = Number(input.dataset.step);
    const current = input.value === "" ? min : Number(input.value);
    const next = Math.min(max, Math.max(min, current + Number(stepper.dataset.stepper) * step));
    const decimals = (String(step).split(".")[1] || "").length;
    state.wizardValue = String(Number(next.toFixed(decimals)));
    state.wizardError = "";
    renderWizard();
    return;
  }
  const scrollTarget = event.target.closest("[data-scroll-to]");
  if (scrollTarget) {
    event.preventDefault();
    root.querySelector(`#${scrollTarget.dataset.scrollTo}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const option = event.target.closest("[data-wizard-option]");
  if (option) {
    const value = option.dataset.wizardOption;
    const step = WIZARD_STEPS[state.wizardIndex];
    if (step.key === "units") state.tempUnits = value;
    else state.wizardValue = value;
    state.wizardError = "";
    renderWizard();
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  switch (action) {
    case "wizard-back": wizardBack(); break;
    case "wizard-next": wizardNext(false); break;
    case "wizard-skip": wizardNext(true); break;
    case "download-report": downloadReport(); break;
    case "print-report": window.print(); break;
    case "reset-onboarding": {
      if (window.confirm("Reset your workspace and clear the information saved in this browser? You will return to the first onboarding question.")) {
        data = createDefaultData();
        saveData(data);
        state = { wizardIndex: 0, wizardAnswers: {}, wizardValue: "", wizardError: "", tempUnits: "metric", toast: null };
        applyTheme();
        renderWizard();
      }
      break;
    }
    default: break;
  }
}

function handleInput(event) {
  if (event.target.id === "wizard-input") {
    state.wizardValue = event.target.value;
    state.wizardError = "";
  }
}

function render() {
  applyTheme();
  if (!data.onboardingComplete) renderWizard();
  else renderAppShell();
}

root.addEventListener("click", handleClick);
root.addEventListener("input", handleInput);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !data.onboardingComplete && event.target?.id === "wizard-input") {
    event.preventDefault();
    wizardNext(false);
  }
});
applyTheme();
render();
