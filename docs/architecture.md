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

Every router implements one method (see `src/routers/types.ts`):

```ts
route(text: string): Promise<Decision>
```

`Decision` carries:

| Field | Meaning |
|---|---|
| `action` | chosen action id (one of 77, e.g. `cards.track_delivery`), or `null` to abstain |
| `confidence` | 0–1; rules report 1 on a match, LLM and JEV report their own confidence |
| `latencyMs` | wall-clock time of the decision |
| `costUsd` | API cost of the decision (0 for rules) |
| `router` | which router (or hybrid stage) made the final call |

Accuracy is scored at two levels: the exact action (strict) and the owning service (lenient).

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

1. `scripts/download-banking77.ts` fetches the CSVs into `data/` (git-ignored).
2. `src/catalog/` defines the 11 services and 77 actions; each action maps to one Banking77 intent.
3. `src/bench/runner.ts` streams messages through a router and writes one JSON line per decision to
   `results/runs/`.
4. `src/bench/metrics.ts` turns a run into summary metrics committed under `results/`.
