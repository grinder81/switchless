/**
 * Download the Banking77 train/test CSVs into data/banking77/, pinned to the commit used for every
 * reported result, and verify their full SHA-256 hashes. An existing file is verified, not trusted.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { DATA_DIR } from "../src/data/banking77.js";

/** PolyAI-LDN/task-specific-datasets `master` as of 2026-10-15. */
export const BANKING77_COMMIT = "57ec275d8078af65b7731c2a98be812d844a6d6b";
export const BANKING77_SHA256: Record<"train" | "test", string> = {
  train: "b06e26ac675513959a63135f11b94ea7786ed02da65db93a5650d8838cbc664b",
  test: "d12d6e3bc4c3103966ae786dc435913c0c563dfa328f5a3646d0e62cfeeb474d",
};

const BASE = `https://raw.githubusercontent.com/PolyAI-LDN/task-specific-datasets/${BANKING77_COMMIT}/banking_data`;
const sha256 = (data: Buffer) => createHash("sha256").update(data).digest("hex");

mkdirSync(DATA_DIR, { recursive: true });
for (const split of ["train", "test"] as const) {
  const target = `${DATA_DIR}${split}.csv`;
  let data: Buffer;
  if (existsSync(target)) {
    data = readFileSync(target);
  } else {
    const res = await fetch(`${BASE}/${split}.csv`);
    if (!res.ok) throw new Error(`download failed: ${res.status} ${split}`);
    data = Buffer.from(await res.arrayBuffer());
  }
  const actual = sha256(data);
  if (actual !== BANKING77_SHA256[split]) {
    throw new Error(`${split}.csv has SHA-256 ${actual}, expected ${BANKING77_SHA256[split]}`);
  }
  if (!existsSync(target)) writeFileSync(target, data);
  console.log(`verified: ${target} (sha256 ${actual})`);
}
