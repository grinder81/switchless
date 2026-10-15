/**
 * Consistency of JEV on a fixed 200-message test subset (Phase 7): repeat runs with the same request,
 * and one run with the option order reversed. Compares every run with the main test run.
 *
 *   pnpm consistency
 */
import { readRun, run } from "../src/bench/runner.js";
import { stratifiedSample } from "../src/bench/sample.js";
import { ACTION_BY_INTENT } from "../src/catalog/actions.js";
import { loadSplit } from "../src/data/banking77.js";
import { JEVRouter } from "../src/routers/jev.js";

const subset = stratifiedSample(loadSplit("test"), 200, 11);
const main = new Map(readRun("results/runs/jev_test_3080.jsonl").map((r) => [r.index, r]));
if (!main.size) throw new Error("run the main JEV test benchmark first");

const variants = [
  { name: "repeat-1", router: new JEVRouter() },
  { name: "repeat-2", router: new JEVRouter() },
  { name: "reversed-options", router: new JEVRouter(undefined, "reversed") },
];

console.log("| Run | Answers changed vs main run | Accuracy (subset) | Main run accuracy (subset) |");
console.log("|---|---:|---:|---:|");
const ok = (action: string | null, intent: string) => action === ACTION_BY_INTENT.get(intent)?.id;
const mainAcc = subset.filter((e) => ok(main.get(e.index)?.action ?? null, e.intent)).length / subset.length;
for (const v of variants) {
  const records = await run(v.router, subset, `results/runs/jev-${v.name}_test_200.jsonl`, {
    concurrency: 4,
  });
  const changed = records.filter((r) => r.action !== main.get(r.index)?.action).length / records.length;
  const acc = records.filter((r) => ok(r.action, r.goldIntent)).length / records.length;
  console.log(
    `| ${v.name} | ${(100 * changed).toFixed(1)}% | ${(100 * acc).toFixed(1)}% | ${(100 * mainAcc).toFixed(1)}% |`,
  );
}
