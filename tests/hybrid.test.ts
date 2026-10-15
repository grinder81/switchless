import { describe, expect, it } from "vitest";
import { createBank } from "../src/bank/bank.js";
import { createApp } from "../src/gateway/app.js";
import { HYBRID_CONFIG, HybridRouter } from "../src/routers/hybrid.js";
import { combine } from "../src/routers/hybrid-strategies.js";
import type { Decision, Router } from "../src/routers/types.js";

const d = (action: string | null, confidence = 1, extra: Partial<Decision> = {}): Decision => ({
  action,
  confidence,
  latencyMs: 0,
  costUsd: 0,
  router: "t",
  ...extra,
});
const fixed = (decision: Decision): Router & { calls: number } => {
  const r = {
    name: "fixed",
    calls: 0,
    route: async () => {
      r.calls++;
      return decision;
    },
  };
  return r;
};

describe("hybrid strategies", () => {
  const cfg = (strategy: (typeof HYBRID_CONFIG)["strategy"]) => ({ strategy, threshold: 0.9 });

  it("agreement answers when rules and JEV agree, else needs a confident JEV", () => {
    expect(combine(cfg("agreement"), d("fx.rates"), d("fx.rates", 0.3)).stage).toBe("agreement");
    expect(combine(cfg("agreement"), d("fx.rates"), d("atm.pending", 0.95))).toEqual({
      action: "atm.pending",
      stage: "jev",
    });
    expect(combine(cfg("agreement"), d("fx.rates"), d("atm.pending", 0.5))).toEqual({
      action: null,
      stage: "human",
    });
    expect(combine(cfg("agreement"), d(null), d("atm.pending", 0.5)).stage).toBe("human");
  });

  it("rules-first trusts rules, then a confident JEV", () => {
    expect(combine(cfg("rules-first"), d("fx.rates"), undefined).stage).toBe("rules");
    expect(combine(cfg("rules-first"), d(null), d("atm.pending", 0.95)).stage).toBe("jev");
  });

  it("jev-first trusts a confident JEV, then rules", () => {
    expect(combine(cfg("jev-first"), d("fx.rates"), d("atm.pending", 0.95)).action).toBe("atm.pending");
    expect(combine(cfg("jev-first"), d("fx.rates"), d("atm.pending", 0.5)).action).toBe("fx.rates");
  });
});

describe("hybrid router", () => {
  it("uses the frozen agreement design and reports the stage that decided", async () => {
    expect(HYBRID_CONFIG).toEqual({ strategy: "agreement", threshold: 0.9 });
    const out = await new HybridRouter(
      fixed(d("fx.rates")),
      fixed(d("fx.rates", 0.4, { costUsd: 0.0001 })),
    ).route("x");
    expect(out).toMatchObject({ action: "fx.rates", router: "hybrid:agreement", costUsd: 0.0001 });
  });

  it("skips the JEV call when a rules-first design already has an answer", async () => {
    const jev = fixed(d("atm.pending", 0.99));
    await new HybridRouter(fixed(d("fx.rates")), jev, { strategy: "rules-first", threshold: 0.9 }).route("x");
    expect(jev.calls).toBe(0);
  });
});

describe("gateway: did you mean", () => {
  const unsure = d("card_payments.unrecognised", 0.5, {
    alternatives: [
      { action: "card_payments.unrecognised", p: 0.5 },
      { action: "atm.unrecognised", p: 0.3 },
    ],
  });
  const app = createApp(createBank(), new HybridRouter(fixed(d(null)), fixed(unsure)));
  const post = (path: string, body: unknown) =>
    app.request(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });

  it("offers the dispatcher's best guesses as buttons when unsure, without acting", async () => {
    const json = await (await post("/help", { customerId: "sam", message: "money gone??" })).json();
    expect(json.escalated).toBe(true);
    expect(json.suggestions.map((s: { action: string }) => s.action)).toEqual([
      "card_payments.unrecognised",
      "atm.unrecognised",
    ]);
    expect(json.answer.text).toContain("Did you mean");
  });

  it("runs a button's action directly", async () => {
    const json = await (await post("/action", { customerId: "sam", action: "atm.unrecognised" })).json();
    expect(json.answer.text).toContain("frozen");
    expect((await post("/action", { customerId: "sam", action: "nope" })).status).toBe(400);
  });
});
