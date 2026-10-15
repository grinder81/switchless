/**
 * Choose the hybrid design and threshold on the tuning sample (decision D12), offline from recorded
 * rules and JEV runs. Needs: pnpm bench --router rules --set tuning; pnpm bench --router jev --set tuning
 *
 *   pnpm hybrid:tune
 */
import { readRun } from "../src/bench/runner.js";
import { ACTION_BY_INTENT } from "../src/catalog/actions.js";
import { combine, type HybridConfig, needsJev, STRATEGIES } from "../src/routers/hybrid-strategies.js";

const MAX_ESCALATION = 0.2;
const THRESHOLDS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99];

const rules = new Map(readRun("results/runs/rules_train-tuning_1000.jsonl").map((r) => [r.index, r]));
const jev = new Map(readRun("results/runs/jev_train-tuning_1000.jsonl").map((r) => [r.index, r]));
if (!rules.size || rules.size !== jev.size) throw new Error("run rules and jev on --set tuning first");

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
interface Row extends HybridConfig {
  answered: number;
  accAnswered: number;
  escalated: number;
  jevCalls: number;
  overall: number;
}

const rows: Row[] = [];
for (const strategy of STRATEGIES) {
  for (const threshold of THRESHOLDS) {
    let answered = 0;
    let correct = 0;
    let calls = 0;
    for (const [i, r] of rules) {
      const j = jev.get(i);
      if (needsJev(strategy, r)) calls++;
      const { action } = combine({ strategy, threshold }, r, j);
      if (action === null) continue;
      answered++;
      if (action === ACTION_BY_INTENT.get(r.goldIntent)?.id) correct++;
    }
    const n = rules.size;
    rows.push({
      strategy,
      threshold,
      answered: answered / n,
      accAnswered: answered ? correct / answered : 0,
      escalated: 1 - answered / n,
      jevCalls: calls / n,
      overall: correct / n,
    });
  }
}

console.log("| Design | Threshold | Escalated | Accuracy on answered | Correct overall | JEV calls |");
console.log("|---|---:|---:|---:|---:|---:|");
for (const r of rows) {
  console.log(
    `| ${r.strategy} | ${r.threshold} | ${pct(r.escalated)} | ${pct(r.accAnswered)} | ${pct(r.overall)} | ${pct(r.jevCalls)} |`,
  );
}

const eligible = rows
  .filter((r) => r.escalated <= MAX_ESCALATION)
  .sort((a, b) => b.accAnswered - a.accAnswered || a.jevCalls - b.jevCalls);
const best = eligible[0];
console.log(
  best
    ? `\nWinner (≤${pct(MAX_ESCALATION)} escalated): ${best.strategy} @ ${best.threshold}: ${pct(best.accAnswered)} on answered, ${pct(best.escalated)} escalated, ${pct(best.jevCalls)} JEV calls`
    : "\nNo design meets the escalation budget.",
);
