import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createBank } from "../src/bank/bank.js";
import { DATA_DIR, loadSplit } from "../src/data/banking77.js";
import { createApp } from "../src/gateway/app.js";
import { OracleRouter } from "../src/routers/oracle.js";

const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/help", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("gateway", () => {
  const app = createApp(
    createBank(),
    new OracleRouter([{ text: "where is my card", intent: "card_arrival" }]),
  );

  it("dispatches a message to its handler", async () => {
    const res = await post(app, { customerId: "maya", message: "where is my card" });
    const json = await res.json();
    expect(json.decision.action).toBe("cards.track_delivery");
    expect(json.escalated).toBe(false);
    expect(json.answer.text).toContain("Royal Mail");
  });

  it("escalates when the dispatcher abstains", async () => {
    const json = await (await post(app, { customerId: "maya", message: "something else" })).json();
    expect(json.escalated).toBe(true);
  });

  it("validates input", async () => {
    expect((await post(app, { message: "hi" })).status).toBe(400);
    expect((await post(app, { customerId: "nobody", message: "hi" })).status).toBe(404);
  });
});

describe.skipIf(!existsSync(`${DATA_DIR}train.csv`))("end to end with the oracle", () => {
  it("routes and answers 500 real Banking77 messages", async () => {
    const sample = loadSplit("train").filter((_, i) => i % 20 === 0);
    const app = createApp(createBank(), new OracleRouter(sample));
    for (const ex of sample) {
      const json = await (await post(app, { customerId: "tom", message: ex.text })).json();
      expect(json.escalated, ex.text).toBe(false);
      expect(json.answer.text.length).toBeGreaterThan(10);
    }
  });
});
