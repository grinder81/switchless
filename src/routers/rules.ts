/** Hand-written keyword and pattern rules: the traditional dispatcher. */
import type { Decision, Router } from "./types.js";

export class RulesRouter implements Router {
  readonly name = "rules";

  async route(_text: string): Promise<Decision> {
    throw new Error("not implemented");
  }
}
