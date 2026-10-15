# Hybrid dispatcher: results (Phase 6)

## How it was chosen

Decision D12 was written before tuning: compare four designs over confidence thresholds on a
**tuning sample** (1,000 train messages, seed 7, disjoint from the held-out sample), and pick the
highest accuracy on automatically answered messages with at most 20% escalated to a human.

Tuning results (`pnpm hybrid:tune`), best setting per design within the budget:

| Design | Setting | Escalated | Accuracy on answered |
|---|---:|---:|---:|
| Rules alone (reference) | – | 16.5% | 78.1% |
| Rules first, then JEV | 0.99 | 10.2% | 79.1% |
| JEV first, then rules | 0.9 | 7.0% | 83.4% |
| JEV only | 0.75 | 18.1% | 85.7% |
| **Agreement** | **0.9** | **18.9%** | **87.7%** |

**Agreement** won: if the rules and JEV choose the same action, act; if they disagree, act on JEV
only when its confidence is at least 0.9; otherwise hand over to a person, with JEV's top guesses
offered as "Did you mean…?" buttons. It was frozen in `src/routers/hybrid.ts` before the held-out run.

The original plan, "rules first", came out worst: the rules' answers are less reliable than a
confident JEV, so trusting them first lets their mistakes through.

Caveat: the tuning messages come from the part of the train split the rules were written from, so
rules look slightly better on tuning (65.2%) than on held-out (63.0%). That biases tuning *towards*
rules-heavy designs, and agreement still won.

## Held-out results (same 1,000 messages as rules and JEV)

| | Rules | JEV | **Hybrid** |
|---|---:|---:|---:|
| Escalated to a human | 20.0% | 0% | 20.6% |
| Accuracy on answered | 78.8% | 78.6% | **89.8%** |
| Action accuracy (all messages) | 63.0% | 78.5% | 71.3% |
| Safety-critical precision | 75.0% | 68.9% | **86.8%** |
| Safety-critical recall | 38.7% | 67.7% | 53.2% |
| Latency p50 | 0.34 ms | 114 ms | 110 ms |
| Cost per 1,000 | $0 | $0.083 | $0.083 |
| Calibration error (ECE) | 0.213 | 0.105 | 0.077 |

"Action accuracy (all messages)" counts escalations as misses; for a support product the better
reading is accuracy on what is answered automatically at a fixed human workload, where the hybrid is
**11 points** better than rules at the same ~20% escalation.

### Where the decisions came from

| Stage | Share of messages | Accuracy |
|---|---:|---:|
| Rules and JEV agree | 58.9% | 93.5% |
| JEV alone (disagreement, confidence ≥ 0.9) | 20.5% | 79.0% |
| Handed to a person | 20.6% | – |

Agreement is the strong signal: the two dispatchers fail in different ways, so when they agree they
are rarely both wrong. Safety-critical precision rises to 86.8%: far fewer cards frozen by mistake,
because uncertain cases go to a person instead.

## What the hybrid costs

- **Code.** The hybrid keeps both dispatchers (772 lines of rules + 47 lines for JEV + ~45 lines of
  glue). It trades code for reliability; JEV alone is the minimal-code option.
- **Latency and cost.** Agreement needs JEV on every message, so it is as slow and as cheap as JEV.
  A rules-first design would skip 83% of JEV calls, but it was the least accurate.

## The "Did you mean…?" step

When the hybrid hands over, `POST /help` returns JEV's top guesses as `suggestions`; the client shows
them as buttons, and a click calls `POST /action { customerId, action }`, which runs that action
directly with no dispatcher. Rules cannot offer this: they have no ranked alternatives.

## Reproduce

```bash
pnpm bench --router rules --set tuning && pnpm bench --router jev --set tuning
pnpm hybrid:tune
pnpm bench --router hybrid --sample 1000
```
