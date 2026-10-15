"""Turns a run (list of decision records) into summary metrics."""

from statistics import quantiles


def service_accuracy(records: list[dict], intent_to_service: dict[str, str]) -> float:
    if not records:
        return 0.0
    hits = sum(r["service"] == intent_to_service[r["gold_intent"]] for r in records)
    return hits / len(records)


def latency_percentiles(records: list[dict]) -> dict[str, float]:
    ms = sorted(r["wall_ms"] for r in records)
    if len(ms) < 2:
        return {"p50": ms[0] if ms else 0.0, "p95": ms[0] if ms else 0.0}
    q = quantiles(ms, n=100)
    return {"p50": q[49], "p95": q[94]}


def cost_per_1000(records: list[dict]) -> float:
    if not records:
        return 0.0
    return 1000 * sum(r["cost_usd"] for r in records) / len(records)
