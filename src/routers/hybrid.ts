/**
 * Hybrid dispatcher: rules and JEV together, with a human for what neither is sure about.
 * Design and threshold were chosen on the tuning sample (decision D12, `pnpm hybrid:tune`) and are
 * frozen here before any held-out or test run.
 */
import { combine, type HybridConfig, needsJev } from "./hybrid-strategies.js";
import type { Decision, Router } from "./types.js";

/** Frozen 2026-10-15 from `pnpm hybrid:tune`: 87.7% accuracy on answered, 18.9% escalated (tuning). */
export const HYBRID_CONFIG: HybridConfig = { strategy: "agreement", threshold: 0.9 };

export class HybridRouter implements Router {
  readonly name = "hybrid";

  constructor(
    private readonly rules: Router,
    private readonly jev: Router,
    private readonly config: HybridConfig = HYBRID_CONFIG,
  ) {}

  async route(text: string): Promise<Decision> {
    const start = performance.now();
    const r = await this.rules.route(text);
    const j = needsJev(this.config.strategy, r) ? await this.jev.route(text) : undefined;
    const { action, stage } = combine(this.config, r, j);
    return {
      action,
      confidence: stage === "rules" ? r.confidence : (j?.confidence ?? 0),
      latencyMs: performance.now() - start,
      costUsd: r.costUsd + (j?.costUsd ?? 0),
      router: `hybrid:${stage}`,
      ...(j?.alternatives ? { alternatives: j.alternatives } : {}),
    };
  }
}
