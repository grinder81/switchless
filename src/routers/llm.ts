/** LLM dispatcher: a general-purpose LLM picks the action. */
import type { Decision, Router } from "./types.js";

export class LLMRouter implements Router {
  readonly name = "llm";

  async route(_text: string): Promise<Decision> {
    throw new Error("not implemented");
  }
}
