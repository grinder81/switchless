/** Local dev server: `pnpm dev`. DISPATCHER=rules (default) | oracle | jev | llm | hybrid. */
import { serve } from "@hono/node-server";
import { createBank } from "./bank/bank.js";
import { loadSplit } from "./data/banking77.js";
import { createApp } from "./gateway/app.js";
import { createRouter } from "./routers/registry.js";

const port = Number(process.env.PORT ?? 3000);
const dispatcher = createRouter(process.env.DISPATCHER ?? "rules", [
  ...loadSplit("train"),
  ...loadSplit("test"),
]);
const app = createApp(createBank(), dispatcher);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Kestrel Bank on http://localhost:${port}  (dispatcher: ${dispatcher.name})`);
  console.log(`Try:
  curl -s localhost:${port}/help -H 'content-type: application/json' \\
    -d '{"customerId":"maya","message":"I am still waiting on my card?"}'`);
  console.log("Customers: maya, tom, priya, sam. Type anything; messages no rule matches are escalated.");
});
