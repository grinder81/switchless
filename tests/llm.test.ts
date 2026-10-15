import { describe, expect, it } from "vitest";
import { ACTIONS } from "../src/catalog/actions.js";
import { type ChatClient, LLM_MODEL, LLMRouter } from "../src/routers/llm.js";

type Request = Parameters<ChatClient["chat"]["completions"]["create"]>[0];

const fake = (content: string, usage = { prompt_tokens: 1500, completion_tokens: 20 }) => {
  const requests: Request[] = [];
  const client: ChatClient = {
    chat: {
      completions: {
        create: async (req) => {
          requests.push(req);
          return { model: LLM_MODEL, choices: [{ message: { content } }], usage };
        },
      },
    },
  };
  return { client, requests };
};

describe("LLM dispatcher", () => {
  it("sends the catalogue as the system prompt and the message alone as the user turn", async () => {
    const { client, requests } = fake('{"action":"cards.track_delivery","confidence":0.9}');
    await new LLMRouter(client).route("where is my card?");
    const req = requests[0];
    expect(req?.model).toBe(LLM_MODEL);
    expect(req?.reasoning_effort).toBe("none");
    expect(req?.messages[1]).toEqual({ role: "user", content: "where is my card?" });
    expect(req?.messages[0]?.content).toContain(
      "cards.track_delivery: An ordered card has not arrived yet; where is it",
    );
    expect(req?.response_format.json_schema.schema.properties.action.enum).toEqual(ACTIONS.map((a) => a.id));
  });

  it("returns action, clamped confidence, reported model and token cost", async () => {
    const { client } = fake('{"action":"fx.rates","confidence":1.4}', {
      prompt_tokens: 2_000_000,
      completion_tokens: 1_000_000,
      prompt_tokens_details: { cached_tokens: 1_000_000, cache_write_tokens: 0 },
    } as never);
    const d = await new LLMRouter(client).route("rates?");
    expect(d.action).toBe("fx.rates");
    expect(d.confidence).toBe(1);
    expect(d.model).toBe(LLM_MODEL);
    expect(d.costUsd).toBeCloseTo(0.1 + 0.01 + 0.5);
  });

  it("rejects an action outside the catalogue so the runner records an error", async () => {
    const { client } = fake('{"action":"not.an.action","confidence":0.5}');
    await expect(new LLMRouter(client).route("hi")).rejects.toThrow("unknown action");
  });

  it("explains a missing API key", () => {
    const saved = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      expect(() => new LLMRouter()).toThrow("OPENAI_API_KEY is not set");
    } finally {
      if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
    }
  });
});
