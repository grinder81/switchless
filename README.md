# switchless

**Replacing the hand-written "core router" of a microservice system with a zero-shot decision model.**

Every backend has a piece of code that looks at an incoming request and decides which service handles it.
It starts as a `switch` statement and grows into thousands of lines of rules. This project measures what
happens when you replace that code with a decision model, specifically [JEV](https://docs.langchain.com/oss/python/integrations/providers/typesafe) by TypeSafe AI,
and compares it head-to-head with hand-written rules and an LLM router.

> Status: **foundation only**. Nothing is benchmarked yet. See [`docs/goal.md`](docs/goal.md).

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
```

Requires Node 22+ and pnpm.

## Prior work

This project builds on, and cites, existing results rather than re-running them.
See [`docs/references.md`](docs/references.md), in particular Glean's
[*Jev and the return of the zero-shot classifier*](https://www.glean.com/blog/jev-zero-shot-classifier).

## License

Code: MIT. Banking77 data: CC-BY-4.0, © PolyAI (not redistributed; downloaded at setup).
