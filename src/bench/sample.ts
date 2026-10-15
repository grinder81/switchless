import type { Example } from "../data/banking77.js";

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Indexed extends Example {
  /** Row index in the split, so a sample is reproducible and resumable. */
  index: number;
}

/**
 * Stratified sample: each intent gets a share proportional to its frequency (largest-remainder
 * rounding), at least one per intent when n allows. Same (examples, n, seed) → same sample.
 */
export function stratifiedSample(examples: Example[], n: number, seed = 42): Indexed[] {
  const indexed = examples.map((e, index) => ({ ...e, index }));
  if (n >= indexed.length) return indexed;

  const byIntent = new Map<string, Indexed[]>();
  for (const e of indexed) byIntent.set(e.intent, [...(byIntent.get(e.intent) ?? []), e]);
  const groups = [...byIntent.entries()].sort(([a], [b]) => a.localeCompare(b));

  const quotas = groups.map(([intent, rows]) => {
    const exact = (n * rows.length) / indexed.length;
    return { intent, rows, take: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  if (n >= groups.length) for (const q of quotas) q.take = Math.max(q.take, 1);
  let total = quotas.reduce((s, q) => s + q.take, 0);
  for (const q of [...quotas].sort((a, b) => b.frac - a.frac || a.intent.localeCompare(b.intent))) {
    if (total >= n) break;
    if (q.take < q.rows.length) {
      q.take++;
      total++;
    }
  }
  while (total > n) {
    const q = quotas.filter((x) => x.take > 1).sort((a, b) => b.take - a.take)[0];
    if (!q) break;
    q.take--;
    total--;
  }

  const random = rng(seed);
  const picked = quotas.flatMap((q) => {
    const rows = [...q.rows];
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rows[i], rows[j]] = [rows[j] as Indexed, rows[i] as Indexed];
    }
    return rows.slice(0, q.take);
  });
  return picked.sort((a, b) => a.index - b.index);
}
