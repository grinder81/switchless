import { ACTION_BY_ID, ACTION_BY_INTENT } from "../catalog/actions.js";

export interface RunRecord {
  text: string;
  goldIntent: string;
  action: string | null;
  confidence: number;
  latencyMs: number;
  costUsd: number;
  router: string;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** Strict: the exact action. */
export function actionAccuracy(records: RunRecord[]): number {
  return mean(records.map((r) => (r.action === ACTION_BY_INTENT.get(r.goldIntent)?.id ? 1 : 0)));
}

/** Lenient: the right service, even if the action within it is wrong. */
export function serviceAccuracy(records: RunRecord[]): number {
  return mean(
    records.map((r) => {
      const chosen = r.action ? ACTION_BY_ID.get(r.action)?.service : undefined;
      return chosen !== undefined && chosen === ACTION_BY_INTENT.get(r.goldIntent)?.service ? 1 : 0;
    }),
  );
}

export function abstainRate(records: RunRecord[]): number {
  return mean(records.map((r) => (r.action === null ? 1 : 0)));
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
