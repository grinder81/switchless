import { Hono } from "hono";
import type { Bank } from "../bank/bank.js";
import { ACTION_BY_ID } from "../catalog/actions.js";
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
      // "Did you mean…?": the dispatcher's next best guesses become buttons (see POST /action).
      const suggestions = (decision.alternatives ?? [])
        .filter((a) => HANDLERS.has(a.action))
        .map((a) => ({ action: a.action, label: ACTION_BY_ID.get(a.action)?.description ?? a.action }));
      return c.json({
        decision,
        escalated: true,
        suggestions,
        answer: {
          text: suggestions.length
            ? "I'm not completely sure what you need. Did you mean one of these? Or I can connect you with someone."
            : "I'm not sure I understood. Let me connect you with someone from our team.",
        },
      });
    }
    const answer = handler({ bank, customer, message: body.message });
    return c.json({ decision, escalated: false, answer });
  });

  // A button names its action directly, so no dispatcher is involved.
  app.post("/action", async (c) => {
    const body = await c.req
      .json<{ customerId?: string; action?: string }>()
      .catch(() => ({}) as Record<string, never>);
    const customer = body.customerId ? bank.customer(body.customerId) : undefined;
    if (!customer) return c.json({ error: "unknown customer" }, 404);
    const handler = body.action ? HANDLERS.get(body.action) : undefined;
    if (!handler) return c.json({ error: "unknown action" }, 400);
    return c.json({ answer: handler({ bank, customer, message: "" }) });
  });

  return app;
}
