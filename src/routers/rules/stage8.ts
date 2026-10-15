/**
 * Stage 8: stage 1's "cheque|check" rule also fires on the verb "check" ("how can I check on my
 * card?"). Rules here route those messages properly, plus deposits that haven't shown up, declined
 * ATM withdrawals, failed top-ups and refund requests.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });

export const stage8: Rule[] = [
  // The verb "check"
  p(3, "cards.track_delivery", /\bcheck\b/, /\b(status|on route|on its way|delivery|my new card)\b/),
  p(3, "card_payments.explain_fee", /\bcheck\b/, /\b(free spending|how much .* left)\b/),

  // Deposits that haven't shown up
  p(
    7,
    "topup.deposit_not_credited",
    /\b(cheque|check|cash|money)\b/,
    /\b(deposit|deposited|added|put|updated|updating|update)\b/,
    /\b(balance|where|missing|processed|yesterday|can't find|not seeing|isn't|not gone|doesn't|yet|wrong)\b/,
  ),
  p(7, "topup.deposit_not_credited", /\bwhen will my cheque\b/),

  // ATM refused to give cash
  p(
    5,
    "atm.declined",
    /\b(atm|cash machine|machine)\b/,
    /\b(would not|wouldn't|didn't|did not|couldn't|could not|can't|cannot|won't|refused|not able)\b/,
    /\b(give|get|access|let me|work|withdraw|take)\b/,
  ),

  // Top-up failures
  p(
    5,
    "topup.failed",
    /\b(top|topping|top ?up)\b/,
    /\b(didn't work|not working|failed|fail|declined|rejected|error|wouldn't|won't|unable|can't|couldn't|problem|issue)\b/,
  ),

  // Refund requests phrased as questions about getting money back
  p(
    3,
    "disputes.request_refund",
    /\b(get|want|need|request|ask for)\b/,
    /\b(my money back|a refund for|refund on)\b/,
    /\b(item|product|purchase|order|bought|something)\b/,
  ),
];
