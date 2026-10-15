# Final results (Phase 7)

The Banking77 test split, **3,080 messages**, run **once** on frozen code (decision D13): the rules
stages, JEV request and model (`jev-1.13.0`), and the hybrid design and threshold were all fixed
before the test split was touched. The LLM baseline (Phase 4) will be added to this report as a
separate run without changing anything below.

Full tables: [`results/summary.md`](../results/summary.md). Charts: [`results/charts/`](../results/charts/).

## Headline

| | Rules | JEV | Hybrid |
|---|---:|---:|---:|
| Exact action accuracy | 65.5% | **80.9%** | 74.1% |
| Right microservice | 73.5% | **90.4%** | 78.5% |
| Handed to a person | 17.0% | 0% | 18.3% |
| **Accuracy on what it answers** | 78.9% | 80.9% | **90.7%** |
| Safety-critical precision (a card freeze was right) | 84.4% | 77.6% | **91.7%** |
| Safety-critical recall (lost/compromised cases caught) | 57.0% | **79.5%** | 66.5% |
| Calibration error (ECE, lower is better) | 0.211 | 0.090 | **0.072** |
| Latency p50 / p95 | **0.29 / 0.70 ms** | 111 / 158 ms | 112 / 162 ms |
| Cost per 1,000 decisions | **$0** | $0.083 | $0.083 |
| Dispatcher code (logical lines) | 772 | **60** | 888 (772 rules + 60 JEV + 56 glue) |

Errors: 0 in 9,240 test decisions.

![Rules effort curve vs JEV](../results/charts/effort-curve.svg)

![Accuracy vs human workload](../results/charts/accuracy-vs-workload.svg)

## Hypotheses

| # | Hypothesis | Verdict | Deciding numbers |
|---|---|---|---|
| H1 | JEV is far more accurate than rules, with much less code | **Confirmed** | 80.9% vs 65.5% exact action; 60 vs 772 lines |
| H2 | JEV is close to an LLM router in accuracy, ~10× faster and far cheaper | **Pending** | Needs the LLM baseline (Phase 4) |
| H3 | JEV's confidence is meaningful: low confidence → more often wrong | **Confirmed, with a caveat** | Accuracy rises with confidence (23% → 92% across bins), but it is optimistic below 0.9; thresholds must come from data |
| H4 | The hybrid beats every single dispatcher overall | **Mixed** | Best accuracy on answered (90.7% vs 80.9% / 78.9%) and best safety precision (91.7%) at ~18% human workload; JEV alone has the best raw accuracy (no escalations) and needs 15× less code |

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
| Hybrid accuracy on answered | 89.8% | 90.7% |

Test results match the development measurements, so nothing was over-fitted to the held-out sample.

## Spend

Total TypeSafe API spend for the whole project so far: **$0.81** (about 9,800 JEV calls), plus a few
smoke-test calls.

## Reproduce

```bash
pnpm bench --router rules  --split test --final --sample all
pnpm bench --router jev    --split test --final --sample all
pnpm bench --router hybrid --split test --final --sample all
pnpm consistency
pnpm report --match _test_3080 --out results/summary.md --title "Final benchmark: Banking77 test split"
pnpm charts
```
