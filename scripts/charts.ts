/**
 * Render the report charts as standalone SVGs into results/charts/ from the recorded runs.
 * Light and dark themes follow the viewer's system setting; every mark has a native tooltip.
 *
 *   pnpm charts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { calibration, perService, type RunRecord } from "../src/bench/metrics.js";
import { readRun } from "../src/bench/runner.js";
import { trainSample } from "../src/bench/sample.js";
import { ACTION_BY_INTENT } from "../src/catalog/actions.js";
import { SERVICES } from "../src/catalog/services.js";
import { loadSplit } from "../src/data/banking77.js";
import { STAGES } from "../src/routers/rules/stages.js";
import { RulesRouter } from "../src/routers/rules.js";

const OUT = "results/charts";
const W = 720;
const H = 420;
const M = { top: 56, right: 150, bottom: 56, left: 64 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

/** Entity colours are fixed across every chart (validated, see dataviz palette). */
const STYLE = `<style>
  svg { --surface:#fcfcfb; --ink:#0b0b0b; --ink2:#52514e; --muted:#898781; --grid:#e1e0d9;
        --jev:#2a78d6; --rules:#eb6834; --hybrid:#1baf7a; --llm:#eda100; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  @media (prefers-color-scheme: dark) {
    svg { --surface:#1a1a19; --ink:#f0efec; --ink2:#c3c2b7; --muted:#898781; --grid:#2c2c2a;
          --jev:#3987e5; --rules:#d95926; --hybrid:#199e70; --llm:#c98500; }
  }
  .bg { fill: var(--surface); } .title { fill: var(--ink); font-size: 16px; font-weight: 600; }
  .sub { fill: var(--ink2); font-size: 12px; } .tick { fill: var(--muted); font-size: 11px; }
  .axis { fill: var(--ink2); font-size: 12px; } .grid { stroke: var(--grid); stroke-width: 1; }
  .label { fill: var(--ink); font-size: 12px; font-weight: 600; } .note { fill: var(--ink2); font-size: 11px; }
  .ref { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4; fill: none; }
</style>`;

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

interface Axis {
  min: number;
  max: number;
  ticks: number[];
  fmt: (v: number) => string;
  title: string;
}

function frame(title: string, subtitle: string, x: Axis, y: Axis, body: string): string {
  const sx = (v: number) => M.left + ((v - x.min) / (x.max - x.min)) * PW;
  const sy = (v: number) => M.top + PH - ((v - y.min) / (y.max - y.min)) * PH;
  const grid = y.ticks
    .map(
      (t) =>
        `<line class="grid" x1="${M.left}" x2="${M.left + PW}" y1="${sy(t)}" y2="${sy(t)}"/>` +
        `<text class="tick" x="${M.left - 8}" y="${sy(t) + 4}" text-anchor="end">${y.fmt(t)}</text>`,
    )
    .join("");
  const xt = x.ticks
    .map(
      (t) => `<text class="tick" x="${sx(t)}" y="${M.top + PH + 18}" text-anchor="middle">${x.fmt(t)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
${STYLE}<rect class="bg" width="${W}" height="${H}" rx="8"/>
<text class="title" x="${M.left}" y="26">${esc(title)}</text><text class="sub" x="${M.left}" y="44">${esc(subtitle)}</text>
${grid}${xt}
<text class="axis" x="${M.left + PW / 2}" y="${H - 14}" text-anchor="middle">${esc(x.title)}</text>
<text class="axis" transform="translate(16 ${M.top + PH / 2}) rotate(-90)" text-anchor="middle">${esc(y.title)}</text>
${body}</svg>\n`;
}

const scaler = (x: Axis, y: Axis) => ({
  sx: (v: number) => M.left + ((v - x.min) / (x.max - x.min)) * PW,
  sy: (v: number) => M.top + PH - ((v - y.min) / (y.max - y.min)) * PH,
});

const dot = (cx: number, cy: number, color: string, tip: string, r = 5) =>
  `<g><circle cx="${cx}" cy="${cy}" r="12" fill="transparent"><title>${esc(tip)}</title></circle>` +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(${color})" stroke="var(--surface)" stroke-width="2" pointer-events="none"/></g>`;

const isCorrect = (r: RunRecord) => r.action !== null && r.action === ACTION_BY_INTENT.get(r.goldIntent)?.id;

// 1. Rules effort curve vs JEV (held-out train sample)
async function effortChart(): Promise<string> {
  const heldOut = trainSample(loadSplit("train"), "heldout");
  const { logicalLines } = await import("./count-loc.js");
  const { readFileSync } = await import("node:fs");
  const loc = (p: string) => logicalLines(readFileSync(`src/routers/${p}`, "utf8"));
  let lines = loc("rules.ts") + loc("rules/rule.ts") + loc("rules/stages.ts");
  const points: { lines: number; acc: number; stage: number }[] = [];
  for (let k = 1; k <= STAGES.length; k++) {
    lines += loc(`rules/stage${k}.ts`);
    const router = new RulesRouter(k);
    let ok = 0;
    for (const e of heldOut)
      if ((await router.route(e.text)).action === ACTION_BY_INTENT.get(e.intent)?.id) ok++;
    points.push({ lines, acc: ok / heldOut.length, stage: k });
  }
  const jevRuns = readRun("results/raw/jev_train_1000.jsonl");
  const jev = { lines: loc("jev.ts"), acc: jevRuns.filter(isCorrect).length / jevRuns.length };
  const x: Axis = {
    min: 0,
    max: 900,
    ticks: [0, 150, 300, 450, 600, 750, 900],
    fmt: String,
    title: "Lines of dispatcher code",
  };
  const y: Axis = {
    min: 0.3,
    max: 0.9,
    ticks: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "Exact action accuracy",
  };
  const { sx, sy } = scaler(x, y);
  const path = points.map((p, i) => `${i ? "L" : "M"}${sx(p.lines)},${sy(p.acc)}`).join(" ");
  const last = points.at(-1) ?? points[0];
  const body =
    `<path d="${path}" fill="none" stroke="var(--rules)" stroke-width="2" stroke-linejoin="round"/>` +
    points
      .map((p) =>
        dot(
          sx(p.lines),
          sy(p.acc),
          "--rules",
          `Rules after stage ${p.stage}: ${p.lines} lines, ${pct(p.acc)}`,
        ),
      )
      .join("") +
    dot(sx(jev.lines), sy(jev.acc), "--jev", `JEV: ${jev.lines} lines, ${pct(jev.acc)}`, 6) +
    `<text class="label" x="${sx(last?.lines ?? 0) + 10}" y="${sy(last?.acc ?? 0) + 4}">Rules ${pct(last?.acc ?? 0)}</text>` +
    `<text class="note" x="${sx(last?.lines ?? 0) + 10}" y="${sy(last?.acc ?? 0) + 18}">8 stages, ${last?.lines} lines</text>` +
    `<text class="label" x="${sx(jev.lines) + 12}" y="${sy(jev.acc) - 8}">JEV ${pct(jev.acc)}, ${jev.lines} lines</text>`;
  return frame(
    "More rule-writing stopped paying off; JEV started higher",
    "Exact action accuracy on 1,000 held-out Banking77 messages, by lines of router code",
    x,
    y,
    body,
  );
}

// 2. Accuracy vs human workload (test split)
function tradeoffChart(): string {
  const jev = readRun("results/raw/jev_test_3080.jsonl");
  const rules = readRun("results/raw/rules_test_3080.jsonl");
  const hybrid = readRun("results/raw/hybrid_test_3080.jsonl");
  const point = (rs: RunRecord[]) => {
    const answered = rs.filter((r) => r.action !== null);
    return { esc: 1 - answered.length / rs.length, acc: answered.filter(isCorrect).length / answered.length };
  };
  const curve = [0, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99].map((t) => {
    const a = jev.filter((r) => r.action && r.confidence >= t);
    return { t, esc: 1 - a.length / jev.length, acc: a.filter(isCorrect).length / a.length };
  });
  const x: Axis = {
    min: 0,
    max: 0.5,
    ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "Messages referred to a person",
  };
  const y: Axis = {
    min: 0.7,
    max: 1,
    ticks: [0.7, 0.8, 0.9, 1],
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "Accuracy on messages answered automatically",
  };
  const { sx, sy } = scaler(x, y);
  const r = point(rules);
  const h = point(hybrid);
  const path = curve.map((p, i) => `${i ? "L" : "M"}${sx(p.esc)},${sy(p.acc)}`).join(" ");
  const end = curve.at(-1) ?? curve[0];
  const body =
    `<path d="${path}" fill="none" stroke="var(--jev)" stroke-width="2" stroke-linejoin="round"/>` +
    curve
      .map((p) =>
        dot(
          sx(p.esc),
          sy(p.acc),
          "--jev",
          `JEV, act if confidence ≥ ${p.t}: ${pct(p.esc)} to a person, ${pct(p.acc)} right`,
          4,
        ),
      )
      .join("") +
    dot(sx(r.esc), sy(r.acc), "--rules", `Rules: ${pct(r.esc)} to a person, ${pct(r.acc)} right`, 6) +
    dot(sx(h.esc), sy(h.acc), "--hybrid", `Hybrid: ${pct(h.esc)} to a person, ${pct(h.acc)} right`, 6) +
    `<text class="label" x="${sx(r.esc) + 10}" y="${sy(r.acc) + 16}">Rules ${pct(r.acc)}</text>` +
    `<text class="label" x="${sx(h.esc) + 10}" y="${sy(h.acc) - 10}">Hybrid ${pct(h.acc)}</text>` +
    `<text class="label" x="${sx(end?.esc ?? 0) + 10}" y="${sy(end?.acc ?? 0) + 4}">JEV by threshold</text>`;
  return frame(
    "At a similar referral rate, the hybrid answered more accurately than rules",
    "Test split, 3,080 messages. JEV's curve sweeps its threshold on the test split (exploratory)",
    x,
    y,
    body,
  );
}

// 3. JEV calibration (test split)
function calibrationChart(): string {
  const bins = calibration(readRun("results/raw/jev_test_3080.jsonl")).bins.filter((b) => b.count >= 20);
  const ticks = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const x: Axis = {
    min: 0.2,
    max: 1,
    ticks,
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "JEV's stated confidence",
  };
  const y: Axis = {
    min: 0.2,
    max: 1,
    ticks,
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "How often it was actually right",
  };
  const { sx, sy } = scaler(x, y);
  const path = bins.map((b, i) => `${i ? "L" : "M"}${sx(b.meanConfidence)},${sy(b.accuracy)}`).join(" ");
  const top = bins.at(-1);
  const body =
    `<line class="ref" x1="${sx(0.2)}" y1="${sy(0.2)}" x2="${sx(1)}" y2="${sy(1)}"/>` +
    `<text class="note" x="${sx(0.3)}" y="${sy(0.34)}">— — perfectly calibrated</text>` +
    `<path d="${path}" fill="none" stroke="var(--jev)" stroke-width="2" stroke-linejoin="round"/>` +
    bins
      .map((b) =>
        dot(
          sx(b.meanConfidence),
          sy(b.accuracy),
          "--jev",
          `Confidence ${pct(b.lo)}–${pct(b.hi)} (n=${b.count}): stated ${pct(b.meanConfidence)}, right ${pct(b.accuracy)}`,
        ),
      )
      .join("") +
    (top
      ? `<text class="label" x="${sx(top.meanConfidence) - 10}" y="${sy(top.accuracy) + 26}" text-anchor="end">${pct(top.accuracy)} right when ≥90% sure</text>`
      : "");
  return frame(
    "Higher JEV confidence went with higher accuracy, but it was optimistic",
    "Banking77 test split (3,080 messages), confidence bins with at least 20 messages",
    x,
    y,
    body,
  );
}

// 4. Accuracy by service: rules vs JEV (test split)
function servicesChart(): string {
  const rules = perService(readRun("results/raw/rules_test_3080.jsonl"));
  const jev = perService(readRun("results/raw/jev_test_3080.jsonl"));
  const rows = Object.keys(jev).sort((a, b) => (jev[b]?.actionAccuracy ?? 0) - (jev[a]?.actionAccuracy ?? 0));
  const h = 460;
  const top = 76;
  const rowH = (h - top - 46) / rows.length;
  const left = 150;
  const sx = (v: number) => left + ((v - 0.4) / 0.6) * (W - left - 60);
  const ticks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  let body = ticks
    .map(
      (t) =>
        `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="${top - 10}" y2="${h - 40}"/>` +
        `<text class="tick" x="${sx(t)}" y="${h - 24}" text-anchor="middle">${Math.round(t * 100)}%</text>`,
    )
    .join("");
  rows.forEach((s, i) => {
    const cy = top + i * rowH + rowH / 2;
    const r = rules[s]?.actionAccuracy ?? 0;
    const j = jev[s]?.actionAccuracy ?? 0;
    const name = SERVICES[s as keyof typeof SERVICES]?.title ?? s;
    body +=
      `<text class="axis" x="${left - 12}" y="${cy + 4}" text-anchor="end">${esc(name)}</text>` +
      `<line x1="${sx(r)}" x2="${sx(j)}" y1="${cy}" y2="${cy}" stroke="var(--muted)" stroke-width="2"/>` +
      dot(sx(r), cy, "--rules", `${name}, rules: ${pct(r)}`) +
      dot(sx(j), cy, "--jev", `${name}, JEV: ${pct(j)}`);
  });
  body +=
    `<circle cx="${left}" cy="58" r="5" fill="var(--rules)"/><text class="sub" x="${left + 10}" y="62">Rules</text>` +
    `<circle cx="${left + 70}" cy="58" r="5" fill="var(--jev)"/><text class="sub" x="${left + 80}" y="62">JEV</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="Accuracy by service, rules vs JEV">
${STYLE}<rect class="bg" width="${W}" height="${h}" rx="8"/>
<text class="title" x="24" y="26">JEV was more accurate than rules in every service here</text>
<text class="sub" x="24" y="44">Exact action accuracy by microservice, Banking77 test split (3,080 messages)</text>
${body}<text class="axis" x="${(left + W - 60) / 2}" y="${h - 6}" text-anchor="middle">Exact action accuracy</text></svg>\n`;
}

// 5. Accuracy vs speed: rules, JEV and the LLM (test split)
function speedChart(): string {
  const p50 = (rs: RunRecord[]) =>
    [...rs.map((r) => r.wallMs)].sort((a, b) => a - b)[Math.floor(rs.length / 2)] ?? 0;
  const points = (
    [
      ["Rules", "rules", "--rules", "below"],
      ["JEV", "jev", "--jev", "left"],
      ["LLM (gpt-6-luna)", "llm", "--llm", "below"],
    ] as const
  ).map(([label, name, color, place]) => {
    const rs = readRun(`results/raw/${name}_test_3080.jsonl`);
    const cost = (1000 * rs.reduce((sum, r) => sum + r.costUsd, 0)) / rs.length;
    return { label, color, place, ms: p50(rs), acc: rs.filter(isCorrect).length / rs.length, cost };
  });
  const x: Axis = {
    min: -1,
    max: 4,
    ticks: [-1, 0, 1, 2, 3, 4],
    fmt: (v) => (v < 0 ? "0.1 ms" : v < 3 ? `${10 ** v} ms` : `${10 ** (v - 3)} s`),
    title: "Median time per decision (log scale)",
  };
  const y: Axis = {
    min: 0.5,
    max: 0.9,
    ticks: [0.5, 0.6, 0.7, 0.8, 0.9],
    fmt: (v) => `${Math.round(v * 100)}%`,
    title: "Exact action accuracy",
  };
  const { sx, sy } = scaler(x, y);
  const ms = (v: number) => (v < 10 ? `${v.toFixed(2)} ms` : `${Math.round(v)} ms`);
  const body = points
    .map((p) => {
      const cx = sx(Math.log10(p.ms));
      const cy = sy(p.acc);
      const cost = p.cost ? `$${p.cost.toFixed(3)} per 1,000` : "free";
      const [tx, ty, anchor] = p.place === "left" ? [cx - 14, cy - 2, "end"] : [cx, cy + 26, "middle"];
      return (
        dot(cx, cy, p.color, `${p.label}: ${pct(p.acc)} right, ${ms(p.ms)}, ${cost}`, 6) +
        `<text class="label" x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(p.label)} ${pct(p.acc)}</text>` +
        `<text class="note" x="${tx}" y="${ty + 14}" text-anchor="${anchor}">${ms(p.ms)} · ${cost}</text>`
      );
    })
    .join("");
  return frame(
    "JEV was about 9× faster; the LLM was 0.6 points more accurate",
    "Test split, 3,080 messages. The accuracy gap is within its 95% CI (−0.4 to +1.7 points)",
    x,
    y,
    body,
  );
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/effort-curve.svg`, await effortChart());
writeFileSync(`${OUT}/accuracy-vs-workload.svg`, tradeoffChart());
writeFileSync(`${OUT}/jev-calibration.svg`, calibrationChart());
writeFileSync(`${OUT}/accuracy-by-service.svg`, servicesChart());
writeFileSync(`${OUT}/accuracy-vs-speed.svg`, speedChart());
console.log(`wrote 5 charts to ${OUT}/`);
