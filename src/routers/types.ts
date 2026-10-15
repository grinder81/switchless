/** The contract every dispatcher implements. */
export interface Decision {
  /** Chosen action id (e.g. `cards.track_delivery`), or null to abstain / escalate. */
  action: string | null;
  /** 0–1. Rules report 1 on a match; LLM and JEV report their own confidence. */
  confidence: number;
  latencyMs: number;
  costUsd: number;
  /** Which router (or hybrid stage) made the final call. */
  router: string;
}

export interface Router {
  readonly name: string;
  route(text: string): Promise<Decision>;
}
