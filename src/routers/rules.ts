/**
 * Rules dispatcher: hand-written keyword and pattern rules, the traditional core router.
 * Rules are grouped into stages (src/routers/rules/stageN.ts) so accuracy can be measured as rules
 * are added. When several rules match, the most specific wins: explicit priority first, then the
 * number of patterns, then definition order. No rule matches → abstain.
 */
import type { Rule } from "./rules/rule.js";
import { STAGES } from "./rules/stages.js";
import type { Decision, Router } from "./types.js";

export function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'£€$%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const specificity = (r: Rule) => (r.priority ?? 0) * 100 + r.when.length;

export class RulesRouter implements Router {
  readonly name = "rules";
  private readonly rules: Rule[];

  /** `stages` = how many stages to use (default: all). */
  constructor(stages = STAGES.length) {
    this.rules = STAGES.slice(0, stages).flat();
  }

  async route(text: string): Promise<Decision> {
    const t = normalize(text);
    let best: Rule | undefined;
    for (const r of this.rules) {
      if (!r.when.every((p) => p.test(t)) || r.unless?.test(t)) continue;
      if (!best || specificity(r) > specificity(best)) best = r;
    }
    return {
      action: best?.action ?? null,
      confidence: best ? 1 : 0,
      latencyMs: 0,
      costUsd: 0,
      router: this.name,
    };
  }
}
