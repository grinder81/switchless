# Decision log

Short records of choices made and why, newest last.

## D1: Dataset is Banking77
Public, labelled, CC-BY-4.0, widely benchmarked; 77 fine-grained intents with many near-duplicates,
which is where keyword rules break down. Intents map naturally onto ~12 fintech microservices.

## D2: No fine-tuned baseline
Glean already compared JEV against a locally fine-tuned classifier (74.5% vs 66.8% agreement on query
classification) and concluded JEV is most attractive when a task is new or its labels change. We cite
that result instead of reproducing it, and focus on routing, where Glean found JEV strongest.

## D3: TypeScript (replaced Python)
TypeSafe and Anthropic both ship official TypeScript SDKs. One language covers the fake bank, the
dispatchers, the benchmark and the Router Arena web page, and typed action schemas are central to the
project. Charts are produced in TypeScript; result files stay plain JSON so other tools can read them.

## D4: Thresholds tuned on train, reported on test
Prevents the hybrid from looking better than it is.

## D5: Product is Kestrel Bank, 11 services, 77 actions
Defined in `docs/product.md`; the catalogue in `src/catalog/` is the single source of truth and
`docs/action-catalog.md` is generated from it.

## D6: Dispatchers choose the action, not just the service
A real product must know which handler to run. Accuracy is reported at both levels.

## D7: Showcase is repo + report + Router Arena page, not a banking UI
The Arena runs in replay mode publicly (precomputed decisions, no API cost or abuse) and live mode
locally with the user's own keys.

## D8: Rules baseline is an effort curve, not a single number
The rules dispatcher is written in stages by an AI coding assistant from the train split only, with an
effort log, and reviewed by the project author. Accuracy is measured after each stage, so the finding is
the shape of the accuracy-vs-lines curve rather than one possibly weak baseline. Disclosed in the report.

## D9: Git workflow
`main` gets one squashed commit per finished phase. Work in progress lives on local phase branches and
is backed up to a single `wip` branch on GitHub (overwritten, deleted after each phase lands). Scratch
notes and development runs stay in git-ignored `.local/` and `results/runs/`. Commits are authored by
the project owner and co-authored by Claude.

## D10: Rules are measured on a held-out part of train
Rules were written while reading 9,003 dev messages; every reported number comes from the 1,000-message
stratified sample (seed 42) that was never inspected. Stage files are append-only once measured so
each point of the effort curve is reproducible; fixes are added as later, more specific rules. Rule
writing stopped after stage 8 (−0.1 points on dev); the final dispatcher uses all eight stages.

## D11: JEV request design
One Choice question per message: the 77 action ids as options, each described by its catalogue
description; `state` is only the customer's message, the same information the LLM gets. The model is
pinned to `jev-1.13.0` rather than the moving `jev-latest` alias. Cost is computed from reported input
tokens at $0.042 per million (output is free). TypeSafe documents that jev-1.13 can lean toward the
first option of a Choice, so option order is fixed (catalogue order) and identical for JEV and the LLM,
and Phase 7 adds an order-shuffle consistency check. A flat 77-way choice is tried first because it is
the zero-code baseline; a two-level variant (service, then action) is the fallback if it underperforms.

## Open
- LLM baseline model (proposed: a fast, cheap current Claude model).
- JEV API access: `TYPESAFE_API_KEY` must be set in the environment before the Phase 3 run.
