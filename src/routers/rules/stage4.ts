/**
 * Stage 4: regression fixes and long-tail phrasings. Stage 3's "card + accept/use" tie-breaker turned
 * out too greedy (it stole ATM, acceptance and broken-card questions); these rules outrank it.
 * Also covers frequent phrasings still abstaining on the dev split.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });
const TRANSFER = /\b(transfers?|transferr?(ed|ing)|transaction|sent|money)\b/;
const CANT =
  /\b(can't|cannot|can not|unable|not able|haven't been able|won't|will not|wouldn't|couldn't|not working|isn't working|doesn't work|stopped)\b/;

export const stage4: Rule[] = [
  // Regression fixes for the greedy supported-cards rule
  p(
    3,
    "atm.atm_usage",
    /\b(atms?|cash machines?|cashpoints?)\b/,
    /\b(which|what|any|all|where|closest|nearest|accept|take|use)\b/,
  ),
  p(
    3,
    "atm.atm_usage",
    /\b(where|what locations|how do i|how can i)\b/,
    /\b(withdraw|get money|get cash|take out)\b/,
  ),
  p(
    3,
    "card_payments.acceptance",
    /\b(businesses|stores|shops|places|merchants|anywhere|where|everywhere|all over the world|everybody|everyone)\b/,
    /\b(use|accept|take|shop|work|welcomed|pay)\b/,
  ),
  p(3, "cards.troubleshoot", /\bcard\b/, CANT, /\b(use|work|functioning|working|itself)\b/),
  p(
    3,
    "cards.troubleshoot",
    /\b(card|it)\b/,
    /\b(not functioning|isn't functioning|was working|doesn't work anymore)\b/,
  ),
  p(
    4,
    "fx.supported_cards_currencies",
    /\b(american express|amex|which cards|what cards|types of cards|cards do you (accept|support))\b/,
  ),

  // Transfers that left but never reached the recipient
  p(
    3,
    "transfers.not_received",
    /\b(friend|recipient|landlord|person|receiver|seller|payee|they|their|he|she|her|him)\b/,
    /\b(not|hasn't|didn't|haven't|never|doesn't|can't|yet|still|cleared)\b/,
    TRANSFER,
  ),
  p(
    3,
    "transfers.not_received",
    /\b(transaction|transfer|money)\b/,
    /\b(hasn't arrived|didn't arrive|not arrived|hasn't reached|didn't reach|can't be seen|don't know where)\b/,
  ),

  // Failed transfers
  p(
    3,
    "transfers.failed",
    /\b(transfer|transfers)\b/,
    /\b(didn't complete|could not be completed|couldn't complete|wasn't able to complete|unable to (finish|complete)|keep failing|keeps failing|tried (\d+|five|5|several|many)|times|attempts|system (is )?(down|broken|broke))\b/,
  ),
  p(
    3,
    "transfers.failed",
    /\b(tried|attempts)\b/,
    /\b(5|five|several|many)\b/,
    /\b(times|attempts|transfer|transfers)\b/,
  ),

  // Incoming transfers not yet credited
  p(
    3,
    "transfers.incoming_not_credited",
    /\b(transfer|transferred|bank transfer)\b/,
    /\bfrom\b/,
    /\b(not|hasn't|yet|show|showing|arrive|reached|longer|how long)\b/,
  ),
  p(3, "transfers.incoming_not_credited", /\b(money|transfer|transferred)\b/, /\b(isn't|isnt|not) showing\b/),
  p(3, "transfers.incoming_not_credited", /\bwhere is the money (that )?i transferred\b/),

  // Cash withdrawals the customer didn't make
  p(
    3,
    "atm.unrecognised",
    /\b(withdrew|withdrawal|withdrawals|withdraw|cash|took out|take out|bank machine)\b/,
    /\b(didn't|did not|don't remember|not mine|wasn't me|random|never|i did not)\b/,
  ),

  // Identity verification trouble
  p(
    2,
    "identity.verification_problem",
    /\b(help|difficulty|trouble|problem|proving|proof|unable|not able|can't|cannot|won't|isn't|not being|doesn't know)\b/,
    /\b(verify|verifying|identity|identify|identification|id|it is me)\b/,
  ),

  // Top-up questions without the word "card"
  p(1, "topup.by_card", /\b(friends|someone else|anyone else|other people)\b/, /\b(top|add money)\b/),
  p(1, "topup.by_card", /\b(credit card|debit card)\b/, /\b(transfer|add|top|fund)\b/),
  p(2, "topup.pending", /\b(can not|can't|cannot|don't) see my top ?up\b/),
];
