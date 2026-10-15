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
| Kestrel Bank: 77 actions (Banking77 intents) across 11 microservices | Real microservice backends (handlers are stubs) |
| Routers: rules, LLM, JEV, hybrid | Fine-tuned baseline (cited from Glean instead) |
| Banking77 test split (3,080 messages) | Trading domain (planned as part 2) |
| Accuracy, latency, cost, LOC, calibration | Production deployment, UI |

## Metrics

1. **Accuracy**: correct action out of 77 (strict) and correct microservice (lenient).
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
  on the train split only. All dispatchers run on test in Phase 7, once, with everything frozen.
- **Same information for every router.** LLM and JEV see the identical service and action descriptions
  from `src/catalog/`.
- **An invalid or missing answer counts as wrong**, except an explicit abstain, which is reported
  separately.
- **Every number in the report is reproducible** from a committed command and pinned model versions.

## Phases and acceptance criteria

Order: the product and harness need no API keys; JEV is tested early as a go/no-go gate.

### Phase 0: Foundation ✅
- [x] Repo, docs, dispatcher contract, dataset download, CI green.

### Phase 1: Product (Kestrel Bank) ✅
- [x] All 77 intents assigned to exactly one action and service (enforced by a test).
- [x] Every service owns at least 2 actions; every service and action has a one-line description.
- [x] `docs/product.md` explains the product and the deliberately hard boundaries.
- [x] Fake bank seeded with four demo customers and their stories.
- [x] All 77 handlers implemented; every handler answers every demo customer (tested).
- [x] `POST /help` gateway with an injected dispatcher; abstain escalates to a human.
- [x] End to end with an oracle dispatcher on 500 real Banking77 messages.

### Phase 2: Measurement harness ✅
- [x] Fixed, seeded stratified train samples (300 and 1,000 messages), identified by row index.
- [x] Runner records action, confidence, latency and cost per decision; resumable; errors recorded, never dropped.
- [x] Metrics: action and service accuracy, abstain and error rates, p50/p95 latency, cost per 1,000,
      calibration (ECE), per-service accuracy and confusion, safety-critical precision and recall.
- [x] `scripts/count-loc.ts` counts logical lines of code (no blanks or comments) per dispatcher.
- [x] `pnpm report` renders a Markdown report from runs; verified with oracle (100%) and random (≈1/77).
- [x] The test split refuses to run without `--final`.

### Phase 3: JEV dispatcher (go/no-go gate)
- [ ] Uses the catalogue's service and action descriptions only.
- [ ] Returns the chosen action and its probability as `confidence`; cost and latency recorded.
- [ ] Run on the 300-message train sample.
- [ ] **Gate:** results reviewed together before continuing.

### Phase 4: LLM dispatcher
- [ ] Model and version pinned; temperature 0; structured output.
- [ ] Prompt built from the catalogue only; no train examples (zero-shot, like JEV).
- [ ] Token usage and cost recorded per decision; retries and rate limits handled, failures logged.
- [ ] Run on the same 300-message train sample.

### Phase 5: Rules dispatcher (effort curve) ✅
- [x] Written from the train split only (dev part), in 8 append-only stages; effort log in
      `docs/rules-effort-log.md` (rules and lines per stage).
- [x] Accuracy measured after each stage on the held-out 1,000-message train sample: the
      accuracy-vs-LOC curve (`pnpm rules:curve`). Final: 63.0% action accuracy, 772 lines.
- [x] Abstains when no rule matches (20% of messages).
- [x] Disclosed as written by an AI coding assistant; awaiting review by the project author.
- [x] The product runs end to end on the rules: `pnpm dev`, `pnpm demo`.

### Phase 6: Hybrid
- [ ] Order: rules → JEV (accept if confidence ≥ τ) → LLM.
- [ ] τ chosen on the 1,000-message train sample from an accuracy-vs-fallback curve; frozen in
      `docs/decisions.md` before Phase 7.
- [ ] Each decision records which stage answered.

### Phase 7: Final benchmark and report
- [ ] All dispatchers run once on the full 3,080-message test split.
- [ ] Consistency: a 200-message subset re-run 3 times for LLM and JEV; changed answers reported.
- [ ] `results/summary.md`: action and service accuracy, p50/p95 latency, cost per 1,000, LOC,
      abstain and fallback rates, safety-critical precision.
- [ ] Charts: accuracy vs cost, accuracy vs latency, JEV calibration, hybrid curve, rules effort curve.
- [ ] Each hypothesis marked confirmed / rejected / mixed, with the deciding number.
- [ ] Total API spend recorded.

### Phase 8: Day-2 change (crypto)
- [ ] Three crypto actions as in `docs/product.md` §12, with a disclosed labelled set.
- [ ] Lines changed, accuracy on new actions and regressions on the original 77, per dispatcher.

### Phase 9: Router Arena
- [ ] One page: a message, four dispatchers side by side, the bank's answer.
- [ ] Replay mode from final results (public); live mode with local keys.

### Phase 10: Go public
- [ ] README rewritten around the results; quick start verified from a fresh clone.
- [ ] No secrets in history; `.env` never committed.
- [ ] Repository made public; LinkedIn post drafted and reviewed, citing Glean and Banking77.
