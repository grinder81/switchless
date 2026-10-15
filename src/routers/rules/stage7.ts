/**
 * Stage 7: repairs stage 6 regressions (its wrong-rate rule captured ATM withdrawals; its identity
 * "why" rule captured top-up card verification) and the next most common confusions.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });

export const stage7: Rule[] = [
  p(
    6,
    "atm.fx_rate_query",
    /\b(rate|exchange)\b/,
    /\b(cash|withdraw|withdrawal|withdrew|withdrawn|atm|took out|took money out|get money)\b/,
  ),
  p(5, "topup.verify_card", /\b(verif|verification|code|authenticat)/, /\b(top|topping|top ?up)\b/),
  p(
    6,
    "topup.deposit_not_credited",
    /\b(cheque|check|cash)\b/,
    /\b(deposit|deposited|depositing|put|placed)\b/,
    /\b(not|isn't|hasn't|haven't|yet|still|taking|long|show|showing|cleared|hold|waiting|balance|gone thru|gone through)\b/,
  ),
  p(
    4,
    "topup.bank_transfer_fee",
    /\b(someone sends me|money is added|money added|top ?up my account|top off|receive money|receiving money|to receive)\b/,
    /\b(fee|fees|charge|charged|charges|cost)\b/,
  ),
  p(
    3,
    "virtual_cards.disposable_limits",
    /\bdisposable\b/,
    /\b(limit|limits|how many|per|restrict|restrictions|number|maximum|max|times|amount)\b/,
  ),
  p(3, "fx.supported_cards_currencies", /\b(card|cards)\b/, /\b(currenc)/),
  {
    action: "transfers.incoming_not_credited",
    when: [
      /\b(transfer|transferred|bank transfer)\b/,
      /\b(from (my|a|the|another)|uk account|from france|from abroad)\b/,
    ],
    priority: 6,
  },
];
