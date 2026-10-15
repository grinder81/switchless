"""Streams examples through a router and records one JSONL line per decision."""

import json
import time
from dataclasses import asdict
from pathlib import Path

from switchless.data import Example
from switchless.routers.base import Router


def run(router: Router, examples: list[Example], out: Path) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for ex in examples:
            start = time.perf_counter()
            decision = router.route(ex.text)
            wall_ms = (time.perf_counter() - start) * 1000
            record = {"text": ex.text, "gold_intent": ex.intent, "wall_ms": wall_ms, **asdict(decision)}
            f.write(json.dumps(record) + "\n")
    return out
