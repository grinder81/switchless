import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Example } from "../data/banking77.js";
import type { Router } from "../routers/types.js";
import type { RunRecord } from "./metrics.js";

/** Streams examples through a router; writes one JSON line per decision. */
export async function run(router: Router, examples: Example[], outPath: string): Promise<RunRecord[]> {
  const records: RunRecord[] = [];
  for (const ex of examples) {
    const d = await router.route(ex.text);
    records.push({ text: ex.text, goldIntent: ex.intent, ...d });
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${records.map((r) => JSON.stringify(r)).join("\n")}\n`);
  return records;
}
