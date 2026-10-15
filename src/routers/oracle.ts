/** Oracle dispatcher: looks up the true label. For testing the product and harness only, never benchmarked. */
import { ACTION_BY_INTENT } from "../catalog/actions.js";
import type { Example } from "../data/banking77.js";
import type { Decision, Router } from "./types.js";

export class OracleRouter implements Router {
  readonly name = "oracle";
  private readonly labels: Map<string, string>;

  constructor(examples: Example[]) {
    this.labels = new Map(examples.map((e) => [e.text, e.intent]));
  }

  async route(text: string): Promise<Decision> {
    const intent = this.labels.get(text);
    const action = intent ? (ACTION_BY_INTENT.get(intent)?.id ?? null) : null;
    return { action, confidence: action ? 1 : 0, latencyMs: 0, costUsd: 0, router: this.name };
  }
}
