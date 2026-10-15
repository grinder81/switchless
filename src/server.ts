/** Local dev server: `pnpm dev`. Uses the oracle dispatcher until a real one exists (Phase 3+). */
import { serve } from "@hono/node-server";
import { createBank } from "./bank/bank.js";
import { loadSplit } from "./data/banking77.js";
import { createApp } from "./gateway/app.js";
import { OracleRouter } from "./routers/oracle.js";

const port = Number(process.env.PORT ?? 3000);
const dispatcher = new OracleRouter([...loadSplit("train"), ...loadSplit("test")]);
const app = createApp(createBank(), dispatcher);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Kestrel Bank on http://localhost:${port}  (dispatcher: ${dispatcher.name})`);
  console.log(`Try:
  curl -s localhost:${port}/help -H 'content-type: application/json' \\
    -d '{"customerId":"maya","message":"I am still waiting on my card?"}'`);
  console.log(
    "Customers: maya, tom, priya, sam. The oracle only knows Banking77 sentences; others escalate.",
  );
});
