import { SERVICES } from "../catalog/services.js";
import { calibration, perService, type RunRecord, serviceConfusion, summarize } from "./metrics.js";

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const ms = (x: number) => (x < 10 ? `${x.toFixed(2)} ms` : `${Math.round(x)} ms`);
const usd = (x: number) => `$${x.toFixed(x < 1 ? 4 : 2)}`;

export interface NamedRun {
  /** e.g. "oracle · train · 300" */
  label: string;
  records: RunRecord[];
  /** Logical lines of dispatcher code, if known. */
  loc?: number;
}

/** Markdown report comparing runs. */
export function renderReport(runs: NamedRun[], title = "Benchmark results"): string {
  const out: string[] = [`# ${title}`, ""];
  out.push(
    "| Run | n | Action acc. | Service acc. | Abstain | Errors | p50 | p95 | Cost / 1k | ECE | Safety prec. | Safety recall | LOC |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of runs) {
    const s = summarize(r.label, r.records);
    out.push(
      `| ${r.label} | ${s.n} | ${pct(s.actionAccuracy)} | ${pct(s.serviceAccuracy)} | ${pct(s.abstainRate)} | ${pct(s.errorRate)} | ${ms(s.p50Ms)} | ${ms(s.p95Ms)} | ${usd(s.costPer1000)} | ${s.ece.toFixed(3)} | ${s.safety.fired ? pct(s.safety.precision) : "–"} | ${pct(s.safety.recall)} | ${r.loc ?? "–"} |`,
    );
  }
  out.push(
    "",
    "_Action acc._ = exact action (strict). _Service acc._ = right microservice (lenient). _ECE_ = expected calibration error (0 is perfect). _Safety prec./recall_ = exact-intent precision and recall on the five safety-critical intents (freeze, block or sign out); they do not show whether an appropriate protective action happened. _LOC_ = own files plus the routers a router is built from.",
  );

  for (const r of runs) {
    out.push(
      "",
      `## ${r.label}`,
      "",
      "### Accuracy by service",
      "",
      "| Service | n | Action acc. |",
      "|---|---:|---:|",
    );
    for (const [id, v] of Object.entries(perService(r.records)).sort()) {
      out.push(
        `| ${SERVICES[id as keyof typeof SERVICES]?.title ?? id} | ${v.count} | ${pct(v.actionAccuracy)} |`,
      );
    }
    const conf = serviceConfusion(r.records);
    const mistakes = Object.entries(conf)
      .flatMap(([gold, row]) =>
        Object.entries(row)
          .filter(([c]) => c !== gold)
          .map(([c, n]) => ({ gold, c, n })),
      )
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
    if (mistakes.length) {
      out.push(
        "",
        "### Most common cross-service mistakes",
        "",
        "| Should be | Went to | Count |",
        "|---|---|---:|",
      );
      for (const m of mistakes) out.push(`| ${m.gold} | ${m.c} | ${m.n} |`);
    }
    const cal = calibration(r.records).bins.filter((b) => b.count);
    if (cal.length > 1) {
      out.push(
        "",
        "### Calibration",
        "",
        "| Confidence | n | Mean conf. | Accuracy |",
        "|---|---:|---:|---:|",
      );
      for (const b of cal)
        out.push(
          `| ${b.lo.toFixed(1)}–${b.hi.toFixed(1)} | ${b.count} | ${pct(b.meanConfidence)} | ${pct(b.accuracy)} |`,
        );
    }
  }
  return `${out.join("\n")}\n`;
}
