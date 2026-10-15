/** Download the Banking77 train/test CSVs into data/banking77/. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { DATA_DIR } from "../src/data/banking77.js";

const BASE = "https://raw.githubusercontent.com/PolyAI-LDN/task-specific-datasets/master/banking_data";

mkdirSync(DATA_DIR, { recursive: true });
for (const split of ["train", "test"]) {
  const target = `${DATA_DIR}${split}.csv`;
  if (existsSync(target)) {
    console.log(`exists: ${target}`);
    continue;
  }
  const res = await fetch(`${BASE}/${split}.csv`);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${split}`);
  writeFileSync(target, await res.text());
  console.log(`downloaded: ${target}`);
}
