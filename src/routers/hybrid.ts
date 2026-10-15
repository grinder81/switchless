/** Hybrid: rules, then JEV, then LLM or human when JEV is below threshold. */
import type { Decision, Router } from "./types.js";

export class HybridRouter implements Router {
  readonly name = "hybrid";

  async route(_text: string): Promise<Decision> {
    throw new Error("not implemented");
  }
}
