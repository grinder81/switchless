import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  jaccard,
  pairedComparison,
  referLeastConfident,
  selectionBreakdown,
  verifyManifest,
  wilson,
} from "../src/bench/analysis.js";
import type { RunRecord } from "../src/bench/metrics.js";

const rec = (
  index: number,
  action: string | null,
  confidence: number,
  goldIntent = "card_arrival",
): RunRecord => ({
  index,
  text: "",
  goldIntent,
  action,
  confidence,
  latencyMs: 0,
  wallMs: 0,
  costUsd: 0,
  router: "t",
});
const RIGHT = "cards.track_delivery";
const WRONG = "fx.rates";

describe("analysis statistics", () => {
  it("Wilson interval matches a known value", () => {
    const i = wilson(50, 100);
    expect(i.estimate).toBe(0.5);
    expect(i.lo).toBeCloseTo(0.4038, 4);
    expect(i.hi).toBeCloseTo(0.5962, 4);
  });

  it("paired comparison counts discordant messages and is reproducible", () => {
    const a = [rec(0, RIGHT, 1), rec(1, RIGHT, 1), rec(2, WRONG, 1), rec(3, WRONG, 1)];
    const b = [rec(0, RIGHT, 1), rec(1, WRONG, 1), rec(2, RIGHT, 1), rec(3, RIGHT, 1)];
    const p = pairedComparison(a, b, { resamples: 500 });
    expect([p.onlyA, p.onlyB]).toEqual([1, 2]);
    expect(p.diff.estimate).toBeCloseTo(0.25);
    expect(pairedComparison(a, b, { resamples: 500 }).bootstrap).toEqual(p.bootstrap);
  });

  it("refers the least confident messages, lower index first on ties, and bounds the tie effect", () => {
    const rs = [rec(0, WRONG, 0.5), rec(1, RIGHT, 0.5), rec(2, RIGHT, 0.5), rec(3, RIGHT, 0.9)];
    const r = referLeastConfident(rs, 1);
    expect([...r.referredIndices]).toEqual([0]);
    expect(r.accuracy.estimate).toBe(1);
    expect([r.tiedAtCut, r.tiedReferred]).toEqual([3, 1]);
    expect(r.tieWorst).toBeCloseTo(2 / 3);
    expect(r.tieBest).toBe(1);
  });

  it("jaccard is shared over union", () => {
    expect(jaccard(new Set([1, 2, 3]), new Set([2, 3, 4]))).toBe(0.5);
  });

  it("classifies incorrect selections by whether the chosen handler can change state", () => {
    const s = selectionBreakdown([
      rec(0, "cards.order_physical", 1),
      rec(1, WRONG, 1),
      rec(2, null, 0),
      rec(3, RIGHT, 1),
    ]);
    expect(s).toMatchObject({ selected: 3, incorrect: 2, incorrectStateChangingHandler: 1 });
  });
});

describe("preserved raw runs", () => {
  it("match their SHA-256 manifest", () => {
    expect(verifyManifest("results/raw")).toHaveLength(16);
  });

  it("a changed file is rejected", () => {
    const dir = mkdtempSync(join(tmpdir(), "raw-"));
    try {
      cpSync("results/raw", dir, { recursive: true });
      writeFileSync(join(dir, "oracle_train_300.jsonl"), "{}\n", { flag: "a" });
      expect(() => verifyManifest(dir)).toThrow("oracle_train_300.jsonl");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
