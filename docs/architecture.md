# Architecture

```
 customer message
        │
        ▼
 ┌──────────────┐   Decision(service, intent, confidence, latency, cost)
 │    Router    │ ─────────────────────────────────────────────┐
 └──────────────┘                                              ▼
   rules | llm | jev | hybrid                          ┌──────────────┐
                                                       │ service stub │  (Cards, Transfers, …)
                                                       └──────────────┘
```

## Router contract

Every router implements one method (see `src/switchless/routers/base.py`):

```python
def route(self, text: str) -> Decision
```

`Decision` carries:

| Field | Meaning |
|---|---|
| `service` | chosen microservice, or `None` if the router abstains |
| `intent` | chosen Banking77 intent, if the router predicts at that level |
| `confidence` | 0–1; rules report 1.0 on a match, LLM reports its stated or derived confidence |
| `latency_ms` | wall-clock time of the decision |
| `cost_usd` | API cost of the decision (0 for rules) |
| `router` | which router (or hybrid stage) made the final call |

Keeping the contract identical across routers is what makes the comparison fair: the benchmark runner
never knows which router it is driving.

## Hybrid

```
text ──► rules ──match──► done
           │ no match
           ▼
          JEV ──confidence ≥ τ──► done
           │ below τ
           ▼
          LLM (or "escalate to human")
```

`τ` (the confidence threshold) is tuned on the **train** split, never on test.

## Data flow

1. `scripts/download_banking77.py` fetches the CSVs into `data/` (git-ignored).
2. `config/service_map.yaml` maps each of the 77 intents to one service.
3. `bench/runner.py` streams test messages through a router and writes one JSONL line per decision to
   `results/runs/`.
4. `bench/metrics.py` turns a run into a summary table committed under `results/`.
