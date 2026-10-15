/**
 * How the hybrid combines the rules and JEV decisions for one message. Pure functions, shared by the
 * live HybridRouter and the offline tuning script so both make exactly the same choice.
 */
import type { Decision } from "./types.js";

export const STRATEGIES = ["rules-first", "jev-first", "agreement", "jev-only"] as const;
export type Strategy = (typeof STRATEGIES)[number];

export interface HybridConfig {
  strategy: Strategy;
  /** JEV answers on its own only at or above this confidence. */
  threshold: number;
}

export type Stage = "rules" | "jev" | "agreement" | "human";

/** Does this strategy need JEV's decision given the rules' decision? (Rules-first can skip the call.) */
export function needsJev(strategy: Strategy, rules: Decision): boolean {
  return strategy !== "rules-first" || rules.action === null;
}

export function combine(
  { strategy, threshold }: HybridConfig,
  rules: Decision,
  jev: Decision | undefined,
): { action: string | null; stage: Stage } {
  const jevSure = jev?.action != null && jev.confidence >= threshold;
  switch (strategy) {
    case "rules-first":
      if (rules.action) return { action: rules.action, stage: "rules" };
      return jevSure ? { action: jev?.action ?? null, stage: "jev" } : { action: null, stage: "human" };
    case "jev-first":
      if (jevSure) return { action: jev?.action ?? null, stage: "jev" };
      return rules.action ? { action: rules.action, stage: "rules" } : { action: null, stage: "human" };
    case "agreement":
      if (rules.action && rules.action === jev?.action) return { action: rules.action, stage: "agreement" };
      return jevSure ? { action: jev?.action ?? null, stage: "jev" } : { action: null, stage: "human" };
    case "jev-only":
      return jevSure ? { action: jev?.action ?? null, stage: "jev" } : { action: null, stage: "human" };
  }
}
