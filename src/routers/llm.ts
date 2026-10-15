/**
 * LLM dispatcher: a general-purpose model picks one of the 77 catalogue actions. It gets the same
 * information as JEV: the customer's message, the same instruction and each action's one-line
 * description, in catalogue order. Zero-shot: no training examples (decision D14).
 */
import OpenAI from "openai";
import { ACTION_BY_ID, ACTIONS } from "../catalog/actions.js";
import type { Decision, Router } from "./types.js";

/** OpenAI offers no dated gpt-6-luna snapshot; runs record the model the API reports. */
export const LLM_MODEL = "gpt-6-luna";
/** Standard tier, per 1M tokens (developers.openai.com/api/docs/pricing, 2026-10-15). */
export const LLM_USD_PER_TOKEN = {
  input: 0.1e-6,
  cachedInput: 0.01e-6,
  cacheWrite: 0.125e-6,
  output: 0.5e-6,
};

const INSTRUCTIONS = "Which action should the bank take to handle this customer's message?";

export const SYSTEM_PROMPT = [
  "You route customer messages for a bank.",
  INSTRUCTIONS,
  "Choose exactly one action id from the list below. Also give your confidence (0 to 1) that it is the right action.",
  "",
  ...ACTIONS.map((a) => `${a.id}: ${a.description}`),
].join("\n");

export const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "decision",
    strict: true,
    schema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ACTIONS.map((a) => a.id) },
        confidence: { type: "number" },
      },
      required: ["action", "confidence"],
      additionalProperties: false,
    },
  },
} as const;

/** The part of the OpenAI client this router uses, so tests can pass a fake. */
export interface ChatClient {
  chat: {
    completions: {
      create(request: {
        model: string;
        messages: { role: "system" | "user"; content: string }[];
        response_format: typeof RESPONSE_FORMAT;
        reasoning_effort: "none";
      }): PromiseLike<{
        model: string;
        choices: { message: { content: string | null } }[];
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
        };
      }>;
    };
  };
}

export class LLMRouter implements Router {
  readonly name = "llm";

  constructor(private readonly client: ChatClient = defaultClient()) {}

  async route(text: string): Promise<Decision> {
    const start = performance.now();
    const res = await this.client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: RESPONSE_FORMAT,
      // A router answers in one step; reasoning would multiply latency and cost.
      reasoning_effort: "none",
    });
    const { action, confidence } = JSON.parse(res.choices[0]?.message.content ?? "{}");
    if (!ACTION_BY_ID.has(action)) throw new Error(`LLM returned unknown action "${action}"`);
    const usage = res.usage;
    const cached = usage?.prompt_tokens_details?.cached_tokens ?? 0;
    const written = usage?.prompt_tokens_details?.cache_write_tokens ?? 0;
    const costUsd = usage
      ? (usage.prompt_tokens - cached - written) * LLM_USD_PER_TOKEN.input +
        cached * LLM_USD_PER_TOKEN.cachedInput +
        written * LLM_USD_PER_TOKEN.cacheWrite +
        usage.completion_tokens * LLM_USD_PER_TOKEN.output
      : 0;
    return {
      action,
      confidence: Math.min(1, Math.max(0, Number(confidence) || 0)),
      latencyMs: performance.now() - start,
      costUsd,
      router: this.name,
      model: res.model,
    };
  }
}

function defaultClient(): ChatClient {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set; add it to the environment to use the llm dispatcher");
  }
  return new OpenAI({ maxRetries: 5 });
}
