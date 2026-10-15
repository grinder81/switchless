/**
 * Stage 5: repairs regressions introduced by stage 4's broad "ATM + which/use" and "card + can't use"
 * rules, which captured declined, short-changed and retained-card ATM messages, PIN changes and
 * virtual-card faults. Each rule here outranks the stage 4 rule it repairs.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });
const CASH = /\b(atms?|cash|machine|withdraw|withdrawal|withdrawing|money)\b/;

export const stage5: Rule[] = [
  p(
    5,
    "atm.wrong_amount",
    /\b(gave me|only got|only received|only gave|less than|wrong amount|amount of (cash|money)|asked for|instead of|short|didn't (give|get) (me )?(all|the full|enough))\b/,
    CASH,
  ),
  p(
    4,
    "atm.declined",
    /\b(declin|blocked|couldn't|could not|couldnt|unable|not able|wouldn't|would not|refused|denied|didn't work|cancelled)/,
    /\b(withdraw|withdrawal|cash|get money|get my money|take out|atm)\b/,
  ),
  p(
    5,
    "cards.atm_retained",
    /\b(swallow|swallowed|ate my card|took my card|kept my card|retained|get my card back|card back|card out of)\b/,
  ),
  p(
    4,
    "atm.explain_fee",
    /\b(fees?|charge|charged|charges|free|cost)\b/,
    /\b(withdraw|withdrawal|withdrawals|withdrawing|cash|atm)\b/,
  ),
  p(4, "security.change_pin", /\b(change|new|reset)\b/, /\bpin\b/),
  p(5, "security.unblock_pin", /\b(block|blocked|unblock|locked|too many|wrong pin)\b/, /\bpin\b/),
  p(
    4,
    "virtual_cards.troubleshoot",
    /\b(virtual|disposable)\b/,
    /\b(not working|won't|doesn't|declin|isn't|rejected|fail|didn't|can't|cannot|unable)\b/,
  ),
  {
    action: "transfers.timing",
    when: [
      /\b(how long|how many days|how quickly|when will|take to|typically take|usually take)\b/,
      /\b(transfer|transfers|send|arrive|reach)\b/,
    ],
    unless: /\b(hasn't|not yet|still|already|ago|didn't|haven't)\b/,
    priority: 4,
  },
  p(5, "card_payments.mobile_wallets", /\b(apple|google pay|android pay)\b/),
  p(4, "cards.link_card", /\b(found|reactivate|link|linking)\b/),
  p(
    4,
    "disputes.duplicate_charge",
    /\b(twice|double|duplicate|two times|same (transaction|charge|payment))\b/,
  ),
  p(
    4,
    "topup.card_fee",
    /\b(fee|fees|charge|charged|cost)\b/,
    /\b(top|topping)\b/,
    /\b(card|international|european|us)\b/,
  ),
];
