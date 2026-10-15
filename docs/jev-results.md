# JEV dispatcher: go/no-go results (Phase 3)

Same 1,000-message held-out train sample as the rules dispatcher (stratified, seed 42, never
inspected). Model `jev-1.13.0`, zero-shot: JEV sees the customer's message and the 77 one-line
action descriptions, nothing else. Run on 2026-10-15.

## Headline

| | Rules (Phase 5) | JEV |
|---|---:|---:|
| Action accuracy (exact action) | 63.0% | **78.5%** |
| Service accuracy (right microservice) | 69.6% | **89.2%** |
| Escalated to a human | 20.0% | 0% (always answers; see gating below) |
| Errors | 0 | 1 (0.1%, a transient `499` from the API) |
| Latency p50 / p95 | 0.34 ms / 0.97 ms | 114 ms / 172 ms |
| Cost per 1,000 decisions | $0 | $0.083 |
| Dispatcher code | 772 lines | 47 lines + 77 one-line action descriptions |
| Confidence signal | none (always 1.0) | yes (ECE 0.105) |
| Safety-critical precision / recall | 75.0% / 38.7% | 68.9% / 67.7% |

## Like-for-like: same escalation rate

Rules escalate 20% of messages and are right on 79% of the rest. JEV's confidence lets us choose
how much to escalate:

| Accept JEV if confidence ≥ | Answered | Accuracy on answered | Escalated |
|---:|---:|---:|---:|
| 0 | 99.9% | 78.6% | 0.1% |
| 0.5 | 95.4% | 80.8% | 4.6% |
| 0.7 | 84.2% | 85.7% | 15.8% |
| **0.8** | **78.9%** | **88.1%** | **21.1%** |
| 0.9 | 68.2% | 91.3% | 31.8% |
| 0.95 | 61.8% | 93.2% | 38.2% |
| 0.99 | 50.4% | 95.4% | 49.6% |

At the rules' escalation rate (~20%), JEV is right on **88%** of what it answers versus **79%** for
the rules. These thresholds are read off the same sample, so they are indicative; Phase 6 tunes the
hybrid's threshold on a separate train sample and Phase 7 confirms on the test split.

## Calibration

| Confidence | n | Mean confidence | Accuracy |
|---|---:|---:|---:|
| 0.3–0.4 | 9 | 35.9% | 22.2% |
| 0.4–0.5 | 35 | 44.7% | 31.4% |
| 0.5–0.6 | 57 | 54.5% | 45.6% |
| 0.6–0.7 | 55 | 65.1% | 41.8% |
| 0.7–0.8 | 53 | 73.9% | 50.9% |
| 0.8–0.9 | 107 | 84.9% | 67.3% |
| 0.9–1.0 | 682 | 98.6% | 91.3% |

Confidence is **meaningful** (higher confidence → more often right) but **overconfident** by roughly
10–20 points below 0.9. This matches third-party reports. It is good enough to gate on, but the
threshold has to be chosen from data rather than taken at face value.

## By service

| Service | Rules | JEV |
|---|---:|---:|
| Account | 69.6% | 100.0% |
| ATM & Cash | 69.4% | 81.5% |
| Card Payments | 57.1% | 81.5% |
| Cards | 54.7% | 73.4% |
| Disputes | 70.6% | 77.6% |
| FX | 83.6% | 83.6% |
| Identity | 67.2% | 80.6% |
| Security | 61.3% | 88.7% |
| Top-up | 61.0% | 78.7% |
| Transfers | 54.7% | 67.3% |
| Virtual Cards | 77.8% | 86.1% |

JEV is better or equal in every service. Transfers stays the hardest for both: several actions
differ only in timing ("pending" vs "not received" vs "how long does it take").

## Where JEV is wrong

Most common mistakes (gold → chosen):

| Count | Should be | JEV chose |
|---:|---|---|
| 9 | `cards.physical_card_info` | `security.change_pin` |
| 6 | `transfers.not_received` | `transfers.timing` |
| 6 | `fx.supported_cards_currencies` | `topup.by_card` |
| 6 | `disputes.unrecognised_direct_debit` | `card_payments.unrecognised` |
| 6 | `cards.renew_expiring` | `cards.order_physical` |
| 5 | `atm.unrecognised` | `security.compromised_card` |

The top one is a catalogue issue as much as a model issue: Banking77's `get_physical_card` intent
is mostly about *finding the card's PIN*, but our description says "How to get a physical card", so
JEV reasonably picks the PIN action. Descriptions are the only lever a zero-shot model has; this is
the kind of fix Phase 6 may make (on train data only, and reported).

**Safety-critical precision is lower than the rules (68.9% vs 75.0%)**, but recall is much higher
(67.7% vs 38.7%). These are exact-intent measures: JEV picked the exact safety-critical action for far
more of the lost or compromised cases. Some of its "wrong" freezes
pick a different freeze-first action (e.g. `atm.unrecognised` → `security.compromised_card`), which
still freezes the card. Phase 6's confidence gate and the hard-rules layer address the rest.

## Decision

**GO.** JEV beats 772 lines of hand-written rules by 15.5 points of exact-action accuracy and 19.6
points of service accuracy with 47 lines of code, at about 114 ms and $0.08 per 1,000 decisions,
and it provides a usable confidence signal that rules cannot. Its weaknesses (overconfidence, some
near-twin confusions, latency versus rules) are what the hybrid in Phase 6 is designed for.

## Reproduce

```bash
pnpm bench --router jev --sample 1000
```

Behind an HTTP proxy (such as a cloud sandbox), Node's built-in `fetch` needs `NODE_USE_ENV_PROXY=1`.
