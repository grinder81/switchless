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
| `llm` | A general-purpose LLM is asked to pick the service |
| `jev` | JEV, a zero-shot decision model, picks the service with a calibrated probability |
| `hybrid` | Rules for obvious cases → JEV for the fuzzy middle → LLM (or human) when JEV is unsure |

**Dataset:** [Banking77](https://huggingface.co/datasets/PolyAI/banking77) (PolyAI, CC-BY-4.0): 13,083 customer
messages, 77 intents. We map the 77 intents onto ~12 fictional fintech microservices.

**Metrics:** accuracy (service-level and intent-level), latency (p50/p95), cost per 1,000 decisions,
lines of code per router, and calibration / behaviour when unsure.

## Repository layout

```
config/            service map: 77 intents → microservices
data/              downloaded datasets (git-ignored)
docs/              goal, architecture, decision log, references
results/           benchmark outputs (raw runs git-ignored, summaries committed)
scripts/           one-off utilities (dataset download)
src/switchless/
  data.py          dataset loading
  services.py      service map loading + stub microservice handlers
  routers/         one module per router, all implementing the same interface
  bench/           runner + metrics
tests/
```

## Quick start

```bash
uv sync
uv run python scripts/download_banking77.py
uv run pytest
```

## Prior work

This project builds on, and cites, existing results rather than re-running them.
See [`docs/references.md`](docs/references.md), in particular Glean's
[*Jev and the return of the zero-shot classifier*](https://www.glean.com/blog/jev-zero-shot-classifier).

## License

Code: MIT. Banking77 data: CC-BY-4.0, © PolyAI (not redistributed; downloaded at setup).
