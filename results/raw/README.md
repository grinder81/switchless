# Raw benchmark runs (original files)

These are the per-decision records written by `pnpm bench` and `pnpm consistency` during the study,
copied byte-for-byte from the local, git-ignored `results/runs/` folder. They are not edited,
filtered or regenerated. `SHA256SUMS` holds the full hash of each file; check with:

```bash
cd results/raw && sha256sum -c SHA256SUMS
```

Each line is one decision. Message text is Banking77 (PolyAI, CC-BY-4.0), included unchanged.

## Files

Last-write time is the file's modification time when it was copied (UTC); git does not keep it, so it
is recorded here.

| File | Records | Bytes | Last write (UTC) | Fields |
|---|---:|---:|---|---|
| `hybrid_test_3080.jsonl` | 3080 | 1281531 | 2026-10-15T20:04:12Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `hybrid_train_1000.jsonl` | 1000 | 421703 | 2026-10-15T19:53:07Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev-repeat-1_test_200.jsonl` | 200 | 81541 | 2026-10-15T20:04:47Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev-repeat-2_test_200.jsonl` | 200 | 81798 | 2026-10-15T20:04:53Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev-reversed-options_test_200.jsonl` | 200 | 81679 | 2026-10-15T20:04:58Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev_test_3080.jsonl` | 3080 | 1257606 | 2026-10-15T20:02:40Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev_train-tuning_1000.jsonl` | 1000 | 414523 | 2026-10-15T19:51:22Z | action, alternatives, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `jev_train_1000.jsonl` | 1000 | 274087 | 2026-10-15T19:30:54Z | action, confidence, costUsd, error, goldIntent, index, latencyMs, router, text, wallMs |
| `llm_test_3080.jsonl` | 3080 | 874688 | 2026-10-15T21:07:50Z | action, confidence, costUsd, goldIntent, index, latencyMs, model, router, text, wallMs |
| `llm_train_1000.jsonl` | 1000 | 289886 | 2026-10-15T21:00:52Z | action, confidence, costUsd, goldIntent, index, latencyMs, model, router, text, wallMs |
| `oracle_train_300.jsonl` | 300 | 72174 | 2026-10-15T17:53:16Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `random_train_1000.jsonl` | 1000 | 261077 | 2026-10-15T17:53:18Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `random_train_300.jsonl` | 300 | 77946 | 2026-10-15T17:53:17Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `rules_test_3080.jsonl` | 3080 | 712374 | 2026-10-15T20:01:10Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `rules_train-tuning_1000.jsonl` | 1000 | 236801 | 2026-10-15T19:50:50Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |
| `rules_train_1000.jsonl` | 1000 | 236723 | 2026-10-15T18:12:01Z | action, confidence, costUsd, goldIntent, index, latencyMs, router, text, wallMs |

## What the fields are

Recorded at run time by the runner (`src/bench/runner.ts`):

| Field | Meaning |
|---|---|
| `index` | Row number in the Banking77 split file (0-based, header excluded) |
| `text`, `goldIntent` | The message and its Banking77 label |
| `action`, `confidence` | The router's decision; `action` is null when it hands the message to a person |
| `alternatives` | JEV's top three actions with probabilities (JEV and hybrid only) |
| `router` | Router name; for the hybrid, the stage that decided (`hybrid:agreement`, `hybrid:jev`, `hybrid:human`) |
| `latencyMs`, `wallMs` | Time reported by the router, and wall-clock time around the call measured by the runner |
| `costUsd` | Cost computed at run time from the provider's reported token usage and the price list in the router source |
| `model` | Model name returned by the OpenAI API (LLM only) |
| `error` | Present when the call failed; the record counts as wrong. One in total: `jev_train_1000.jsonl`, a TypeSafe `499` |

**Not recorded:** raw token counts, the git commit and the API request IDs. Token counts can be
*reconstructed* from `costUsd` for JEV (one flat input price, output free), but that is a derived
value, not an original usage record. They cannot be reconstructed for the LLM (cached and uncached
input are priced differently).

## Provenance (from the project log, not machine-recorded)

- Dataset: `PolyAI-LDN/task-specific-datasets`, branch `master`, which was commit
  `57ec275d8078af65b7731c2a98be812d844a6d6b` when checked on 2026-10-15. SHA-256 of the files used:
  `test.csv` `d12d6e3bc4c3103966ae786dc435913c0c563dfa328f5a3646d0e62cfeeb474d`,
  `train.csv` `b06e26ac675513959a63135f11b94ea7786ed02da65db93a5650d8838cbc664b`.
- Rules, JEV and hybrid test runs: code at commit `f90cf13` (decision D13); JEV model `jev-1.13.0`.
- LLM runs: the router as committed in `aadd80c` (run from the working tree before that commit);
  model `gpt-6-luna`, 2026-10-15.
- Samples: held-out = 1,000 train rows (stratified, seed 42); tuning = 1,000 other train rows (seed 7);
  test = all 3,080 rows. See `src/bench/sample.ts`.
