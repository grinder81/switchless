/**
 * JEV dispatcher: one zero-shot Choice question over the 77 catalogue actions. The model sees only
 * the customer's message and each action's one-line description, the same information as the LLM.
 */
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import { ACTION_BY_ID, ACTIONS } from "../catalog/actions.js";
import type { Decision, Router } from "./types.js";

/** Pinned version (not the moving `jev-latest` alias) so results are reproducible. */
export const JEV_MODEL = "jev-1.13.0";
/** $0.042 per million input tokens; output is free (docs.typesafe.ai/models, Oct 2026). */
export const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

export const ACTION_QUESTION = choice(
  "Which action should the bank take to handle this customer's message?",
  Object.fromEntries(ACTIONS.map((a) => [a.id, a.description])),
);

/** The part of the TypeSafe client this router uses, so tests can pass a fake. */
export interface SystemOneClient {
  systemOne(request: {
    state: { customer_message: string };
    questions: { action: typeof ACTION_QUESTION };
    model: string;
  }): PromiseLike<{
    model: string;
    answers: { action: { choice: string; confidence: number } };
    usage: { input_tokens: number | null };
  }>;
}

export class JEVRouter implements Router {
  readonly name = "jev";

  constructor(private readonly client: SystemOneClient = defaultClient()) {}

  async route(text: string): Promise<Decision> {
    const start = performance.now();
    const res = await this.client.systemOne({
      state: { customer_message: text },
      questions: { action: ACTION_QUESTION },
      model: JEV_MODEL,
    });
    const { choice: action, confidence } = res.answers.action;
    if (!ACTION_BY_ID.has(action)) throw new Error(`JEV returned unknown action "${action}"`);
    return {
      action,
      confidence,
      latencyMs: performance.now() - start,
      costUsd: (res.usage.input_tokens ?? 0) * JEV_USD_PER_INPUT_TOKEN,
      router: this.name,
    };
  }
}

function defaultClient(): SystemOneClient {
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error("TYPESAFE_API_KEY is not set; add it to the environment to use the jev dispatcher");
  }
  return new TypeSafeClient({ defaultModel: JEV_MODEL });
}
