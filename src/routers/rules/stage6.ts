/**
 * Stage 6: remaining near-twin confusions on the dev split: refund request vs status, spare vs
 * physical card, FX fees vs exchanging vs wrong rates, receiving money, identity "why" questions,
 * transfer timing vs pending.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });

export const stage6: Rule[] = [
  // Refunds
  p(3, "disputes.request_refund", /\b(cancel|cancelling|canceling)\b/, /\b(purchase|order|item)\b/),
  p(
    3,
    "disputes.request_refund",
    /\b(how (do|can) i|where do i|how long does it take to)\b/,
    /\b(get|go for|request)\b/,
    /\brefund\b/,
  ),
  p(
    4,
    "disputes.refund_status",
    /\b(refund|money back|credit me)\b/,
    /\b(seller|merchant|waiting|received a refund|requested|not reaching|nothing shows|cannot see|can't see|aren't available|been a week)\b/,
  ),

  // Cards: spare vs physical
  p(2, "cards.order_spare", /\b(additional|extra|another|second|more|few more|spare) (physical )?cards?\b/),
  p(2, "cards.order_spare", /\b(number of|how many) cards\b/),

  // FX: fees, exchanging in the app, wrong rates on payments
  p(
    3,
    "fx.explain_fee",
    /\b(cost|costs|fee|fees|pay extra|how much|discount|discounts|charge)\b/,
    /\b(exchang|change foreign|currencies)/,
  ),
  p(
    3,
    "fx.exchange_in_app",
    /\b(change|convert|swap)\b/,
    /\b(aud|gbp|usd|eur|currency)\b/,
    /\b(to|from|another|instead)\b/,
  ),
  p(
    5,
    "card_payments.fx_rate_query",
    /\b(exchange|rate|currency)\b/,
    /\b(wrong|incorrect|not correct|isn't correct|overcharged|charged extra|error|different amount|applied)\b/,
  ),

  // Receiving money (salary, friends, employer)
  p(
    3,
    "transfers.receive_money",
    /\b(salary|boss|employer|friend|someone)\b/,
    /\b(pay me|send me|give me|send money to me|receive|getting money)\b/,
  ),
  p(3, "transfers.receive_money", /\bsalary\b/),

  // Identity: why it is needed / using the account before verification
  p(
    2,
    "identity.why_verify",
    /\b(why|policy|comfortable|so many questions|required|before|without|unless|should i)\b/,
    /\b(identity|identification|verif|verifying|who i am)/,
  ),

  // Transfers: things that should have arrived already are pending, not timing questions
  p(
    5,
    "transfers.pending",
    /\b(transfer|transfers|sent)\b/,
    /\b(pending|still|hasn't|not yet|ago|already|yesterday)\b/,
    /\b(how long|when|arrive|through|go through|come through)\b/,
  ),
];
