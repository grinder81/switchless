/**
 * Statistics computed from preserved raw runs (`results/raw/`), without any API calls.
 * Used by `pnpm analyze`; every number in `results/analysis.md` comes from here.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { ACTION_BY_INTENT, SAFETY_CRITICAL } from "../catalog/actions.js";
import { STATE_CHANGING } from "../catalog/effects.js";
import type { RunRecord } from "./metrics.js";

const Z95 = 1.959963984540054;

export const goldAction = (r: RunRecord) => ACTION_BY_INTENT.get(r.goldIntent)?.id;
export const isCorrect = (r: RunRecord) => r.action !== null && r.action === goldAction(r);

/**
 * Check every file in `dir` against `dir/SHA256SUMS`: same set of `.jsonl` files, same full hashes.
 * Throws on any difference, so nothing is computed from altered or missing data.
 */
export function verifyManifest(dir: string): { file: string; sha256: string }[] {
  const listed = readFileSync(`${dir}/SHA256SUMS`, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
      if (!m?.[1] || !m[2]) throw new Error(`bad manifest line: ${line}`);
      return { sha256: m[1], file: m[2] };
    });
  const present = readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort();
  const names = listed.map((l) => l.file).sort();
  if (JSON.stringify(present) !== JSON.stringify(names)) {
    throw new Error(`manifest lists ${names.join(", ")} but ${dir} has ${present.join(", ")}`);
  }
  for (const { file, sha256 } of listed) {
    const actual = createHash("sha256")
      .update(readFileSync(`${dir}/${file}`))
      .digest("hex");
    if (actual !== sha256) throw new Error(`${file}: SHA-256 ${actual}, manifest says ${sha256}`);
  }
  return listed;
}

export interface Interval {
  estimate: number;
  lo: number;
  hi: number;
}

/** Wilson score interval for a proportion k/n (95%). */
export function wilson(k: number, n: number): Interval {
  if (n === 0) return { estimate: Number.NaN, lo: Number.NaN, hi: Number.NaN };
  const p = k / n;
  const z2 = Z95 * Z95;
  const den = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / den;
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return { estimate: p, lo: centre - half, hi: centre + half };
}

export interface PairedComparison {
  n: number;
  /** Messages only A got right / only B got right. */
  onlyA: number;
  onlyB: number;
  /** Accuracy of B minus accuracy of A, with a 95% Wald interval for paired proportions. */
  diff: Interval;
  /** Same difference, 95% percentile bootstrap over messages (seeded). */
  bootstrap: Interval;
  /** McNemar test with continuity correction (chi-square, 1 df). */
  mcnemarChi2: number;
  mcnemarP: number;
}

/** Deterministic PRNG (mulberry32), so the bootstrap is reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Complementary error function (Numerical Recipes erfcc, |error| < 1.2e-7). */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/** Compare two routers on the same messages (matched by dataset index). */
export function pairedComparison(
  a: RunRecord[],
  b: RunRecord[],
  { resamples = 10_000, seed = 1 } = {},
): PairedComparison {
  const byIndex = new Map(b.map((r) => [r.index, r]));
  const pairs = a.map((r) => {
    const other = byIndex.get(r.index);
    if (!other) throw new Error(`message ${r.index} missing from the second run`);
    return [isCorrect(r) ? 1 : 0, isCorrect(other) ? 1 : 0] as const;
  });
  const n = pairs.length;
  const onlyA = pairs.filter(([x, y]) => x === 1 && y === 0).length;
  const onlyB = pairs.filter(([x, y]) => x === 0 && y === 1).length;
  const d = (onlyB - onlyA) / n;
  const se = Math.sqrt((onlyA + onlyB) / n ** 2 - (onlyB - onlyA) ** 2 / n ** 3);

  const rand = mulberry32(seed);
  const diffs: number[] = [];
  for (let i = 0; i < resamples; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const [x, y] = pairs[Math.floor(rand() * n)] ?? [0, 0];
      sum += y - x;
    }
    diffs.push(sum / n);
  }
  diffs.sort((x, y) => x - y);
  const q = (p: number) => diffs[Math.min(diffs.length - 1, Math.floor(p * diffs.length))] ?? Number.NaN;

  const chi2 = onlyA + onlyB ? (Math.abs(onlyA - onlyB) - 1) ** 2 / (onlyA + onlyB) : 0;
  return {
    n,
    onlyA,
    onlyB,
    diff: { estimate: d, lo: d - Z95 * se, hi: d + Z95 * se },
    bootstrap: { estimate: d, lo: q(0.025), hi: q(0.975) },
    mcnemarChi2: chi2,
    mcnemarP: erfc(Math.sqrt(chi2 / 2)),
  };
}

export interface ReferralResult {
  /** Messages sent to a person. */
  referred: number;
  answered: number;
  correct: number;
  accuracy: Interval;
  /** Confidence at the cut: answered messages have confidence ≥ this. */
  cutConfidence: number;
  /** Messages whose confidence equals the cut, and how many of those were referred. */
  tiedAtCut: number;
  tiedReferred: number;
  /** Accuracy on answered if the tied messages were referred in the most / least favourable order. */
  tieBest: number;
  tieWorst: number;
  referredIndices: Set<number>;
}

/**
 * Refer the `k` least confident messages to a person and answer the rest. Tie-break: among equal
 * confidence, the message with the lower dataset index is referred first. Also reports how much
 * accuracy on answered could move if the tied messages at the cut were referred in a different order.
 */
export function referLeastConfident(records: RunRecord[], k: number): ReferralResult {
  const ordered = [...records].sort((x, y) => x.confidence - y.confidence || x.index - y.index);
  const referred = ordered.slice(0, k);
  const answered = ordered.slice(k);
  const correct = answered.filter(isCorrect).length;
  const cut = answered[0]?.confidence ?? Number.NaN;
  const tied = ordered.filter((r) => r.confidence === cut);
  const tiedReferred = tied.filter((r) => referred.includes(r)).length;
  const tiedAnswered = tied.length - tiedReferred;
  const tiedCorrect = tied.filter(isCorrect).length;
  const correctOutsideTie = answered.filter((r) => r.confidence !== cut && isCorrect(r)).length;
  const best = correctOutsideTie + Math.min(tiedCorrect, tiedAnswered);
  const worst = correctOutsideTie + Math.max(0, tiedAnswered - (tied.length - tiedCorrect));
  return {
    referred: referred.length,
    answered: answered.length,
    correct,
    accuracy: wilson(correct, answered.length),
    cutConfidence: cut,
    tiedAtCut: tied.length,
    tiedReferred,
    tieBest: best / answered.length,
    tieWorst: worst / answered.length,
    referredIndices: new Set(referred.map((r) => r.index)),
  };
}

/** Overlap between two sets of referred messages: shared / union. */
export function jaccard(a: Set<number>, b: Set<number>): number {
  const shared = [...a].filter((x) => b.has(x)).length;
  return shared / (a.size + b.size - shared || 1);
}

export interface SelectionBreakdown {
  /** Messages for which the router selected an action (not referred, no error). */
  selected: number;
  incorrect: number;
  /** Incorrect selections whose selected handler can change state (STATE_CHANGING). */
  incorrectStateChangingHandler: number;
  /** Of those, cases where the right action was information-only. */
  incorrectStateChangingWhenGoldReadOnly: number;
  /** Safety-critical gold intents, and how many got exactly that action. */
  safetyGold: number;
  safetyExact: number;
}

/**
 * Classify a router's selections from its prediction log. These are selections of handlers, not
 * observed effects: whether a selected handler changes anything depends on the customer's state.
 */
export function selectionBreakdown(records: RunRecord[]): SelectionBreakdown {
  const selected = records.filter((r) => r.action !== null);
  const incorrect = selected.filter((r) => !isCorrect(r));
  const stateChanging = incorrect.filter((r) => STATE_CHANGING.has(r.action ?? ""));
  const safety = records.filter((r) => SAFETY_CRITICAL.has(goldAction(r) ?? ""));
  return {
    selected: selected.length,
    incorrect: incorrect.length,
    incorrectStateChangingHandler: stateChanging.length,
    incorrectStateChangingWhenGoldReadOnly: stateChanging.filter(
      (r) => !STATE_CHANGING.has(goldAction(r) ?? ""),
    ).length,
    safetyGold: safety.length,
    safetyExact: safety.filter(isCorrect).length,
  };
}
