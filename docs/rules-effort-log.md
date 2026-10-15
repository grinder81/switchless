# Rules dispatcher: effort log

The traditional baseline: a hand-written keyword and pattern dispatcher, the code a team writes
before reaching for a model. This log records how it was built and what each stage bought.

## Method

- **Author.** Written by an AI coding assistant (Claude Code) and reviewed by the project author
  (decision D8). The approach mirrors what an engineer would do; the time an AI takes is not
  comparable to a person's, so effort is reported in rules and lines of code, not hours.
- **Data discipline.** The Banking77 train split was divided in two:
  - *dev* (9,003 messages): read freely to find phrasings and mistakes;
  - *held-out* (the 1,000-message stratified sample, seed 42): never inspected. **Every number
    below is measured on it.** The test split is not used until Phase 7.
- **Rule style.** Ordered keyword and regex rules (`src/routers/rules/`). When several match, the
  most specific wins: explicit priority, then the number of patterns, then definition order. No
  match → abstain and escalate to a human. No machine learning.
- **Stages are append-only.** Once measured, a stage file is never edited, so every point on the
  curve is reproducible (`pnpm rules:curve`). Fixes go in later stages as more specific rules,
  which is also how rule bases grow in practice.
- **Stopping rule.** Stop when a stage adds less than 1 point of action accuracy on the dev split,
  or at about 1,000 lines.
- **Lines of code** are logical lines (no blanks or comments) after formatting, including the
  small rule engine, and nothing else (handlers, catalogue and harness are shared by every
  dispatcher and not counted).

## The curve

| Stage | What was added | Rules | Lines | Action acc. | Service acc. | Abstain |
|---:|---|---:|---:|---:|---:|---:|
| 1 | One or two rules per action, from the product spec only | 77 | 137 | 39.4% | 51.4% | 41.4% |
| 2 | Customer vocabulary: synonyms and phrasings from the dev data | 169 | 380 | 55.2% | 67.0% | 23.5% |
| 3 | Tie-breakers for near-twin actions | 198 | 494 | 58.1% | 66.1% | 22.2% |
| 4 | Fixes for stage 3's over-greedy rule, long-tail phrasings | 216 | 581 | 58.5% | 67.2% | 20.8% |
| 5 | Repairs for regressions introduced by stage 4 | 228 | 640 | 60.9% | 68.7% | 20.7% |
| 6 | More near-twins: refunds, FX, receiving money, identity | 240 | 699 | 61.8% | 68.5% | 20.2% |
| 7 | Repairs for stage 6 regressions, deposits, fees | 247 | 738 | 63.4% | 70.1% | 20.2% |
| 8 | The verb "check" bug, deposits, declined ATM, failed top-ups | 254 | 772 | 63.0% | 69.6% | 20.0% |

Stage 8 changed dev accuracy by −0.1 points, so rule writing stopped. The final dispatcher uses all
eight stages.

```
action accuracy (held-out)
 64% ┤                                  ●──●
 62% ┤                             ●
 60% ┤                        ●
 58% ┤             ●────●
 56% ┤        ●
     │
 40% ┤   ●
     └───┬────┬────┬────┬────┬────┬────┬────┬── lines of code
        137  380  494  581  640  699  738  772
```

## Final dispatcher (held-out, 1,000 messages)

| Metric | Value |
|---|---:|
| Action accuracy | 63.0% |
| Service accuracy | 69.6% |
| Abstain (escalated to a human) | 20.0% |
| Accuracy when it does answer | ≈79% |
| Latency p50 / p95 | 0.34 ms / 0.97 ms |
| Cost per 1,000 decisions | $0 |
| Lines of code | 772 |
| Safety-critical precision (a card freeze was the right action) | 75.0% |
| Safety-critical recall (lost/compromised cases caught) | 38.7% |

Weakest services: Cards and Transfers (54.7% each), where customers describe the same situation
in many ways and several actions differ only in timing ("hasn't arrived" vs "how long does it take").
Strongest: FX (83.6%), where vocabulary is distinctive.

## What we learned

1. **Diminishing returns are steep.** The first 380 lines reach 55%; the next 392 lines add 8 points.
2. **Most stages after the first two are repairs.** Stages 4, 5 and 7 mostly fix regressions caused
   by the stage before: a rule broad enough to catch a new phrasing also catches messages that
   belong elsewhere.
3. **Rules cannot see intent across synonyms.** "Delete", "close", "terminate" and "not happy with
   the service" all mean the same action; every synonym needs a line, and new customers bring new ones.
4. **Words are ambiguous.** Stage 1's rule for cheques (`cheque|check`) also matched the verb
   "check" ("how can I check on my card?"), misrouting dozens of messages until stage 8. A person
   would edit the original rule; the append-only history shows how such fixes pile up.
5. **One in five customers gets no answer.** Rules abstain rather than guess, which is safe but
   means a person handles 20% of traffic.
6. **Confidence is meaningless.** A rule either fires or not, so every answer carries confidence 1.0.
   There is no signal for when to ask for help, which is what the hybrid in Phase 6 needs.
7. **Wrong freezes happen.** One in four card freezes is triggered by a message that didn't ask
   for it, and most genuine lost-card messages are missed.

## Reproduce

```bash
pnpm rules:curve                          # the curve above
pnpm bench --router rules --sample 1000   # full metrics for the final dispatcher
pnpm demo                                 # the product running on these rules
```
