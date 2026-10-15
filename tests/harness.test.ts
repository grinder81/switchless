import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { logicalLines } from "../scripts/count-loc.js";
import {
  calibration,
  type RunRecord,
  safetyCritical,
  serviceConfusion,
  summarize,
} from "../src/bench/metrics.js";
import { renderReport } from "../src/bench/report.js";
import { run } from "../src/bench/runner.js";
import { stratifiedSample } from "../src/bench/sample.js";
import type { Example } from "../src/data/banking77.js";
import { OracleRouter } from "../src/routers/oracle.js";
import { RandomRouter } from "../src/routers/random.js";
import { createRouter } from "../src/routers/registry.js";
import type { Decision, Router } from "../src/routers/types.js";

const toy: Example[] = Array.from({ length: 200 }, (_, i) => ({
  text: `msg ${i}`,
  intent:
    i % 4 === 0
      ? "card_arrival"
      : i % 4 === 1
        ? "exchange_rate"
        : i % 4 === 2
          ? "lost_or_stolen_card"
          : "pin_blocked",
}));

const rec = (goldIntent: string, action: string | null, confidence = 1, error?: string): RunRecord => ({
  index: 0,
  text: "",
  goldIntent,
  action,
  confidence,
  latencyMs: 0,
  wallMs: 1,
  costUsd: 0,
  router: "t",
  ...(error ? { error } : {}),
});

describe("stratified sample", () => {
  it("is deterministic and keeps class proportions", () => {
    const a = stratifiedSample(toy, 40, 1);
    expect(a).toEqual(stratifiedSample(toy, 40, 1));
    expect(a).not.toEqual(stratifiedSample(toy, 40, 2));
    expect(a).toHaveLength(40);
    expect(a.filter((e) => e.intent === "card_arrival")).toHaveLength(10);
  });

  it("covers every class when n allows", () => {
    expect(new Set(stratifiedSample(toy, 4).map((e) => e.intent)).size).toBe(4);
  });
});

describe("runner", () => {
  const dir = mkdtempSync(join(tmpdir(), "switchless-"));

  it("records every decision and resumes without repeating work", async () => {
    const sample = stratifiedSample(toy, 20);
    let calls = 0;
    const counting: Router = {
      name: "counting",
      route: async (t) => {
        calls++;
        return new OracleRouter(toy).route(t);
      },
    };
    const out = join(dir, "run.jsonl");
    await run(counting, sample.slice(0, 10), out);
    const records = await run(counting, sample, out, { concurrency: 3 });
    expect(calls).toBe(20);
    expect(records).toHaveLength(20);
    expect(readFileSync(out, "utf8").trim().split("\n")).toHaveLength(20);
  });

  it("records router errors instead of dropping them", async () => {
    const failing: Router = {
      name: "failing",
      route: async (): Promise<Decision> => {
        throw new Error("rate limited");
      },
    };
    const [r] = await run(failing, stratifiedSample(toy, 1), join(dir, "fail.jsonl"));
    expect(r?.error).toBe("rate limited");
    expect(summarize("failing", r ? [r] : []).errorRate).toBe(1);
  });
});

describe("metrics", () => {
  it("measures calibration", () => {
    const perfect = [
      rec("card_arrival", "cards.track_delivery", 0.95),
      rec("card_arrival", "fx.rates", 0.05),
    ];
    expect(calibration(perfect).ece).toBeCloseTo(0.05);
    const overconfident = [rec("card_arrival", "fx.rates", 0.95), rec("card_arrival", "fx.rates", 0.95)];
    expect(calibration(overconfident).ece).toBeCloseTo(0.95);
  });

  it("builds a service confusion table", () => {
    const m = serviceConfusion([
      rec("card_arrival", "fx.rates"),
      rec("card_arrival", null),
      rec("card_arrival", null, 0, "x"),
    ]);
    expect(m.cards).toEqual({ fx: 1, abstain: 1, error: 1 });
  });

  it("scores safety-critical precision and recall", () => {
    const s = safetyCritical([
      rec("lost_or_stolen_card", "security.report_lost_card"), // right
      rec("card_arrival", "security.report_lost_card"), // froze a card by mistake
      rec("compromised_card", "cards.troubleshoot"), // missed
    ]);
    expect(s).toEqual({ fired: 2, precision: 0.5, recall: 0.5 });
  });
});

describe("reference dispatchers", () => {
  it("oracle scores 100% and random is near chance", async () => {
    const dir = mkdtempSync(join(tmpdir(), "switchless-"));
    const sample = stratifiedSample(toy, 100);
    const oracle = summarize("oracle", await run(new OracleRouter(toy), sample, join(dir, "o.jsonl")));
    const random = summarize("random", await run(new RandomRouter(), sample, join(dir, "r.jsonl")));
    expect(oracle.actionAccuracy).toBe(1);
    expect(random.actionAccuracy).toBeLessThan(0.1);
    expect(renderReport([{ label: "oracle", records: [] }])).toContain("| oracle |");
  });

  it("names the phase for dispatchers not built yet", () => {
    expect(() => createRouter("llm", toy)).toThrow("Phase 4");
    expect(() => createRouter("nope", toy)).toThrow("unknown dispatcher");
  });
});

describe("count-loc", () => {
  it("ignores blanks and comments", () => {
    expect(logicalLines("// c\n\n/* a\n b */\nconst x = 1;\n  return x; // trailing\n")).toBe(2);
  });
});
