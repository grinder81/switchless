/**
 * The rules effort curve: accuracy and lines of code after each stage, measured on the held-out
 * 1,000-message train sample (never inspected while writing rules).
 *
 *   pnpm rules:curve
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { abstainRate, actionAccuracy, type RunRecord, serviceAccuracy } from "../src/bench/metrics.js";
import { stratifiedSample } from "../src/bench/sample.js";
import { loadSplit } from "../src/data/banking77.js";
import { STAGES } from "../src/routers/rules/stages.js";
import { RulesRouter } from "../src/routers/rules.js";
import { logicalLines } from "./count-loc.js";

const loc = (path: string) =>
  logicalLines(readFileSync(fileURLToPath(new URL(`../src/routers/${path}`, import.meta.url)), "utf8"));
const engine = loc("rules.ts") + loc("rules/rule.ts") + loc("rules/stages.ts");

const sample = stratifiedSample(loadSplit("train"), 1000, 42);
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

console.log("| Stage | Rules | Lines of code | Action acc. | Service acc. | Abstain |");
console.log("|---|---:|---:|---:|---:|---:|");
let lines = engine;
for (let k = 1; k <= STAGES.length; k++) {
  lines += loc(`rules/stage${k}.ts`);
  const router = new RulesRouter(k);
  const records: RunRecord[] = [];
  for (const e of sample) {
    const d = await router.route(e.text);
    records.push({ index: e.index, text: e.text, goldIntent: e.intent, ...d, wallMs: 0 });
  }
  const rules = STAGES.slice(0, k).flat().length;
  console.log(
    `| ${k} | ${rules} | ${lines} | ${pct(actionAccuracy(records))} | ${pct(serviceAccuracy(records))} | ${pct(abstainRate(records))} |`,
  );
}
