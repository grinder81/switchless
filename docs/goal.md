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

## Ground rules (apply to every phase)

- **The test split is touched once.** Rules, prompts, option descriptions and thresholds are developed
  on the train split only. All four routers run on test in Phase 6, once, with everything frozen.
- **Same information for every router.** LLM and JEV see the identical service names and descriptions
  from `config/service_map.yaml`.
- **An invalid or missing answer counts as wrong**, except an explicit abstain, which is reported
  separately.
- **Every number in the report is reproducible** from a committed command and pinned model versions.

## Phases and acceptance criteria

### Phase 0: Foundation ✅
- Repo, docs, router contract, harness skeleton, dataset download, CI green.

### Phase 1: Service map
- [ ] All 77 intents assigned to exactly one service (enforced by a test).
- [ ] Every service owns at least 2 intents; every service has a one-line description.
- [ ] `docs/service_map.md` explains the grouping and lists the deliberately hard boundaries
      (e.g. `card_arrival` vs `card_delivery_estimate` within a service is fine; pairs that straddle
      two services are listed explicitly).
- [ ] Train-split class balance per service reported.

### Phase 2: Rules router
- [ ] Written using the train split only; development time is time-boxed and recorded.
- [ ] Returns `service=None` (abstain) when no rule matches, instead of guessing.
- [ ] `scripts/count_loc.py` reports logical lines of code (no blanks, comments or docstrings) per router.
- [ ] Train-split service accuracy and abstain rate reported.

### Phase 3: LLM router
- [ ] Model and version pinned in config; temperature 0; structured output (tool call / JSON schema).
- [ ] Prompt built from the service map only; no train examples in the prompt (zero-shot, like JEV).
- [ ] Token usage and cost recorded per decision from the API response.
- [ ] Retries and rate limiting handled; failures logged, never silently dropped.
- [ ] Validated on a fixed 300-message stratified sample of train.

### Phase 4: JEV router
- [ ] Uses the same service names and descriptions as the LLM router.
- [ ] Returns the chosen service plus its probability as `confidence`.
- [ ] Cost and latency recorded per decision.
- [ ] Validated on the same 300-message train sample as Phase 3.

### Phase 5: Hybrid
- [ ] Order: rules → JEV (accept if confidence ≥ τ) → LLM.
- [ ] τ chosen on a 1,000-message stratified train sample; an accuracy-vs-fallback-rate curve is
      produced; τ is frozen and recorded in `docs/decisions.md` before Phase 6.
- [ ] Each decision records which stage answered.

### Phase 6: Benchmark and report
- [ ] All four routers run once on the full 3,080-message test split.
- [ ] Consistency check: a 200-message subset re-run 3 times for LLM and JEV; the rate of changed
      answers is reported.
- [ ] `results/summary.md` contains one table per metric: service accuracy, intent accuracy (where
      applicable), p50/p95 latency, cost per 1,000 decisions, LOC, abstain/fallback rates.
- [ ] Charts: accuracy vs cost, accuracy vs latency, calibration (confidence vs actual accuracy for JEV),
      hybrid accuracy-vs-fallback curve.
- [ ] Each hypothesis marked confirmed / rejected / mixed, with the number that decides it.
- [ ] Total API spend for the project recorded.

### Phase 7: Go public
- [ ] README rewritten around the results; quick start verified from a fresh clone.
- [ ] No secrets in history; `.env` never committed.
- [ ] Repository made public.
- [ ] LinkedIn post drafted and reviewed; it cites Glean and Banking77 and links the repo.
