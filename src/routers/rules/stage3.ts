/**
 * Stage 3: tie-breakers for near-twin actions, found from the most common confusions on the dev
 * split. Each rule outranks the generic ones with an explicit priority.
 */
import type { Rule } from "./rule.js";

const p = (priority: number, action: string, ...when: RegExp[]): Rule => ({ action, when, priority });
const TOPUP = /\b(top ?ups?|topp?(ed|ing) up|top it up|top my|topping)\b/;
const TRANSFER = /\b(transfers?|transferr?(ed|ing))\b/;
const NOT_THERE =
  /\b(not|isn't|hasn't|haven't|don't see|can't see|unable to see|yet|still|taking|long|show|showing|appear|thru|through|cleared|hold|waiting|balance)\b/;

export const stage3: Rule[] = [
  // ATM: declined / wrong amount / exchange rate beat generic "atm" questions
  p(
    1,
    "atm.declined",
    /\b(declin|blocked|couldn't|could not|couldnt|can't|cannot|unable|not able|wouldn't|would not|won't|didn't work|cancelled|refused)/,
    /\b(withdraw|withdrawal|cash out|get cash|get money|get my money|take cash|take out|cash|atm)\b/,
  ),
  p(
    2,
    "atm.wrong_amount",
    /\b(gave me|only got|got only|only received|only gave|less than|wrong amount|amount of (cash|money)|asked for|instead of|short)\b/,
    /\b(atm|cash|machine|withdraw|withdrawal|money)\b/,
  ),
  p(
    2,
    "atm.fx_rate_query",
    /\brate\b/,
    /\b(cash|withdraw|withdrawal|withdrew|atm|holiday|took out|got money)\b/,
  ),
  p(
    1,
    "atm.pending",
    /\b(pending|in progress|still showing|still shows)\b/,
    /\b(withdraw|withdrawal|atm|cash machine|machine)\b/,
  ),

  // Deposits that haven't shown up vs how to top up with cash or a cheque
  p(
    2,
    "topup.deposit_not_credited",
    /\b(cheque|check|cash)\b/,
    /\b(deposit|deposited|depositing|put|placed)\b/,
    NOT_THERE,
  ),
  p(2, "topup.deposit_not_credited", /\bdeposit(ed)?\b/, /\b(balance|account)\b/, NOT_THERE),

  // Top-up: verification, failures and fees beat "top up by card"
  p(1, "topup.verify_card", /\b(verif|code|authenticat)/, /\b(top|card)\b/),
  p(
    1,
    "topup.failed",
    /\b(fail|failed|declin|rejected|didn't work|not working|won't|unable|error|couldn't|can't|problem|keeps)\b/,
    TOPUP,
  ),
  p(1, "topup.bank_transfer_fee", /\b(sepa|swift)\b/),
  p(1, "topup.bank_transfer_fee", /\b(fee|fees|charge|charged|cost|how much)\b/, /\breceiv/),
  p(
    1,
    "topup.reverted",
    /\b(revert|reverted|disappear|disappeared|vanish|reversed|gone)\b/,
    /\b(top|topped|top ?up)\b/,
  ),
  p(
    1,
    "topup.pending",
    /\b(pending|hour|still|not (gone|completed|showing)|taking|waiting|instant)\b/,
    TOPUP,
  ),

  // Direct debits are disputes, not card payments
  p(2, "disputes.unrecognised_direct_debit", /\bdirect debit\b/),
  p(2, "disputes.unrecognised_direct_debit", /\bdebit (payment|transaction|charge)\b/),

  // Refund status ("where is my refund") vs requesting one
  p(
    1,
    "disputes.request_refund",
    /\brefund/,
    /\b(item|product|bought|purchase|order|want a refund|request a refund|refund for|ask for a refund)\b/,
  ),
  p(
    2,
    "disputes.refund_status",
    /\brefund/,
    /\b(requested|my refund|the refund|isn't|hasn't|haven't|not (showing|show|there|received|in)|don't see|can't see|unable to see|when will|still|yet|taking|long|come through|keep checking|need my)\b/,
  ),

  // Virtual cards: disposable beats generic virtual; limits and faults beat disposable
  p(1, "virtual_cards.create_disposable", /\bdisposable\b/),
  p(
    2,
    "virtual_cards.disposable_limits",
    /\bdisposable\b/,
    /\b(limit|limits|how many|per|restrict|restrictions|number of|maximum|max|times)\b/,
  ),
  p(
    2,
    "virtual_cards.troubleshoot",
    /\b(virtual|disposable)\b/,
    /\b(not working|won't work|doesn't work|declin|isn't working|rejected|fail|won't|didn't work)\b/,
  ),

  // Cards
  p(1, "cards.order_physical", /\b(physical|actual|real|plastic) cards?\b/),
  p(
    2,
    "cards.physical_card_info",
    /\bpin\b/,
    /\b(find|locate|where|haven't|receive|received|didn't get|get my|card pin|yet|anywhere|never got)\b/,
  ),
  p(1, "cards.renew_expiring", /\bexpir/),
  p(1, "cards.link_card", /\b(found|reactivate|link|linking)\b/),

  // FX: cards & currencies we accept vs currencies we hold vs exchanging in the app
  p(
    1,
    "fx.supported_cards_currencies",
    /\b(card|cards|american express|amex|visa|mastercard|credit)\b/,
    /\b(accept|support|take|use|add)\b/,
  ),
  p(1, "fx.supported_currencies", /\b(fiat|hold|holding|keep)\b/),
  p(1, "fx.exchange_in_app", /\bexchang/, /\b(gbp|usd|aud|eur|app|between|into)\b/),

  // Transfers: pending beats timing; incoming money not credited beats generic transfer questions
  p(1, "transfers.pending", /\b(pending|not (gone|went) through|hasn't gone|processing)\b/, TRANSFER),
  p(
    1,
    "transfers.incoming_not_credited",
    TRANSFER,
    /\b(balance|not (showing|show|there|in my account|arrived|received)|hasn't (arrived|shown|appeared|come))\b/,
    /\b(from|into my|to my|uk account|my account)\b/,
  ),

  // Identity: "why" questions beat generic verification
  p(1, "identity.why_verify", /\b(why|reason)\b/, /\b(identity|verif|verification|id)\b/),
];
