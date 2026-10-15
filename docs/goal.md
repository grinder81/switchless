# Project goal

## One sentence

Show, on a public and reproducible benchmark, that the hand-written "core router" in a microservice
system can be replaced by a zero-shot decision model (JEV): less code, faster and cheaper than an LLM
router, and safe in production through a hybrid with a confidence fallback.

## Question

For routing customer requests to the right microservice, how do hand-written rules, an LLM router and
JEV compare on accuracy, speed, cost and code, and does a rules → JEV → LLM hybrid give the best
overall result?

## Hypotheses (written before measuring)

1. JEV is far more accurate than hand-written rules, with much less code.
2. JEV is close to the LLM router in accuracy, but roughly 10× faster and far cheaper per 1,000 decisions.
3. JEV's confidence is meaningful: low-confidence decisions are measurably more likely to be wrong.
4. The hybrid beats every single router overall.

Any of these may turn out false. Results are published either way.

## Scope

| In scope | Out of scope |
|---|---|
| Banking77, 77 intents → ~12 fictional microservices | Real microservice backends (handlers are stubs) |
| Routers: rules, LLM, JEV, hybrid | Fine-tuned baseline (cited from Glean instead) |
| Banking77 test split (3,080 messages) | Trading domain (planned as part 2) |
| Accuracy, latency, cost, LOC, calibration | Production deployment, UI |

## Metrics

1. **Accuracy**: correct microservice (business metric) and correct intent out of 77 (harder metric).
2. **Latency**: p50 and p95 per decision.
3. **Cost** per 1,000 decisions.
4. **Lines of code** per router (logical lines, excluding shared harness).
5. **Behaviour when unsure**: rate of confidently-wrong decisions; accuracy vs. fallback rate as the
   confidence threshold changes.

## Deliverables

1. This repository, public, with a reproducible harness.
2. A results report with charts.
3. A LinkedIn write-up.

## Phases and acceptance criteria

_To be defined together before implementation starts._
