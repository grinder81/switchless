# Final benchmark: Banking77 test split

| Run | n | Action acc. | Service acc. | Abstain | Errors | p50 | p95 | Cost / 1k | ECE | Safety prec. | Safety recall | LOC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hybrid · test · 3080 | 3080 | 74.1% | 78.5% | 18.3% | 0.0% | 112 ms | 162 ms | $0.0833 | 0.072 | 91.7% | 66.5% | 888 |
| jev · test · 3080 | 3080 | 80.9% | 90.4% | 0.0% | 0.0% | 111 ms | 158 ms | $0.0833 | 0.090 | 77.6% | 79.5% | 60 |
| llm · test · 3080 | 3080 | 81.5% | 90.5% | 0.0% | 0.0% | 975 ms | 1701 ms | $0.0277 | 0.087 | 81.6% | 86.5% | 95 |
| rules · test · 3080 | 3080 | 65.5% | 73.5% | 17.0% | 0.0% | 0.29 ms | 0.70 ms | $0.0000 | 0.211 | 84.4% | 57.0% | 772 |

_Action acc._ = exact action (strict). _Service acc._ = right microservice (lenient). _ECE_ = expected calibration error (0 is perfect). _Safety prec./recall_ = exact-intent precision and recall on the five safety-critical intents (freeze, block or sign out); they do not show whether an appropriate protective action happened. _LOC_ = own files plus the routers a router is built from.

## hybrid · test · 3080

### Accuracy by service

| Service | n | Action acc. |
|---|---:|---:|
| Account | 80 | 100.0% |
| ATM & Cash | 280 | 80.4% |
| Card Payments | 320 | 74.7% |
| Cards | 480 | 69.6% |
| Disputes | 200 | 83.0% |
| FX | 200 | 74.5% |
| Identity | 240 | 81.3% |
| Security | 240 | 83.8% |
| Top-up | 440 | 69.5% |
| Transfers | 440 | 58.9% |
| Virtual Cards | 160 | 80.6% |

### Most common cross-service mistakes

| Should be | Went to | Count |
|---|---|---:|
| transfers | abstain | 112 |
| cards | abstain | 108 |
| topup | abstain | 94 |
| card_payments | abstain | 62 |
| identity | abstain | 39 |

### Calibration

| Confidence | n | Mean conf. | Accuracy |
|---|---:|---:|---:|
| 0.3–0.4 | 5 | 34.2% | 60.0% |
| 0.4–0.5 | 24 | 46.0% | 83.3% |
| 0.5–0.6 | 44 | 55.3% | 68.2% |
| 0.6–0.7 | 56 | 65.4% | 89.3% |
| 0.7–0.8 | 71 | 74.6% | 77.5% |
| 0.8–0.9 | 106 | 84.8% | 85.8% |
| 0.9–1.0 | 2210 | 98.7% | 92.0% |

## jev · test · 3080

### Accuracy by service

| Service | n | Action acc. |
|---|---:|---:|
| Account | 80 | 100.0% |
| ATM & Cash | 280 | 85.4% |
| Card Payments | 320 | 82.5% |
| Cards | 480 | 76.9% |
| Disputes | 200 | 86.5% |
| FX | 200 | 79.0% |
| Identity | 240 | 90.8% |
| Security | 240 | 92.1% |
| Top-up | 440 | 75.2% |
| Transfers | 440 | 67.3% |
| Virtual Cards | 160 | 88.8% |

### Most common cross-service mistakes

| Should be | Went to | Count |
|---|---|---:|
| topup | transfers | 45 |
| cards | security | 38 |
| transfers | card_payments | 23 |
| transfers | fx | 22 |
| card_payments | disputes | 15 |

### Calibration

| Confidence | n | Mean conf. | Accuracy |
|---|---:|---:|---:|
| 0.2–0.3 | 13 | 26.1% | 15.4% |
| 0.3–0.4 | 30 | 34.8% | 23.3% |
| 0.4–0.5 | 75 | 45.1% | 30.7% |
| 0.5–0.6 | 158 | 54.3% | 52.5% |
| 0.6–0.7 | 162 | 64.8% | 48.1% |
| 0.7–0.8 | 179 | 74.6% | 54.7% |
| 0.8–0.9 | 238 | 84.5% | 66.4% |
| 0.9–1.0 | 2225 | 98.7% | 91.8% |

## llm · test · 3080

### Accuracy by service

| Service | n | Action acc. |
|---|---:|---:|
| Account | 80 | 100.0% |
| ATM & Cash | 280 | 87.9% |
| Card Payments | 320 | 82.8% |
| Cards | 480 | 78.1% |
| Disputes | 200 | 81.5% |
| FX | 200 | 78.5% |
| Identity | 240 | 89.2% |
| Security | 240 | 91.3% |
| Top-up | 440 | 78.0% |
| Transfers | 440 | 70.2% |
| Virtual Cards | 160 | 87.5% |

### Most common cross-service mistakes

| Should be | Went to | Count |
|---|---|---:|
| topup | transfers | 47 |
| cards | security | 45 |
| card_payments | topup | 30 |
| disputes | card_payments | 27 |
| transfers | card_payments | 24 |

### Calibration

| Confidence | n | Mean conf. | Accuracy |
|---|---:|---:|---:|
| 0.0–0.1 | 2 | 5.0% | 0.0% |
| 0.1–0.2 | 8 | 15.8% | 12.5% |
| 0.2–0.3 | 18 | 25.4% | 27.8% |
| 0.3–0.4 | 28 | 35.3% | 35.7% |
| 0.4–0.5 | 50 | 44.3% | 40.0% |
| 0.5–0.6 | 75 | 55.4% | 40.0% |
| 0.6–0.7 | 91 | 65.5% | 63.7% |
| 0.7–0.8 | 221 | 75.6% | 62.4% |
| 0.8–0.9 | 395 | 85.6% | 65.3% |
| 0.9–1.0 | 2192 | 97.4% | 90.8% |

## rules · test · 3080

### Accuracy by service

| Service | n | Action acc. |
|---|---:|---:|
| Account | 80 | 76.3% |
| ATM & Cash | 280 | 70.7% |
| Card Payments | 320 | 63.1% |
| Cards | 480 | 65.4% |
| Disputes | 200 | 78.5% |
| FX | 200 | 75.0% |
| Identity | 240 | 62.1% |
| Security | 240 | 71.3% |
| Top-up | 440 | 60.2% |
| Transfers | 440 | 54.5% |
| Virtual Cards | 160 | 68.1% |

### Most common cross-service mistakes

| Should be | Went to | Count |
|---|---|---:|
| transfers | abstain | 109 |
| topup | abstain | 92 |
| cards | abstain | 82 |
| card_payments | abstain | 62 |
| security | abstain | 49 |
