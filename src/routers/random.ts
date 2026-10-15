/** Random dispatcher: the floor every real dispatcher must beat. Seeded, so runs are reproducible. */
import { rng } from "../bench/sample.js";
import { ACTIONS } from "../catalog/actions.js";
import type { Decision, Router } from "./types.js";

export class RandomRouter implements Router {
  readonly name = "random";
  private readonly next: () => number;

  constructor(seed = 7) {
    this.next = rng(seed);
  }

  async route(_text: string): Promise<Decision> {
    const action = ACTIONS[Math.floor(this.next() * ACTIONS.length)]?.id ?? null;
    return { action, confidence: 1 / ACTIONS.length, latencyMs: 0, costUsd: 0, router: this.name };
  }
}
