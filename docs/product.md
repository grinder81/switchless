# Kestrel Bank: product document

> Kestrel Bank is **fictional**. It exists only to give the dispatcher experiment a realistic product.
> Any resemblance to a real bank is unintended.

## 1. Purpose

This document defines the product that the experiment runs inside. The experiment itself (which
dispatcher is best) is defined in [`goal.md`](goal.md). The product must be realistic enough that
the dispatcher we replace is the same piece a real engineering team would write, and simple enough
that it never distracts from that comparison.

## 2. Product summary

Kestrel Bank is a mobile-first digital bank. Customers hold multi-currency balances, use physical and
virtual cards, send and receive transfers, top up by card, transfer, cash or cheque, and exchange
currency in the app.

The feature under study is **Help**: a single free-text box in the app ("How can we help?"). The
customer types anything; Kestrel works out what they want and **does it**, returning an answer built
from their own account data rather than a generic FAQ article.

## 3. Users

| Persona | Situation | What they need from Help |
|---|---|---|
| **Maya**, everyday user | Ordered a card a week ago | "Where is my card?" → real shipping status |
| **Tom**, traveller | Paid in euros, rate looks wrong | Rate applied vs market rate, on *his* payment |
| **Priya**, new customer | Stuck in identity checks | Why it failed and what to do next |
| **Sam**, worried user | Sees a payment he doesn't recognise | Card frozen immediately, payment listed |

Customers do not know Kestrel's internal service boundaries and phrase the same need many ways:
"card still not here", "how long does delivery take", "is my card lost in the post?". That gap
between how customers talk and how the backend is organised is exactly what the dispatcher bridges.

## 4. User journey

1. Customer opens Help and types a message.
2. The app sends `POST /help { customerId, message }`.
3. The **dispatcher** chooses one of 77 actions, or abstains.
4. The action's handler runs against the customer's data in the owning service.
5. The app shows the handler's answer. If the dispatcher abstained, the customer is offered
   "Talk to a person" (escalation).

## 5. System architecture

```
 Kestrel app ──POST /help──► API gateway
                                │
                                ▼
                      ┌───────────────────┐
                      │    DISPATCHER     │  ◄─ the only component that varies:
                      │ (one of 4 impls)  │     rules | LLM | JEV | hybrid
                      └───────────────────┘
                                │ action id, e.g. cards.track_delivery
                                ▼
                      ┌───────────────────┐
                      │  action registry  │  77 typed actions → handler
                      └───────────────────┘
                                │
     ┌──────┬──────────┬────────┴─────┬─────────┬──────┬─────┬──────────┬──────────┬──────────┬─────────┐
     ▼      ▼          ▼              ▼         ▼      ▼     ▼          ▼          ▼          ▼         ▼
   Cards Virtual   Card          ATM &    Transfers Top-up  FX    Security  Identity  Disputes  Account
         Cards     Payments      Cash
                                │
                                ▼
                      fake bank data store (in-memory, seeded)
```

### What varies and what doesn't

| Component | Written by | Same across all four experiments? |
|---|---|---|
| API gateway | human | ✅ |
| Action registry and the 77 handlers | human | ✅ |
| 11 services and the data store | human | ✅ |
| **Dispatcher** | rules: human · LLM/JEV: a prompt or option list · hybrid: both | ❌ **this is the experiment** |

This separation is the core of the argument: the handlers are needed whichever dispatcher is used, so
lines of code are compared **for the dispatcher only**.

## 6. Services

Eleven services, each owning a slice of the domain. Full per-action detail, including the Banking77
intent each action answers and an example customer message, is in the generated
[action catalogue](action-catalog.md).

| Service | Owns | Actions |
|---|---|---:|
| Cards | Physical card ordering, delivery, activation, renewal, faults | 12 |
| Virtual Cards | Virtual and disposable cards | 4 |
| Card Payments | Card payments: pending, declined, reverted, unrecognised, fees, FX rate, acceptance, Apple/Google Pay | 8 |
| ATM & Cash | Cash withdrawals: fees, declines, pending, unrecognised, wrong amount or rate | 7 |
| Transfers | Bank transfers in and out, beneficiaries, timing, fees | 11 |
| Top-up | Adding money by card, transfer, cash or cheque; limits, fees, failures | 11 |
| FX | In-app exchange, rates, fees, supported currencies | 5 |
| Security | PIN, passcode, lost/stolen card or phone, compromised card | 6 |
| Identity | KYC, source of funds, age and country eligibility | 6 |
| Disputes | Refunds, duplicate or unexplained charges, unrecognised direct debits | 5 |
| Account | Personal details, closing the account | 2 |
| **Total** | | **77** |

### Deliberately hard boundaries

Real service boundaries are messy, and these are kept as they are because they are where dispatchers
are tested hardest:

- "I don't recognise this payment": **Card Payments** (`card_payment_not_recognised`) vs **Disputes**.
- "Wrong exchange rate on my payment": **Card Payments** vs **FX**; the ATM version belongs to **ATM & Cash**.
- "Someone used my card": **Security** (`compromised_card`) vs **Cards**.
- "My balance hasn't updated": **Transfers** after a bank transfer, **Top-up** after cash or cheque.
- Near-duplicate actions inside one service: `card_arrival` vs `card_delivery_estimate`,
  `get_physical_card` vs `order_physical_card`.

## 7. Action contract

Each action is defined once, in `src/catalog/actions.ts`:

| Field | Example | Used by |
|---|---|---|
| `id` | `cards.track_delivery` | code, logs, dispatcher output |
| `intent` | `card_arrival` | ground truth (Banking77 label) |
| `service` | `cards` | routing, service-level accuracy |
| `description` | "An ordered card has not arrived yet; where is it" | option text for LLM and JEV |
| `handler` | "Return shipping status and tracking for the latest card order" | the handler implementation |

The LLM and JEV dispatchers see **only** service and action descriptions. They never see Banking77
examples (zero-shot), so neither gets an advantage over the other.

## 8. Dispatcher contract

```ts
interface Router {
  route(text: string): Promise<Decision>;
}

interface Decision {
  action: string | null; // action id, or null = abstain / escalate to a human
  confidence: number;    // 0–1
  latencyMs: number;
  costUsd: number;
  router: string;        // which router or hybrid stage decided
}
```

Every dispatcher implements this interface and nothing else, so the gateway and the benchmark never
know which one they are driving.

## 9. Data model (fake bank)

An in-memory store, seeded deterministically so handler answers are reproducible.

| Entity | Key fields |
|---|---|
| Customer | id, name, country, date of birth, KYC status |
| Account | id, customer, balances per currency, bank details |
| Card | id, account, type (physical / virtual / disposable), network, status, expiry, contactless, PIN state |
| CardOrder | card, ordered at, shipping status, carrier, tracking, ETA |
| CardPayment | card, merchant, amount, currency, rate applied, fee, status (pending / settled / declined / reverted) |
| CashWithdrawal | card, ATM, amount, currency, rate, fee, status |
| Transfer | account, direction, counterparty, amount, currency, fee, status, reference |
| TopUp | account, method (card / bank / cash / cheque), amount, fee, status |
| DirectDebit | account, merchant, amount, last collected |
| Refund | payment, amount, status |
| FxRate | pair, rate, timestamp |

The seed includes a handful of demo customers, each with a "story" (a late card, a declined payment
abroad, a duplicate charge, a stuck verification) so the demo has something interesting to show.

## 10. Handler behaviour

- Every handler takes `(customer, message)` and returns `{ text, data }`: a customer-facing answer
  plus the structured facts it used.
- Handlers are deterministic and side-effect free except on the in-memory store (e.g. freezing a card).
- **Safety-critical actions** (`security.report_lost_card`, `security.compromised_card`,
  `security.report_lost_phone`, `card_payments.unrecognised`, `atm.unrecognised`) freeze the card
  first and explain second. A wrong dispatch into these is costly, so the benchmark reports their
  precision separately.

## 11. Abstain and escalation

If the dispatcher returns `action: null`, Help replies "Let me connect you with someone" and logs the
message for review. Abstaining is a valid outcome. It is reported separately from wrong answers,
because sending a customer to a person is better than freezing the wrong card.

## 12. Day-2 change scenario

Real products change. After the main benchmark, Kestrel launches **crypto**, adding a 12th service
with three actions:

| Action | Customer wants |
|---|---|
| `crypto.buy` | Buy cryptocurrency |
| `crypto.withdraw` | Send crypto to an external wallet |
| `crypto.supported_assets` | Which coins are supported |

We then measure what each dispatcher needs to support it:

- **Rules:** new patterns plus fixes for collisions ("withdraw" already means ATM cash); count lines
  added and any regressions on the original 77 actions.
- **LLM / JEV:** add three option descriptions; measure accuracy on the new actions and any regressions.

Banking77 has no crypto messages, so a small labelled set (≈30 per action) is written for this
scenario. How it was produced will be disclosed in the report.

## 13. Showcase surfaces

| Surface | Audience | Notes |
|---|---|---|
| Repo + results report | Engineers, reviewers | The credible artefact; fully reproducible |
| **Router Arena** web page | Anyone curious | One message, four dispatchers side by side; replay mode public, live mode local |
| GIF and charts | LinkedIn, blog, paper | Cut from the Arena and the report |

## 14. Non-goals

- Real banking: no authentication, payments rails, compliance or persistence.
- A full banking UI; only the Router Arena page.
- Multi-turn conversation: one message, one action.
- Multi-intent messages ("cancel my transfer and change my PIN"): out of scope, noted as a limitation.

## 15. Glossary

| Term | Meaning |
|---|---|
| Action | One thing the bank can do for a customer; one per Banking77 intent |
| Service | A microservice owning a group of actions |
| Dispatcher / router | The component that maps a message to an action |
| Abstain | The dispatcher declines to choose; the customer is escalated |
| Zero-shot | Deciding from descriptions alone, with no training examples |
| JEV | TypeSafe AI's decision model; returns typed choices with probabilities |
