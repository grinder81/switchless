import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Router } from "../routers/types.js";
import type { RunRecord } from "./metrics.js";
import type { Indexed } from "./sample.js";

export function readRun(path: string): RunRecord[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RunRecord);
}

export interface RunOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Streams examples through a router, appending one JSON line per decision to `outPath`.
 * Resumable: examples already in the file (by index) are skipped. Router errors are recorded,
 * never dropped, and count as wrong answers.
 */
export async function run(
  router: Router,
  examples: Indexed[],
  outPath: string,
  { concurrency = 1, onProgress }: RunOptions = {},
): Promise<RunRecord[]> {
  mkdirSync(dirname(outPath), { recursive: true });
  const done = new Set(readRun(outPath).map((r) => r.index));
  const todo = examples.filter((e) => !done.has(e.index));
  let completed = examples.length - todo.length;
  let cursor = 0;

  const worker = async () => {
    while (cursor < todo.length) {
      const ex = todo[cursor++] as Indexed;
      const start = performance.now();
      let record: RunRecord;
      try {
        const d = await router.route(ex.text);
        record = {
          index: ex.index,
          text: ex.text,
          goldIntent: ex.intent,
          ...d,
          wallMs: performance.now() - start,
        };
      } catch (err) {
        record = {
          index: ex.index,
          text: ex.text,
          goldIntent: ex.intent,
          action: null,
          confidence: 0,
          latencyMs: 0,
          costUsd: 0,
          router: router.name,
          wallMs: performance.now() - start,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      appendFileSync(outPath, `${JSON.stringify(record)}\n`);
      onProgress?.(++completed, examples.length);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

  const wanted = new Set(examples.map((e) => e.index));
  return readRun(outPath).filter((r) => wanted.has(r.index));
}
