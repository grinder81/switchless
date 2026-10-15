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

## D12: How the hybrid is chosen (written before tuning)
Candidates: rules-first, JEV-first, agreement (rules and JEV agree → answer; otherwise JEV if
confident) and JEV-only, each over confidence thresholds 0.5–0.99. They are compared on a **tuning
sample**: 1,000 train messages (stratified, seed 7) disjoint from the held-out sample used for all
earlier numbers. Winner: highest accuracy on automatically answered messages with at most 20% sent to
a human (the rules dispatcher's escalation rate). Ties go to the cheaper design (fewer JEV calls).
The chosen design and threshold are frozen in code before the held-out and test runs.
**Result:** agreement @ 0.9 (87.7% on answered, 18.9% escalated on tuning). Rules-first was worst.

## D13: The test split is run once, on frozen code
Phase 7 runs rules, JEV and the hybrid on the full test split (3,080 messages) from commit `f90cf13`,
with the rules stages, JEV request, model version, hybrid design and threshold all frozen. The LLM
baseline is added to the same report later as a separate run; nothing already measured is re-tuned
after seeing test results.

## D14: LLM baseline is OpenAI gpt-6-luna
The LLM baseline uses OpenAI's `gpt-6-luna` (budget available on that account), not a Claude model as
first proposed. Luna is OpenAI's cheap, fast tier: the model a team would realistically put in front of
every request, and so the fair comparison for JEV. Request: same instruction and 77 descriptions as JEV
(system prompt, catalogue order), the customer's message as the user turn, structured output whose
`action` is an enum of the 77 ids plus a self-reported `confidence`. `reasoning_effort: "none"`, because
a dispatcher answers in one step. gpt-6-luna does not accept `temperature: 0` or log-probabilities, and
OpenAI offers no dated snapshot, so each decision records the model the API reports (all 4,080 were
`gpt-6-luna`, 2026-10-15). Cost uses the standard-tier price list of 2026-10-15 ($0.10 input, $0.01
cached input, $0.125 cache writes, $0.50 output per million tokens). Run once on the held-out sample and
once on the test split, with nothing tuned in between. A Claude run can be added later as a second LLM.

## D15: Evidence preserved and claims narrowed after review
An independent review found the published claims broader than the evidence and the raw runs
unpublished. In response: the 16 original run files are committed unchanged in `results/raw/` with
full SHA-256 hashes; the dataset download is pinned to commit `57ec275` and verified by hash;
`pnpm analyze` recomputes intervals, the paired LLM-vs-JEV comparison, an exploratory comparison at
the same number of referrals (with tie-breaking and tie sensitivity), and incorrect selections of
state-changing handlers, from the raw files without API calls. Lines of code use one rule everywhere
(own files plus the routers a router is built from). Claims are scoped to free-text banking intent
routing; equivalence, "safest" and production-safety claims were removed; human resolution after a
referral is stated as not measured. The analysis also surfaced that the LLM was detectably more
accurate than JEV on the held-out sample (+2.2 points), which the earlier report did not state.
