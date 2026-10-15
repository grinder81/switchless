/**
 * Combine every run in results/runs/ into one Markdown report.
 *
 *   pnpm report                              # → results/runs/summary.md (local, git-ignored)
 *   pnpm report --match _test_3080 --out results/summary.md   # Phase 7: the committed report
 */
import { readdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { renderReport } from "../src/bench/report.js";
import { readRun } from "../src/bench/runner.js";
import { countLoc } from "./count-loc.js";

const { values } = parseArgs({
  options: {
    out: { type: "string", default: "results/runs/summary.md" },
    match: { type: "string", default: "" },
    title: { type: "string", default: "Benchmark results" },
  },
});

const runs = readdirSync("results/runs")
  .filter((f) => f.endsWith(".jsonl") && f.includes(values.match))
  .sort()
  .map((f) => {
    const [router = "", split = "", n = ""] = f.replace(".jsonl", "").split("_");
    return {
      label: `${router} · ${split} · ${n}`,
      records: readRun(`results/runs/${f}`),
      loc: countLoc(router),
    };
  });

writeFileSync(values.out, renderReport(runs, values.title));
console.log(`wrote ${values.out} (${runs.length} runs)`);
