import { describe, expect, it } from "vitest";
import { ACTIONS } from "../src/catalog/actions.js";
import { JEV_MODEL, JEVRouter, type SystemOneClient } from "../src/routers/jev.js";

type Request = Parameters<SystemOneClient["systemOne"]>[0];

const fake = (choice: string, confidence = 0.93, inputTokens: number | null = 2000) => {
  const requests: Request[] = [];
  const client: SystemOneClient = {
    systemOne: async (req) => {
      requests.push(req);
      return {
        model: JEV_MODEL,
        answers: { action: { choice, confidence } },
        usage: { input_tokens: inputTokens },
      };
    },
  };
  return { client, requests };
};

describe("JEV dispatcher", () => {
  it("asks one pinned-model Choice over all 77 actions with the message as state", async () => {
    const { client, requests } = fake("cards.track_delivery");
    await new JEVRouter(client).route("where is my card?");
    const req = requests[0];
    expect(req?.model).toBe(JEV_MODEL);
    expect(req?.state).toEqual({ customer_message: "where is my card?" });
    const criteria = req?.questions.action.criteria ?? {};
    expect(Object.keys(criteria)).toEqual(ACTIONS.map((a) => a.id));
    expect(criteria["cards.track_delivery"]).toBe("An ordered card has not arrived yet; where is it");
  });

  it("returns the chosen action, its confidence and the cost of the input tokens", async () => {
    const { client } = fake("atm.wrong_amount", 0.81, 2_000_000);
    const d = await new JEVRouter(client).route("the ATM gave me less cash");
    expect(d.action).toBe("atm.wrong_amount");
    expect(d.confidence).toBe(0.81);
    expect(d.costUsd).toBeCloseTo(0.084);
    expect(d.router).toBe("jev");
  });

  it("treats a missing token count as zero cost", async () => {
    const { client } = fake("fx.rates", 0.5, null);
    expect((await new JEVRouter(client).route("rates?")).costUsd).toBe(0);
  });

  it("rejects an action outside the catalogue so the runner records an error", async () => {
    const { client } = fake("not.an.action");
    await expect(new JEVRouter(client).route("hi")).rejects.toThrow("unknown action");
  });

  it("explains a missing API key", () => {
    const saved = process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_API_KEY;
    try {
      expect(() => new JEVRouter()).toThrow("TYPESAFE_API_KEY is not set");
    } finally {
      if (saved !== undefined) process.env.TYPESAFE_API_KEY = saved;
    }
  });
});
