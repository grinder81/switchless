import { Hono } from "hono";
import type { Bank } from "../bank/bank.js";
import type { Router } from "../routers/types.js";
import { HANDLERS } from "../services/index.js";

/** The Kestrel API gateway. The dispatcher is injected, so every experiment shares this code. */
export function createApp(bank: Bank, dispatcher: Router) {
  const app = new Hono();

  app.post("/help", async (c) => {
    const body = await c.req
      .json<{ customerId?: string; message?: string }>()
      .catch(() => ({}) as Record<string, never>);
    if (!body.customerId || !body.message)
      return c.json({ error: "customerId and message are required" }, 400);
    const customer = bank.customer(body.customerId);
    if (!customer) return c.json({ error: "unknown customer" }, 404);

    const decision = await dispatcher.route(body.message);
    const handler = decision.action ? HANDLERS.get(decision.action) : undefined;
    if (!handler) {
      return c.json({
        decision,
        escalated: true,
        answer: { text: "I'm not sure I understood. Let me connect you with someone from our team." },
      });
    }
    const answer = handler({ bank, customer, message: body.message });
    return c.json({ decision, escalated: false, answer });
  });

  return app;
}
