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
text ──► rules ─┐
                 ├─ same action ──────────────► done (agreement)
text ──► JEV ────┘
                 └─ different ─► JEV confidence ≥ 0.9 ──► done (JEV)
                                 └─ below ─► human, with "Did you mean…?" buttons
```

The design and threshold were chosen on a separate train tuning sample (decision D12), never on test.

## Code map

| Path | Role |
|---|---|
| `src/catalog/` | 11 services, 77 actions: the single source of truth |
| `src/bank/` | fake bank: types, policy, seed data, in-memory store |
| `src/services/` | the 77 handlers, one file per service, plus the action registry |
| `src/gateway/app.ts` | `POST /help`: dispatcher → handler, or escalate on abstain |
| `src/routers/` | dispatchers and the registry; `oracle` and `random` are reference points, never benchmarked as results |
| `src/routers/rules.ts`, `src/routers/rules/` | the hand-written dispatcher: a small engine plus 8 append-only rule stages |
| `src/bench/` | stratified sampling, resumable runner, metrics, Markdown report |

## Data flow

1. `scripts/download-banking77.ts` fetches the CSVs into `data/` (git-ignored).
2. `src/catalog/` defines the 11 services and 77 actions; each action maps to one Banking77 intent.
3. `src/bench/runner.ts` streams messages through a router and writes one JSON line per decision to
   `results/runs/`.
4. `src/bench/metrics.ts` turns a run into summary metrics committed under `results/`.
