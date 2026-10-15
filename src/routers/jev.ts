/** JEV dispatcher: zero-shot decision model with calibrated probabilities. */
import type { Decision, Router } from "./types.js";

export class JEVRouter implements Router {
  readonly name = "jev";

  async route(_text: string): Promise<Decision> {
    throw new Error("not implemented");
  }
}
