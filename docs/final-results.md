# Final results

**What was tested:** routing free-text banking support messages to one of 77 intents (Banking77),
each intent mapped to a handler in a fake bank. This is intent classification for a support box. The
results don't show anything about backend routing in general, other datasets or real customers.

The test split, **3,080 messages**, was run **once** on frozen code (decision D13). The rules stages,
the JEV request and model (`jev-1.13.0`), and the hybrid design and threshold were all fixed before the
test split was touched. The LLM baseline (`gpt-6-luna`, D14) was added afterwards as a separate run,
also once.

Every number below can be recomputed without API calls from the preserved raw runs:

```bash
pnpm analyze      # checks results/raw/SHA256SUMS, writes results/analysis.md
```

Sources: [`results/analysis.md`](../results/analysis.md) (intervals, paired comparison, referrals,
selections), [`results/summary.md`](../results/summary.md) (all metrics per router),
[`results/raw/`](../results/raw/) (original per-decision records). Charts: [`results/charts/`](../results/charts/).

## Headline (test split)

| | Rules | LLM (gpt-6-luna) | JEV | Hybrid |
|---|---:|---:|---:|---:|
| Exact action accuracy (95% CI) | 65.5% (63.8–67.1) | 81.5% (80.1–82.9) | 80.9% (79.4–82.2) | 74.1% (72.5–75.6) |
| Right service | 73.5% | 90.5% | 90.4% | 78.5% |
| Referred to a person | 17.0% | 0% | 0% | 18.3% |
| Accuracy on messages it answered | 78.9% | 81.5% | 80.9% | 90.7% |
| Safety-critical exact-intent precision | 84.4% | 81.6% | 77.6% | 91.7% |
| Safety-critical exact-intent recall | 57.0% | 86.5% | 79.5% | 66.5% |
| Calibration error (ECE, lower is better) | 0.211 | 0.087 | 0.090 | 0.072 |
| Latency p50 / p95 | 0.29 / 0.70 ms | 975 / 1,701 ms | 111 / 158 ms | 112 / 162 ms |
| Cost per 1,000 decisions | $0 | $0.028 | $0.083 | $0.083 |
| Router code (logical lines) | 772 | 95 | 60 | 888 |

- **Errors:** 0 in 12,320 test decisions.
- **Intervals:** 95% Wilson intervals over these messages. They don't capture model drift (the LLM has
  no pinned version), variation between repeated API runs, or other data.
- **Lines of code:** a router's own files plus the routers it is built from; the hybrid's 888 is 56
  of its own plus 772 rules plus 60 JEV. These count this implementation's integration code, not a
  model's complexity or the work of operating it. The rules were written append-only (fixes added as
  later, more specific rules, D10), which is not how a team would normally maintain them.
- **Safety-critical precision and recall** are exact-intent measures on the five freeze/block/sign-out
  intents. They don't show whether an appropriate protective action happened. A different protective
  action, or a person, may also have protected the customer.

![Rules effort curve vs JEV](../results/charts/effort-curve.svg)

## Hypotheses

| # | Hypothesis (written before measuring) | Verdict | Evidence |
|---|---|---|---|
| H1 | JEV is far more accurate than rules, with much less code | **Supported on this dataset** | 80.9% (79.4–82.2) vs 65.5% (63.8–67.1); 60 vs 772 lines of integration code |
| H2 | JEV is close to an LLM router in accuracy, ~10× faster and far cheaper | **Partly supported** | Accuracy within about 2 points: on the test split no difference was detected, on the held-out sample the LLM was detectably better (below). About 9× faster at p50. **Not cheaper:** the LLM cost about a third as much |
| H3 | JEV's confidence is meaningful: low confidence → more often wrong | **Supported, with a caveat** | Accuracy rises with confidence (23% → 92% across bins), but JEV is optimistic below 0.9 |
| H4 | The hybrid beats every single router overall | **Not established** | It had the highest accuracy on answered messages at an 18.3% referral rate, but JEV and the LLM were more accurate overall, and "overall" depends on what a referral costs, which was not measured |

## JEV vs the LLM

Both get the same input: the instruction, the 77 action ids with their one-line descriptions in
catalogue order, and the customer's message. No examples, no tuning.

**Test split:** the observed LLM advantage was 0.65 percentage points. The paired 95% confidence
interval ranged from −0.38 to +1.68 points (McNemar p = 0.24). No difference was detected. That is not
evidence that the two are equally accurate.

**Held-out sample (1,000 train messages):** the observed LLM advantage was 2.20 points. The paired 95%
confidence interval ranged from +0.19 to +4.21 points (McNemar p = 0.04), so here the LLM was
detectably more accurate.

Taken together, the LLM may be slightly more accurate than JEV on this task, by up to a few points.

| | JEV | LLM (gpt-6-luna) |
|---|---:|---:|
| Messages only this router got right (test) | 122 | 142 |
| Median / p95 time per decision | 111 / 158 ms | 975 / 1,701 ms |
| Cost per 1,000 decisions | $0.083 | $0.028 |
| Pinned model version | yes (`jev-1.13.0`) | no dated snapshot exists |
| Confidence | model probability | self-reported, rounded (no log-probabilities) |

The practical difference in this study was speed: about 0.1 s against about 1 s per decision. Cost
did not favour JEV: OpenAI bills cached input at a tenth of the price, and the 77-action list is the
same on every call. Both cost under $0.10 per 1,000 decisions.

![Accuracy vs speed](../results/charts/accuracy-vs-speed.svg)

## Accuracy against the number of referrals (exploratory)

The hybrid referred 564 messages (18.3%) to a person. For comparison, JEV and the LLM were each made
to refer **the same number of messages**: their 564 least confident, with ties broken by referring
the lower dataset index first. The analysis also reports how far accuracy could move if tied messages
at the cut were reordered.

| Router | Referred | Right on answered (95% CI) | Incorrect automatic selections | Referred set overlap with the hybrid's |
|---|---:|---|---:|---:|
| Hybrid | 564 | 90.7% (89.5–91.8) | 233 | – |
| JEV, confidence-gated | 564 | 88.8% (87.5–90.0) | 282 | 51.4% |
| LLM, confidence-gated | 564 | 87.7% (86.3–88.9) | 310 | 33.5% |
| Rules (own rate, not matched) | 525 | 78.9% (77.3–80.4) | 539 | 30.3% |

Read this with care:

- **Same number, different messages.** Matching the count equalises referral volume, not which
  messages were referred or how much effort a person needs for them. The referred sets overlap by
  only a third to a half.
- **Exploratory.** The JEV and LLM cut-offs were chosen on the test split to match a count; they were
  not fixed in advance. The hybrid's threshold was fixed on separate tuning data (D12).
- **Ties.** Reordering tied messages moves JEV's figure by 0.1 points and the LLM's by 0.8 points
  (87.3–88.1%), because the LLM reports rounded confidences.
- **Not "safe to automate".** At 90.7%, about one in eleven of the hybrid's automatic selections was
  wrong, and its safety-critical exact-intent recall was 66.5%.

![Accuracy vs referrals](../results/charts/accuracy-vs-workload.svg)

## Incorrect selections and handlers that can change state

The gateway runs the selected handler straight away (`POST /help`). 20 of the 77 handlers *can* change
bank state, for example by freezing a card or opening a claim (`src/catalog/effects.ts`, checked
against execution by `tests/effects.test.ts`); the rest return information.

On the test split, the hybrid made 233 incorrect selections; 32 of them selected a handler that can
change state. For JEV the figures were 589 and 110, for the LLM 569 and 91. Full table:
[`results/analysis.md`](../results/analysis.md).

These are **selections**, from prediction logs. Whether a selected handler would change anything
depends on the customer's accounts, and nothing was executed against real customer state. They are
not counts of observed harmful actions.

## What was not measured

- **Human resolution.** A referral only returns an escalation response with "Did you mean…?"
  suggestions. Whether a person then resolved the message, how quickly, and at what cost was not
  measured.
- **Real customers, other domains, other datasets.** Banking77 messages are short and carry one intent
  each.
- **Model drift and repeat-run variation for the LLM.** It was run once; JEV's repeat runs are below.

## The hybrid on the test split

| Stage | Share of messages | Accuracy |
|---|---:|---:|
| Rules and JEV agree | 62.9% | 93.4% |
| JEV alone (disagreement, confidence ≥ 0.9) | 18.8% | 81.9% |
| Referred to a person, with "Did you mean…?" suggestions | 18.3% | – |

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

\* Hybrid referrals count as misses here. Per-service samples are small (80–480 messages), so
differences of a few points are within noise.

![Accuracy by service](../results/charts/accuracy-by-service.svg)

## Calibration

![JEV calibration](../results/charts/jev-calibration.svg)

## Repeat runs (JEV, 200-message test subset)

| Run | Answers changed vs main run | Accuracy on subset |
|---|---:|---:|
| Main run | – | 81.0% |
| Same request, repeat 1 | 2.0% | 81.0% |
| Same request, repeat 2 | 0.5% | 80.5% |
| Options listed in reverse order | 5.0% | 79.0% |

JEV was highly but not perfectly repeatable, and option order had a small effect (TypeSafe documents a
lean towards the first option).

## Held-out sample vs test split

| | Held-out (1,000) | Test (3,080) |
|---|---:|---:|
| Rules exact action | 63.0% | 65.5% |
| JEV exact action | 78.5% | 80.9% |
| LLM exact action | 80.7% | 81.5% |
| Hybrid accuracy on answered | 89.8% | 90.7% |

Test results were close to the held-out results, which is consistent with no over-fitting to the
held-out sample.

## Spend

Total API spend for the project: **$0.81** on TypeSafe (about 9,800 JEV calls) and **$0.11** on
OpenAI (4,080 LLM calls), plus a few smoke-test calls.

## Reproduce

Without API calls, from the preserved runs:

```bash
pnpm analyze                                                   # intervals, paired comparison, referrals, selections
pnpm report --dir results/raw --match _test_3080 --out results/summary.md --title "Final benchmark: Banking77 test split"
pnpm charts
```

Re-running the routers (needs API keys; new runs go to `results/runs/` and may differ):

```bash
pnpm bench --router rules  --split test --final --sample all
pnpm bench --router jev    --split test --final --sample all   # TYPESAFE_API_KEY
pnpm bench --router llm    --split test --final --sample all   # OPENAI_API_KEY
pnpm bench --router hybrid --split test --final --sample all
pnpm consistency
```
