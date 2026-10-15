# switchless

**Can a decision model replace the hand-written router at the heart of a backend?**

Every backend has a piece of code that reads an incoming request and decides which service should
handle it. It starts as a `switch` statement and grows into hundreds of lines of rules that nobody
wants to touch. This project builds a small banking product, writes that router four different
ways, and measures them on 3,080 real customer messages.

The four contenders:

| | Router | What it is |
|---|---|---|
| 🟠 | **Rules** | Hand-written keyword and pattern rules: the traditional way |
| 🔵 | **JEV** | [JEV](https://docs.langchain.com/oss/python/integrations/providers/typesafe) by TypeSafe AI, a zero-shot decision model |
| 🟡 | **LLM** | OpenAI `gpt-6-luna`, a fast, cheap general-purpose model |
| 🟢 | **Hybrid** | Rules and JEV together; when they disagree and JEV is unsure, a person decides |

JEV and the LLM get no training data. Each is given only the customer's message and a one-line
description of each of the 77 things the bank can do.

## The short answer

- **JEV replaces 772 lines of rules with 60, and is right far more often** (81% vs 66%).
- **JEV is as accurate as an LLM** (81% vs 82%, a statistical tie) **and about 9× faster**
  (0.1 s vs 1 s per decision).
- **Cost is a wash:** both cost less than 10 cents per 1,000 decisions.
- **For the safest setup, combine rules and JEV:** the hybrid handles 82% of messages on its own and
  gets 91% of those right, passing the unclear rest to a person.

## Scoreboard

Banking77 test set, 3,080 customer messages, each router run once on frozen code.

| | 🟠 Rules | 🔵 JEV | 🟡 LLM | 🟢 Hybrid |
|---|---:|---:|---:|---:|
| **Picks the exact right action** | 66% | 81% | **82%** | 74% |
| **Sends it to the right service** | 74% | 90% | **91%** | 79% |
| Passed to a person | 17% | 0% | 0% | 18% |
| **Right when it does answer** | 79% | 81% | 82% | **91%** |
| Time per decision (median) | **0.3 ms** | 111 ms | 975 ms | 112 ms |
| Cost per 1,000 decisions | **free** | $0.08 | $0.03 | $0.08 |
| Lines of router code | 772 | **60** | 95 | 888 |

## In pictures

### Writing more rules stops paying off; JEV starts higher

The orange line is the rules router after each round of rule-writing. JEV, with 60 lines, beats
all eight rounds.

![Rules effort curve vs JEV](results/charts/effort-curve.svg)

### JEV matches the LLM, at a ninth of the latency

![Accuracy vs speed](results/charts/accuracy-vs-speed.svg)

### When a mistake is costly, the hybrid is the best deal

At the same share of messages handed to a person, the hybrid is right far more often than rules.

![Accuracy vs human workload](results/charts/accuracy-vs-workload.svg)

### JEV wins in every part of the bank

![Accuracy by service](results/charts/accuracy-by-service.svg)

### JEV's confidence means something

When JEV says it is at least 90% sure, it is right 92% of the time, so a confidence threshold is a
reliable switch for "act now" vs "ask someone".

![JEV calibration](results/charts/jev-calibration.svg)

## What we learned

1. **Use a decision model for understanding what people mean.** Free-text messages, many similar
   options, and new phrasings every day: this is where hand-written rules struggle and JEV shines.
2. **Keep plain code for business rules.** Limits, balances and permissions should stay as code: they
   are exact, and a model adds nothing there.
3. **Choose JEV over an LLM for speed, not accuracy.** They are equally accurate here; JEV answers in
   about 0.1 s instead of about 1 s and runs on a pinned model version.
4. **Let confidence decide when to involve a person.** Both JEV and the hybrid know when they are
   unsure, which makes it safe to automate the confident majority.

## How it works

```
customer message ──▶ POST /help ──▶ router (rules | jev | llm | hybrid) ──▶ one of 77 actions
                                                                          ├─▶ handled by 1 of 11 services
                                                                          └─▶ or "Did you mean…?" for a person
```

The product is **Kestrel Bank**, a fictional digital bank with a free-text Help box, 11 services and
77 actions. The data is [Banking77](https://huggingface.co/datasets/PolyAI/banking77) by PolyAI: 13,083
real-style banking messages, one label per message, one Kestrel action per label.

## Try it

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm data:download     # fetch Banking77
pnpm test
pnpm demo              # four customer stories, end to end
pnpm dev               # local server on :3000 → POST /help {"customerId","message"}
                       # DISPATCHER=rules|jev|llm|hybrid
```

Re-run the measurements:

```bash
pnpm bench --router rules --sample 1000     # also: jev, llm, hybrid
pnpm report                                 # tables for every run
pnpm charts                                 # regenerate the charts
```

`jev` needs `TYPESAFE_API_KEY` and `llm` needs `OPENAI_API_KEY`. Behind an HTTP proxy, also set
`NODE_USE_ENV_PROXY=1`. The whole study cost under $1 in API calls.

## Read more

| Document | What's inside |
|---|---|
| [Final results](docs/final-results.md) | Every number, the hypotheses and how each was decided |
| [Product](docs/product.md) | Kestrel Bank: customers, services and the Help box |
| [Action catalogue](docs/action-catalog.md) | The 77 actions and their descriptions |
| [Architecture](docs/architecture.md) | How the gateway, routers and services fit together |
| [Decisions](docs/decisions.md) | Every methodology choice, written down before the results |
| [Rules effort log](docs/rules-effort-log.md) | How the hand-written rules were built, round by round |
| [JEV](docs/jev-results.md) · [Hybrid](docs/hybrid-results.md) | Development results for each router |
| [References](docs/references.md) | Prior work, including Glean's [*Jev and the return of the zero-shot classifier*](https://www.glean.com/blog/jev-zero-shot-classifier) |

<details>
<summary>Repository layout</summary>

```
src/
  catalog/    the 11 services and 77 actions (single source of truth)
  bank/       a fake in-memory bank: customers, cards, balances, policy
  services/   the 77 action handlers, one file per service
  gateway/    POST /help and POST /action
  routers/    rules, jev, llm, hybrid: all implement the same interface
  bench/      sampling, runner, metrics, report
scripts/      benchmark, report, charts, demo, dataset download
tests/        unit tests for every router, the handlers and the harness
docs/         product, results and methodology
results/      committed summary and charts (raw runs stay local)
```

</details>

## Fine print

- The rules were written by an AI assistant with a recorded effort curve and reviewed by a person
  ([decision D8](docs/decisions.md)); a team with more time could write better rules.
- One dataset, one domain. Banking77 is short single-intent messages; results may differ elsewhere.
- `gpt-6-luna` has no pinned version, so its results may drift; JEV is pinned to `jev-1.13.0`.
- Methodology choices were written down before the test set was run, and the test set was run once.

## License

Code: MIT. Banking77: CC-BY-4.0, © PolyAI (downloaded at setup, not redistributed).
