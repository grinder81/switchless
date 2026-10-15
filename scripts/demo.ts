/**
 * Walk through each persona's story with the hand-written rules dispatcher: `pnpm demo`.
 * Messages are written fresh for the demo, not taken from Banking77.
 */
import { createBank } from "../src/bank/bank.js";
import { createApp } from "../src/gateway/app.js";
import { RulesRouter } from "../src/routers/rules.js";

const steps = [
  ["maya", "My new card still hasn't arrived, where is it?"],
  ["maya", "How long does card delivery take?"],
  ["tom", "The exchange rate on my payment in Spain looks wrong"],
  ["tom", "The ATM only gave me half the cash I asked for"],
  ["tom", "Please cancel the transfer I just sent to the wrong account"],
  ["priya", "Why can't I verify my identity?"],
  ["priya", "My top up is still pending after an hour"],
  ["sam", "I don't recognise a payment on my card"],
  ["sam", "I was charged twice for the same thing"],
  ["sam", "Can you book me a table for dinner?"],
] as const;

const app = createApp(createBank(), new RulesRouter());
for (const [customerId, message] of steps) {
  const res = await app.request("/help", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerId, message }),
  });
  const json = await res.json();
  console.log(`${customerId.padEnd(5)} │ "${message}"`);
  console.log(`      │ → ${json.decision.action ?? "ABSTAIN → escalate to a human"}`);
  console.log(`      │ ${json.answer.text}\n`);
}
