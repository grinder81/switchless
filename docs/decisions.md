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

## Open
- LLM baseline model (proposed: a fast, cheap current Claude model).
- JEV API access.
