import { describe, expect, it } from "vitest";
import {
  abstainRate,
  actionAccuracy,
  costPer1000,
  percentile,
  type RunRecord,
  serviceAccuracy,
} from "../src/bench/metrics.js";

const rec = (goldIntent: string, action: string | null, latencyMs = 1, costUsd = 0.001): RunRecord => ({
  text: "",
  goldIntent,
  action,
  confidence: 1,
  latencyMs,
  costUsd,
  router: "t",
});

describe("metrics", () => {
  const records = [
    rec("card_arrival", "cards.track_delivery"), // exact
    rec("card_arrival", "cards.delivery_estimate"), // right service, wrong action
    rec("card_arrival", "fx.rates"), // wrong
    rec("card_arrival", null), // abstain
  ];

  it("scores strict and lenient accuracy", () => {
    expect(actionAccuracy(records)).toBe(0.25);
    expect(serviceAccuracy(records)).toBe(0.5);
    expect(abstainRate(records)).toBe(0.25);
  });

  it("computes cost and percentiles", () => {
    expect(costPer1000(records)).toBeCloseTo(1);
    expect(percentile([5, 1, 3, 2, 4], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4, 100], 95)).toBe(100);
  });
});
