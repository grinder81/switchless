import { ACTION_BY_ID, ACTION_BY_INTENT, SAFETY_CRITICAL } from "../catalog/actions.js";

export interface RunRecord {
  /** Row index in the split. */
  index: number;
  text: string;
  goldIntent: string;
  action: string | null;
  confidence: number;
  /** Latency reported by the router (e.g. API time). */
  latencyMs: number;
  /** Wall-clock time measured by the runner; used for latency metrics. */
  wallMs: number;
  costUsd: number;
  router: string;
  /** Set when the router threw; the record counts as wrong. */
  error?: string;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const goldAction = (r: RunRecord) => ACTION_BY_INTENT.get(r.goldIntent)?.id;
const goldService = (r: RunRecord) => ACTION_BY_INTENT.get(r.goldIntent)?.service;
const chosenService = (r: RunRecord) => (r.action ? ACTION_BY_ID.get(r.action)?.service : undefined);
const isCorrect = (r: RunRecord) => r.action !== null && r.action === goldAction(r);

/** Strict: the exact action. */
export function actionAccuracy(records: RunRecord[]): number {
  return mean(records.map((r) => (isCorrect(r) ? 1 : 0)));
}

/** Lenient: the right service, even if the action within it is wrong. */
export function serviceAccuracy(records: RunRecord[]): number {
  return mean(
    records.map((r) => {
      const chosen = chosenService(r);
      return chosen !== undefined && chosen === goldService(r) ? 1 : 0;
    }),
  );
}

export function abstainRate(records: RunRecord[]): number {
  return mean(records.map((r) => (r.action === null && !r.error ? 1 : 0)));
}

export function errorRate(records: RunRecord[]): number {
  return mean(records.map((r) => (r.error ? 1 : 0)));
}

/** Nearest-rank percentile. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))] ?? 0;
}

export function costPer1000(records: RunRecord[]): number {
  return 1000 * mean(records.map((r) => r.costUsd));
}

export interface CalibrationBin {
  lo: number;
  hi: number;
  count: number;
  meanConfidence: number;
  accuracy: number;
}

/** Confidence vs actual accuracy in equal-width bins, plus expected calibration error (ECE). */
export function calibration(records: RunRecord[], bins = 10): { bins: CalibrationBin[]; ece: number } {
  const answered = records.filter((r) => r.action !== null);
  const out: CalibrationBin[] = Array.from({ length: bins }, (_, i) => {
    const lo = i / bins;
    const hi = (i + 1) / bins;
    const inBin = answered.filter((r) =>
      i === bins - 1 ? r.confidence >= lo : r.confidence >= lo && r.confidence < hi,
    );
    return {
      lo,
      hi,
      count: inBin.length,
      meanConfidence: mean(inBin.map((r) => r.confidence)),
      accuracy: mean(inBin.map((r) => (isCorrect(r) ? 1 : 0))),
    };
  });
  const ece = answered.length
    ? out.reduce((s, b) => s + (b.count / answered.length) * Math.abs(b.accuracy - b.meanConfidence), 0)
    : 0;
  return { bins: out, ece };
}

/** Accuracy per gold service. */
export function perService(records: RunRecord[]): Record<string, { count: number; actionAccuracy: number }> {
  const groups = new Map<string, RunRecord[]>();
  for (const r of records) {
    const s = goldService(r) ?? "?";
    groups.set(s, [...(groups.get(s) ?? []), r]);
  }
  return Object.fromEntries(
    [...groups.entries()].map(([s, rs]) => [s, { count: rs.length, actionAccuracy: actionAccuracy(rs) }]),
  );
}

/** Gold service → chosen service (or "abstain") counts. */
export function serviceConfusion(records: RunRecord[]): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const r of records) {
    const gold = goldService(r) ?? "?";
    const chosen = r.error ? "error" : (chosenService(r) ?? "abstain");
    m[gold] ??= {};
    m[gold][chosen] = (m[gold][chosen] ?? 0) + 1;
  }
  return m;
}

/** Of the decisions that triggered a safety-critical action, how many were right (and how many were missed). */
export function safetyCritical(records: RunRecord[]): { fired: number; precision: number; recall: number } {
  const fired = records.filter((r) => r.action !== null && SAFETY_CRITICAL.has(r.action));
  const relevant = records.filter((r) => SAFETY_CRITICAL.has(goldAction(r) ?? ""));
  return {
    fired: fired.length,
    precision: mean(fired.map((r) => (isCorrect(r) ? 1 : 0))),
    recall: mean(relevant.map((r) => (isCorrect(r) ? 1 : 0))),
  };
}

export interface Summary {
  router: string;
  n: number;
  actionAccuracy: number;
  serviceAccuracy: number;
  abstainRate: number;
  errorRate: number;
  p50Ms: number;
  p95Ms: number;
  costPer1000: number;
  ece: number;
  safety: ReturnType<typeof safetyCritical>;
}

export function summarize(router: string, records: RunRecord[]): Summary {
  const wall = records.map((r) => r.wallMs);
  return {
    router,
    n: records.length,
    actionAccuracy: actionAccuracy(records),
    serviceAccuracy: serviceAccuracy(records),
    abstainRate: abstainRate(records),
    errorRate: errorRate(records),
    p50Ms: percentile(wall, 50),
    p95Ms: percentile(wall, 95),
    costPer1000: costPer1000(records),
    ece: calibration(records).ece,
    safety: safetyCritical(records),
  };
}
