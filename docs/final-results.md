# Final results (Phase 7)

The Banking77 test split, **3,080 messages**, run **once** on frozen code (decision D13): the rules
stages, JEV request and model (`jev-1.13.0`), and the hybrid design and threshold were all fixed
before the test split was touched. The LLM baseline (Phase 4, `gpt-6-luna`, decision D14) was added
afterwards as a separate run, also once; nothing measured before it was changed.

Full tables: [`results/summary.md`](../results/summary.md). Charts: [`results/charts/`](../results/charts/).

## Headline

| | Rules | LLM (gpt-6-luna) | JEV | Hybrid |
|---|---:|---:|---:|---:|
| Exact action accuracy | 65.5% | **81.5%** | 80.9% | 74.1% |
| Right microservice | 73.5% | **90.5%** | 90.4% | 78.5% |
| Handed to a person | 17.0% | 0% | 0% | 18.3% |
| **Accuracy on what it answers** | 78.9% | 81.5% | 80.9% | **90.7%** |
| Safety-critical precision (a card freeze was right) | 84.4% | 81.6% | 77.6% | **91.7%** |
| Safety-critical recall (lost/compromised cases caught) | 57.0% | **86.5%** | 79.5% | 66.5% |
| Calibration error (ECE, lower is better) | 0.211 | 0.087 | 0.090 | **0.072** |
| Latency p50 / p95 | **0.29 / 0.70 ms** | 975 / 1,701 ms | 111 / 158 ms | 112 / 162 ms |
| Cost per 1,000 decisions | **$0** | $0.028 | $0.083 | $0.083 |
| Dispatcher code (logical lines) | 772 | 95 | **60** | 888 (772 rules + 60 JEV + 56 glue) |

Errors: 0 in 12,320 test decisions.

![Rules effort curve vs JEV](../results/charts/effort-curve.svg)

![Accuracy vs human workload](../results/charts/accuracy-vs-workload.svg)

## Hypotheses

| # | Hypothesis | Verdict | Deciding numbers |
|---|---|---|---|
| H1 | JEV is far more accurate than rules, with much less code | **Confirmed** | 80.9% vs 65.5% exact action; 60 vs 772 lines |
| H2 | JEV is close to an LLM router in accuracy, ~10× faster and far cheaper | **Partly confirmed** | Accuracy tied (80.9% vs 81.5%, not significant); 9× faster at p50, 11× at p95; but **not cheaper**: the LLM costs a third as much because its fixed 77-action prompt is cached |
| H3 | JEV's confidence is meaningful: low confidence → more often wrong | **Confirmed, with a caveat** | Accuracy rises with confidence (23% → 92% across bins), but it is optimistic below 0.9; thresholds must come from data |
| H4 | The hybrid beats every single dispatcher overall | **Mixed** | Best accuracy on answered (90.7% vs 80.9% / 78.9%) and best safety precision (91.7%) at ~18% human workload; JEV alone has the best raw accuracy (no escalations) and needs 15× less code |

## JEV vs the LLM

Both get exactly the same input: the instruction, the 77 action ids with their one-line
descriptions in catalogue order, and the customer's message. No examples, no tuning.

| | JEV | LLM (gpt-6-luna) |
|---|---:|---:|
| Exact action accuracy (test) | 80.9% | 81.5% |
| Exact action accuracy (held-out 1,000) | 78.5% | 80.7% |
| Messages only JEV got right / only the LLM got right | 122 | 142 |
| Paired significance (McNemar) | | p ≈ 0.24, **no real difference** |
| Act only when confidence ≥ 0.9: share answered / right | 72.2% / 91.8% | 71.2% / 90.8% |
| Act only when confidence ≥ 0.8: share answered / right | 80.0% / 89.3% | 84.0% / 86.9% |
| Median / p95 time per decision | **111 / 158 ms** | 975 / 1,701 ms |
| Cost per 1,000 decisions | $0.083 | **$0.028** |
| Pinned model version | **yes** (`jev-1.13.0`) | no dated snapshot exists |

They agree on 88.7% of messages and are 86.7% right when they do. The LLM's confidence is
self-reported (gpt-6-luna has no log-probabilities), yet it is about as useful as JEV's as a gate.

**What this means.** On accuracy, a cheap zero-shot LLM and JEV are interchangeable here. The real
difference is speed: JEV answers in about a tenth of a second, the LLM in about a second, which
matters for a dispatcher that sits in front of every request. Cost is not a reason to pick JEV at this
scale: the LLM is cheaper because OpenAI bills cached input at a tenth of the price, and the
77-action list is identical on every call. Both are cheap: under $0.10 per 1,000 decisions.

![Accuracy vs speed](../results/charts/accuracy-vs-speed.svg)

## The hybrid on the test split

| Stage | Share of messages | Accuracy |
|---|---:|---:|
| Rules and JEV agree | 62.9% | 93.4% |
| JEV alone (disagreement, confidence ≥ 0.9) | 18.8% | 81.9% |
| Handed to a person, with "Did you mean…?" suggestions | 18.3% | – |

## By service (exact action accuracy)

| Service | n | Rules | JEV | Hybrid* |
|---|---:|---:|---:|---:|
| Account | 80 | 76.3% | 100.0% | 100.0% |
| ATM & Cash | 280 | 70.7% | 85.4% | 80.4% |
| Card Payments | 320 | 63.1% | 82.5% | 74.7% |
| Cards | 480 | 65.4% | 76.9% | 69.6% |
| Disputes | 200 | 78.5% | 86.5% | 83.0% |
| FX | 200 | 75.0% | 79.0% | 74.5% |
| Identity | 240 | 62.1% | 90.8% | 81.3% |
| Security | 240 | 71.3% | 92.1% | 83.8% |
| Top-up | 440 | 60.2% | 75.2% | 69.5% |
| Transfers | 440 | 54.5% | 67.3% | 58.9% |
| Virtual Cards | 160 | 68.1% | 88.8% | 80.6% |

\* Hybrid escalations count as misses here; see the headline table for accuracy on answered.

![Accuracy by service](../results/charts/accuracy-by-service.svg)

## Calibration

![JEV calibration](../results/charts/jev-calibration.svg)

## Consistency (JEV, 200-message test subset)

| Run | Answers changed vs main run | Accuracy on subset |
|---|---:|---:|
| Main run | – | 81.0% |
| Same request, repeat 1 | 2.0% | 81.0% |
| Same request, repeat 2 | 0.5% | 80.5% |
| Options listed in reverse order | 5.0% | 79.0% |

JEV is highly but not perfectly repeatable, and option order has a small real effect (TypeSafe
documents a lean towards the first option). Neither changes any conclusion.

## Consistency with the held-out sample

| | Held-out (1,000) | Test (3,080) |
|---|---:|---:|
| Rules exact action | 63.0% | 65.5% |
| JEV exact action | 78.5% | 80.9% |
| LLM exact action | 80.7% | 81.5% |
| Hybrid accuracy on answered | 89.8% | 90.7% |

Test results match the development measurements, so nothing was over-fitted to the held-out sample.

## Spend

Total API spend for the whole project so far: **$0.81** on TypeSafe (about 9,800 JEV calls) and
**$0.11** on OpenAI (4,080 LLM calls), plus a few smoke-test calls.

## Reproduce

```bash
pnpm bench --router rules  --split test --final --sample all
pnpm bench --router jev    --split test --final --sample all
pnpm bench --router llm    --split test --final --sample all   # OPENAI_API_KEY
pnpm bench --router hybrid --split test --final --sample all
pnpm consistency
pnpm report --match _test_3080 --out results/summary.md --title "Final benchmark: Banking77 test split"
pnpm charts
```
