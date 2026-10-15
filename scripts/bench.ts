/**
 * Run a dispatcher over Banking77 and print its metrics.
 *
 *   pnpm bench --router random                      # 300-message train sample
 *   pnpm bench --router oracle --sample 1000
 *   pnpm bench --router jev --split test --final    # Phase 7 only
 *
 * Runs are appended to results/runs/<router>_<split>_<n>.jsonl and resume if interrupted.
 */
import { parseArgs } from "node:util";
import { renderReport } from "../src/bench/report.js";
import { run } from "../src/bench/runner.js";
import { stratifiedSample } from "../src/bench/sample.js";
import { loadSplit } from "../src/data/banking77.js";
import { createRouter } from "../src/routers/registry.js";
import { countLoc } from "./count-loc.js";

const { values } = parseArgs({
  options: {
    router: { type: "string" },
    split: { type: "string", default: "train" },
    sample: { type: "string", default: "300" },
    seed: { type: "string", default: "42" },
    concurrency: { type: "string", default: "4" },
    final: { type: "boolean", default: false },
  },
});

if (!values.router) throw new Error("--router is required");
const split = values.split === "test" ? "test" : "train";
if (split === "test" && !values.final) {
  throw new Error("The test split is touched once, in Phase 7. Pass --final to confirm.");
}

const examples = loadSplit(split);
const n = values.sample === "all" ? examples.length : Number(values.sample);
const sample = stratifiedSample(examples, n, Number(values.seed));
const router = createRouter(values.router, examples);
const out = `results/runs/${router.name}_${split}_${sample.length}.jsonl`;

const records = await run(router, sample, out, {
  concurrency: Number(values.concurrency),
  onProgress: (done, total) => process.stderr.write(`\r${router.name}: ${done}/${total}`),
});
process.stderr.write("\n");
console.log(
  renderReport([
    { label: `${router.name} · ${split} · ${sample.length}`, records, loc: countLoc(router.name) },
  ]),
);
console.log(`Raw decisions: ${out}`);
