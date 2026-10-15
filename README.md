# switchless

**Replacing the hand-written "core router" of a microservice system with a zero-shot decision model.**

Every backend has a piece of code that looks at an incoming request and decides which service handles it.
It starts as a `switch` statement and grows into thousands of lines of rules. This project measures what
happens when you replace that code with a decision model, specifically [JEV](https://docs.langchain.com/oss/python/integrations/providers/typesafe) by TypeSafe AI,
and compares it head-to-head with hand-written rules and an LLM router.

> Status: **final benchmark done** (LLM baseline still to come). On the Banking77 test split
> (3,080 messages): hand-written rules 65.5% exact action with 772 lines; **JEV 80.9% with 60 lines**,
> 111 ms and $0.08 per 1,000; a hybrid where rules and JEV must agree answers 82% of messages at
> **90.7%** accuracy. See [final results](docs/final-results.md).

![Rules effort curve vs JEV](results/charts/effort-curve.svg)

## The experiment

| Router | How it decides |
|---|---|
| `rules` | Hand-written keyword / pattern rules (the "traditional" core router) |
| `llm` | A general-purpose LLM is asked to pick the action |
| `jev` | JEV, a zero-shot decision model, picks the action with a calibrated probability |
| `hybrid` | Rules for obvious cases → JEV for the fuzzy middle → LLM (or human) when JEV is unsure |

**Product:** *Kestrel Bank*, a fictional digital bank with a free-text Help box, 11 microservices and
77 actions. See [`docs/product.md`](docs/product.md).

**Dataset:** [Banking77](https://huggingface.co/datasets/PolyAI/banking77) (PolyAI, CC-BY-4.0): 13,083 customer
messages, 77 intents, one per Kestrel action. See the [action catalogue](docs/action-catalog.md).

**Metrics:** accuracy (action-level and service-level), latency (p50/p95), cost per 1,000 decisions,
lines of code per router, and calibration / behaviour when unsure.

## Repository layout

```
docs/              product, goal, architecture, decisions, references, generated action catalogue
src/
  catalog/         the 11 services and 77 typed actions (single source of truth)
  bank/            fake bank: domain types, policy, seed customers, in-memory store
  services/        the 77 action handlers, one file per service
  gateway/         POST /help: dispatcher → handler
  data/            Banking77 loader
  routers/         one module per dispatcher, all implementing the same interface
  bench/           runner + metrics
scripts/           dataset download, catalogue doc generator
tests/
data/              downloaded datasets (git-ignored)
results/           benchmark outputs (raw runs git-ignored, summaries committed)
```

## Quick start

```bash
pnpm install
pnpm data:download
pnpm test
pnpm demo        # the four customer stories, on the hand-written rules
pnpm dev         # local server on :3000, POST /help (DISPATCHER=rules|oracle)

pnpm bench --router random            # measure a dispatcher on a 300-message train sample
pnpm bench --router oracle --sample 1000
pnpm report                           # combine all runs → results/runs/summary.md
pnpm loc                              # lines of code per dispatcher
pnpm rules:curve                      # rules accuracy vs lines of code, stage by stage
pnpm hybrid:tune                      # compare hybrid designs on the tuning sample
```

Requires Node 22+ and pnpm. The `jev` dispatcher needs `TYPESAFE_API_KEY`; behind an HTTP proxy,
also set `NODE_USE_ENV_PROXY=1` so Node's `fetch` uses it.

## Prior work

This project builds on, and cites, existing results rather than re-running them.
See [`docs/references.md`](docs/references.md), in particular Glean's
[*Jev and the return of the zero-shot classifier*](https://www.glean.com/blog/jev-zero-shot-classifier).

## License

Code: MIT. Banking77 data: CC-BY-4.0, © PolyAI (not redistributed; downloaded at setup).
