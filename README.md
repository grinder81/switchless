# switchless

**Routing banking support messages: hand-written rules vs a zero-shot decision model vs an LLM.**

A bank's support box gets free-text messages ("my card still hasn't arrived", "I don't recognise this
payment") and has to decide which of its actions should handle each one. This project builds a small
fictional bank with 77 actions, writes that routing decision four ways, and measures them on the 3,080
test messages of [Banking77](https://huggingface.co/datasets/PolyAI/banking77), a public dataset of
banking customer messages labelled with 77 intents.

| | Router | What it is |
|---|---|---|
| 🟠 | **Rules** | Hand-written keyword and pattern rules |
| 🔵 | **JEV** | [JEV](https://docs.langchain.com/oss/python/integrations/providers/typesafe) by TypeSafe AI, a zero-shot decision model |
| 🟡 | **LLM** | OpenAI `gpt-6-luna`, a fast, low-cost general-purpose model |
| 🟢 | **Hybrid** | Rules and JEV together; when they disagree and JEV isn't confident, the message is referred to a person |

JEV and the LLM get no training examples: only the message and a one-line description of each action.

## What we found

- **JEV and the LLM were far more accurate than the rules:** 81% and 82% of messages routed to the
  exact right action, against 66% for 772 lines of rules.
- **JEV and the LLM were close in accuracy, and JEV was about 9× faster** (0.1 s vs 1 s per message).
  On the test set the LLM was 0.65 points ahead (95% CI −0.38 to +1.68); on a separate 1,000-message
  sample it was 2.2 points ahead (95% CI +0.19 to +4.21). So the LLM may be slightly more accurate.
- **JEV was not cheaper:** the LLM cost about a third as much. Both cost under $0.10 per 1,000 messages.
- **Referring uncertain messages trades workload for accuracy.** The hybrid referred 18% of messages to
  a person and got 91% of the rest right. That still means about one wrong automatic choice in eleven.
  What happens after a referral was not measured.

## Scoreboard

Banking77 test set, 3,080 messages, each router run once on frozen code. Accuracy in brackets is the
95% confidence interval.

| | 🟠 Rules | 🔵 JEV | 🟡 LLM | 🟢 Hybrid |
|---|---:|---:|---:|---:|
| **Exact right action** | 66% (64–67) | 81% (79–82) | 82% (80–83) | 74% (73–76) |
| **Right service** | 74% | 90% | 91% | 79% |
| Referred to a person | 17% | 0% | 0% | 18% |
| **Right on messages it answered** | 79% | 81% | 82% | 91% |
| Time per message (median) | 0.3 ms | 111 ms | 975 ms | 112 ms |
| Cost per 1,000 messages | free | $0.08 | $0.03 | $0.08 |
| Lines of router code | 772 | 60 | 95 | 888 |

Lines of code: a router's own files plus any routers it is built from (the hybrid includes the rules
and JEV). This is the integration code in this project, not a measure of a model's complexity or what
it takes to run it in production.

## In pictures

### More rule-writing stopped paying off; JEV started higher

The orange line is the rules router after each of eight rounds of rule-writing, on a 1,000-message
development sample. JEV is a single 60-line integration.

![Rules effort curve vs JEV](results/charts/effort-curve.svg)

### JEV was about 9× faster; accuracy was close

![Accuracy vs speed](results/charts/accuracy-vs-speed.svg)

### Referring more messages raises accuracy on the rest

JEV's line shows its accuracy if it only answers above a confidence threshold. The thresholds were
swept on the test set, so this is exploratory.

![Accuracy vs referrals](results/charts/accuracy-vs-workload.svg)

### JEV was more accurate than the rules in every service

![Accuracy by service](results/charts/accuracy-by-service.svg)

### Higher JEV confidence went with higher accuracy

When JEV was at least 90% confident it was right 92% of the time, but below that it was optimistic, so
any threshold has to be set from data.

![JEV calibration](results/charts/jev-calibration.svg)

## What this does and doesn't show

**It shows**, on one public dataset, that for routing short free-text banking messages to 77 intents:

- a zero-shot model given only one-line descriptions beat a substantial hand-written rule set;
- JEV and a low-cost LLM were close in accuracy, with JEV much faster;
- confidence scores can be used to refer uncertain messages, at the cost of more referrals.

**It doesn't show:**

- **Production safety.** The gateway runs the chosen handler immediately, and 20 of the 77 handlers
  can change account state (freeze a card, open a claim). The prediction logs show how often a router
  *selected* such a handler wrongly, not what that would have done to a real customer
  ([details](docs/final-results.md#incorrect-selections-and-handlers-that-can-change-state)).
- **Human resolution.** A referral only returns "Did you mean…?" suggestions. Whether a person then
  resolved the message, and at what cost, was not measured.
- **Equivalence of JEV and the LLM.** "No difference detected" on the test set is not the same as "equally
  accurate"; the held-out sample did detect a small LLM advantage.
- **Other domains or backend routing in general.** Banking77 messages are short and single-intent.

## How it works

```
customer message ──▶ POST /help ──▶ router (rules | jev | llm | hybrid) ──▶ one of 77 actions
                                                                          ├─▶ handled by 1 of 11 services
                                                                          └─▶ or referred, with "Did you mean…?"
```

The product is **Kestrel Bank**, a fictional digital bank with a free-text help box, 11 services and
77 actions, one per Banking77 intent ([product](docs/product.md), [action catalogue](docs/action-catalog.md)).

## Check the numbers

The original per-decision records of every run are committed in [`results/raw/`](results/raw/) with
SHA-256 hashes. One command recomputes the intervals, the paired comparison, the referral comparison
and the handler classification from them, with no API calls:

```bash
pnpm install
pnpm analyze        # verifies results/raw/SHA256SUMS, writes results/analysis.md
```

## Try it

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm data:download     # Banking77, pinned to a commit and checked by SHA-256
pnpm test
pnpm demo              # four customer stories, end to end
pnpm dev               # local server on :3000 → POST /help {"customerId","message"}
                       # DISPATCHER=rules|jev|llm|hybrid
```

Re-running the routers needs `TYPESAFE_API_KEY` (JEV) and `OPENAI_API_KEY` (LLM); behind an HTTP
proxy, also set `NODE_USE_ENV_PROXY=1`. New runs go to `results/runs/` and may differ from the
preserved ones. The whole study cost about $0.92 in API calls.

```bash
pnpm bench --router rules --sample 1000     # also: jev, llm, hybrid
pnpm report                                 # tables for every local run
```

## Read more

| Document | What's inside |
|---|---|
| [Final results](docs/final-results.md) | Every number, the hypotheses, intervals and limitations |
| [Analysis](results/analysis.md) | Generated statistics from the raw runs |
| [Raw runs](results/raw/README.md) | What was recorded, what was reconstructed, and provenance |
| [Decisions](docs/decisions.md) | Methodology choices, written down before the results |
| [Rules effort log](docs/rules-effort-log.md) | How the hand-written rules were built, round by round |
| [Architecture](docs/architecture.md) | How the gateway, routers and services fit together |
| [JEV](docs/jev-results.md) · [Hybrid](docs/hybrid-results.md) | Development results for each router |
| [References](docs/references.md) | Prior work, including Glean's [*Jev and the return of the zero-shot classifier*](https://www.glean.com/blog/jev-zero-shot-classifier) |

<details>
<summary>Repository layout</summary>

```
src/
  catalog/    the 11 services, 77 actions, and which handlers can change state
  bank/       a fake in-memory bank: customers, cards, balances, policy
  services/   the 77 action handlers, one file per service
  gateway/    POST /help and POST /action
  routers/    rules, jev, llm, hybrid: all implement the same interface
  bench/      sampling, runner, metrics, report, analysis
scripts/      benchmark, analysis, report, charts, demo, dataset download
tests/        unit tests for routers, handlers, harness and analysis
docs/         product, results and methodology
results/      raw runs (with hashes), generated analysis, summary and charts
```

</details>

## How this was made

The experiment was framed and directed by the author (grinder81): the question, the dataset, no
fine-tuned baseline, a product before any model, AI-written rules with a recorded effort curve, the
choice of LLM, and a review of every phase before merging. Most of the code, the rules and the
measurement method were written by an AI coding assistant (Claude); see the
[decisions log](docs/decisions.md). The claims were narrowed after an independent review.

## License

Code: MIT. Banking77: CC-BY-4.0, © PolyAI. Message text appears in `results/raw/` under that licence.
