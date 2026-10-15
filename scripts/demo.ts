/** Walk through each persona's story: `pnpm demo`. Messages are real Banking77 train examples. */
import { createBank } from "../src/bank/bank.js";
import { loadSplit } from "../src/data/banking77.js";
import { createApp } from "../src/gateway/app.js";
import { OracleRouter } from "../src/routers/oracle.js";

const train = loadSplit("train");
const example = (intent: string) => train.find((e) => e.intent === intent)?.text ?? "";

const steps = [
  ["maya", example("card_arrival")],
  ["maya", example("card_delivery_estimate")],
  ["tom", example("card_payment_wrong_exchange_rate")],
  ["tom", example("wrong_amount_of_cash_received")],
  ["tom", example("cancel_transfer")],
  ["priya", example("unable_to_verify_identity")],
  ["priya", example("pending_top_up")],
  ["sam", example("card_payment_not_recognised")],
  ["sam", example("transaction_charged_twice")],
  ["sam", "Can you book me a table for dinner?"],
] as const;

const app = createApp(createBank(), new OracleRouter(train));
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
