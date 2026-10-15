/**
 * Stage 2: customer vocabulary. Synonyms and phrasings found by reading training messages
 * (dev split only), e.g. customers say "delete my account", "my phone was stolen", "salary".
 */
import { type Rule, rule } from "./rule.js";

const CARD = /\bcards?\b/;
const TOPUP = /\b(top ?ups?|topp?(ed|ing) up|top it up|top my)\b/;
const TRANSFER = /\b(transfers?|transferr?(ed|ing)|sent money|send money)\b/;
const CASH = /\b(withdraw|withdrawal|withdrawals|withdrawing|withdrew|atms?|cash|cash machine)\b/;
const FEE = /\b(fees?|charge|charged|charges|charging|cost|costs|commission)\b/;
const NOT_YET = /\b(not|hasn't|haven't|didn't|isn't|still|yet|never|no sign)\b/;
const BROKEN =
  /\b(not working|doesn't work|won't work|isn't working|stopped working|working anymore|broken|broke|doesn't seem to work)\b/;

export const stage2: Rule[] = [
  // Cards
  rule("cards.track_delivery", /\btrack(ing)?\b/),
  rule("cards.track_delivery", CARD, NOT_YET, /\b(arrived|come|received|got it|get it|delivered|mail)\b/),
  rule("cards.track_delivery", /\bcard you sent\b/),
  rule(
    "cards.delivery_estimate",
    /\b(deliver|delivered|delivery)\b/,
    /\b(when|how long|date|expect|specific|time|fast|quickly)\b/,
  ),
  rule(
    "cards.physical_card_info",
    /\bpin\b/,
    /\b(find|locate|where|haven't|receive|received|didn't get|get my|my card pin|card pin)\b/,
  ),
  rule("cards.order_physical", /\b(physical|actual|real|plastic) cards?\b/),
  rule("cards.order_spare", /\b(second|another|more|additional|extra|spare) (physical )?cards?\b/),
  rule("cards.order_spare", CARD, /\b(daughter|son|wife|husband|partner|child|family)\b/),
  rule("cards.troubleshoot", CARD, BROKEN),
  rule("cards.atm_retained", /\bswallow/),
  rule("cards.atm_retained", /\b(atm|machine) (took|ate|kept|has|didn't return|won't give)\b/),
  rule("cards.atm_retained", /\bcard (back|out)\b/, /\b(atm|machine)\b/),
  rule("cards.link_card", /\b(reactivate|found my card|found it|found the card|link)\b/),

  // Virtual cards
  rule("virtual_cards.create", /\bvirtual\b/),
  rule(
    "virtual_cards.disposable_limits",
    /\bdisposable\b/,
    /\b(limit|limits|how many|per|restrict|restrictions|number of|maximum|max)\b/,
  ),
  rule(
    "virtual_cards.troubleshoot",
    /\b(virtual|disposable)\b/,
    /\b(not working|won't work|doesn't work|declin|isn't working|rejected|fail|won't)\b/,
  ),

  // Card payments
  rule(
    "card_payments.explain_fee",
    FEE,
    /\b(paying|paid|payment|payments|purchase|for using|with (my )?card)\b/,
  ),
  rule(
    "card_payments.unrecognised",
    /\b(didn't|did not|don't|do not|never) (make|recogni[sz]e|authori[sz]e|buy|do)\b/,
    /\b(payment|payments|purchase|transaction|charge)\b/,
  ),
  rule("card_payments.unrecognised", /\b(don't|do not|didn't) recogni[sz]e\b/),
  rule(
    "card_payments.fx_rate_query",
    /\brate\b/,
    /\b(wrong|incorrect|bad|off|too high|extra|unfair|not right|interbank|charged|applied|more)\b/,
  ),
  rule(
    "card_payments.declined",
    /\b(declin|rejected|won't go through|didn't go through|not going through|refused)/,
    /\b(payment|shop|store|restaurant|purchase|card|buy|pay)\b/,
  ),
  rule(
    "card_payments.pending",
    /\b(pending|stuck|processing|hasn't gone through|not gone through|still showing)\b/,
    /\b(payment|purchase|card)\b/,
  ),
  rule(
    "card_payments.reverted",
    /\b(revert|reverted|cancelled|returned|came back|bounced)\b/,
    /\b(payment|purchase)\b/,
  ),
  rule(
    "card_payments.acceptance",
    /\b(businesses|places|shops|merchants|stores|where)\b/,
    /\b(accept|take|use|pay)\b/,
  ),
  rule("card_payments.mobile_wallets", /\b(apple|google|android pay)\b/),

  // ATM & cash
  rule("atm.atm_usage", /\batms?\b/, /\b(which|what|where|closest|nearest|accept|take|find|support|use)\b/),
  rule("atm.explain_fee", /\b(fees?|charge|charged|charges|free|cost)\b/, CASH),
  rule(
    "atm.unrecognised",
    /\b(don't|didn't|did not|never|not) (recogni[sz]e|make|do|authori[sz]e)\b/,
    /\bwithdr/,
  ),
  rule("atm.unrecognised", /\bsomeone\b/, /\bwithdr/),
  rule(
    "atm.declined",
    /\b(declin|rejected|wouldn't|won't|refused|didn't work|couldn't|unable|can't get|denied)/,
    CASH,
  ),
  rule("atm.pending", /\b(pending|in progress|still)\b/, CASH),
  rule(
    "atm.wrong_amount",
    /\b(gave me|only got|got only|received only|less|wrong amount|didn't (give|get)|short|amount of cash|asked for|amount)\b/,
    CASH,
  ),
  rule("atm.fx_rate_query", /\brate\b/, /\b(cash|withdraw|withdrawal|atm|holiday)\b/),

  // Transfers
  rule("transfers.beneficiary_rejected", /\bnot (allowed|possible)\b/, TRANSFER),
  rule(
    "transfers.cancel",
    /\b(cancel|undo|stop|reverse|revert)\b/,
    /\b(transfer|transaction|payment|sent)\b/,
  ),
  rule("transfers.cancel", /\bwrong account\b/),
  rule("transfers.failed", /\b(fail|failed|failing|rejected|unsuccessful|bounced)\b/, TRANSFER),
  rule(
    "transfers.pending",
    /\b(pending|still|not gone through|hasn't (arrived|gone)|processing)\b/,
    TRANSFER,
  ),
  rule("transfers.explain_fee", FEE, /\b(transfer|transfers|transferring|receiver)\b/),
  rule(
    "transfers.incoming_instructions",
    /\b(transfer|move|send|add|put|get) (money|funds) (in)?to (my|this|the) account\b/,
  ),
  rule("transfers.incoming_instructions", /\bfrom (another|my other|other|a different) bank\b/),
  rule(
    "transfers.not_received",
    /\b(friend|recipient|landlord|person|receiver|they|he|she)\b/,
    /\b(not|hasn't|didn't|haven't|never) (received|got|get|arrived|show|showed)\b/,
  ),
  rule("transfers.not_received", /\bi sent\b/, NOT_YET),
  rule(
    "transfers.timing",
    /\b(how long|when will|how many days|how quickly|take to|reach)\b/,
    /\b(transfer|transfers|transferring|send|sent)\b/,
  ),
  rule("transfers.receive_money", /\b(salary|employer|get paid|paid in|send me money|receive money)\b/),
  rule(
    "transfers.incoming_not_credited",
    /\b(transferred|transfer from|bank transfer)\b/,
    /\b(not|hasn't|isn't|doesn't) (showing|show|there|updated|appeared|reflect|see)\b/,
  ),

  // Top-up
  rule("topup.auto_topup", /\b(auto|automatic|automatically)\b/),
  rule(
    "topup.pending",
    /\b(pending|still|hour|not (gone|completed|showing)|taking|waiting|instant)\b/,
    TOPUP,
  ),
  rule("topup.bank_transfer_fee", FEE, /\b(sepa|swift|bank transfer|by transfer|receiving)\b/),
  rule("topup.card_fee", FEE, /\b(topping|top ?up|top ?ups)\b/, /\b(card|international|european)\b/),
  rule("topup.cash_or_cheque", /\bcash\b/, /\b(top|deposit|add|put|use)\b/),
  rule(
    "topup.failed",
    /\b(fail|failed|declin|rejected|didn't work|not working|won't|unable|error|couldn't|can't)\b/,
    TOPUP,
  ),
  rule("topup.limits", /\b(limit|limits|max|maximum|how much|cap)\b/, TOPUP),
  rule(
    "topup.reverted",
    /\b(revert|reverted|disappear|disappeared|gone|vanish|cancelled|returned|reversed)\b/,
    /\b(top|topped|top ?up)\b/,
  ),
  rule("topup.by_card", /\b(wallet|add money|load)\b/),
  rule("topup.verify_card", /\b(verif|code)\b/, /\b(top|card)\b/),
  rule(
    "topup.deposit_not_credited",
    /\b(deposit|deposited)\b/,
    /\b(balance|not|hasn't|yet|still|show|showing)\b/,
  ),

  // FX
  rule("fx.explain_fee", /\b(fees?|charge|charges|cost|discount)\b/, /\bexchang/),
  rule("fx.rates", /\b(exchange )?rates\b/),
  rule("fx.rates", /\brate\b/, /\b(what|how|calculated|determine|get|use)\b/),
  rule(
    "fx.exchange_in_app",
    /\b(gbp|usd|eur|aud|euros?|dollars?|pounds?)\b/,
    /\b(to|and|into|between)\b/,
    /\bexchang/,
  ),
  rule("fx.supported_currencies", /\b(fiat|currencies)\b/),
  rule("fx.supported_currencies", /\bcurrenc/, /\b(hold|which|what|support|available|have|keep)\b/),
  rule(
    "fx.supported_cards_currencies",
    /\b(accept|take|support)\b/,
    /\b(card|cards|american express|amex|credit card)\b/,
  ),
  rule("fx.supported_cards_currencies", /\b(american express|amex)\b/),

  // Security
  rule("security.change_pin", /\b(change|new pin|reset (my )?pin)\b/, /\bpin\b/),
  rule("security.unblock_pin", /\b(block|blocked|unblock|locked|too many|wrong pin)\b/, /\bpin\b/),
  rule("security.unblock_pin", /\bunblock/),
  rule("security.reset_passcode", /\b(passcode|password)\b/),
  rule(
    "security.reset_passcode",
    /\b(forgot|forgotten|can't remember|reset)\b/,
    /\b(log ?in|sign in|get into|app)\b/,
  ),
  rule("security.report_lost_card", /\b(lost|stolen|missing|can't find|cannot find|misplaced)\b/, CARD),
  rule("security.report_lost_phone", /\b(lost|stolen|mugged|missing)\b/, /\bphone\b/),
  rule(
    "security.compromised_card",
    /\b(someone|somebody|another person)\b/,
    /\b(using|used|has|access|details)\b/,
  ),
  rule("security.compromised_card", /\b(without my (permission|knowledge)|card details|hacked)\b/),

  // Identity
  rule("identity.start_verification", /\b(identity checks?|identity verification|documents)\b/),
  rule(
    "identity.verification_problem",
    /\b(can't|unable|cannot|won't|fail|not working|problem|trouble|keeps|rejected)\b/,
    /\b(verif|identity|prove|id)\b/,
  ),
  rule("identity.verification_problem", /\bprove (my|who)\b/),
  rule(
    "identity.why_verify",
    /\b(why|reason|need to|have to|required)\b/,
    /\b(identity|verif|verification|id)\b/,
  ),
  rule(
    "identity.source_of_funds",
    /\b(source|funds come|money (come|came) from|where (my|the) (money|funds))\b/,
  ),
  rule(
    "identity.age_requirement",
    /\b(how old|old enough|children|kids|teenager|under 18|minimum age|age limit|age)\b/,
  ),
  rule(
    "identity.country_eligibility",
    /\b(countries|country|i live in|the (uk|eu|us)|resident|available in)\b/,
  ),

  // Disputes
  rule(
    "disputes.refund_status",
    /\brefund/,
    /\b(not|hasn't|still|where|yet|haven't|didn't|keep checking|missing|show)\b/,
  ),
  rule("disputes.duplicate_charge", /\b(two times|same (transaction|charge|payment))\b/),
  rule("disputes.unexplained_charge", /\bstatement\b/),
  rule(
    "disputes.unexplained_charge",
    /\b(extra|additional|unknown|unexpected|random|weird|strange) (charge|fee|pound|euro|dollar)\b/,
  ),
  rule("disputes.unexplained_charge", /(\$1|£1|1£|€1|1€|\bpound\b)/),
  rule("disputes.unrecognised_direct_debit", /\bdebit\b/),

  // Account
  rule(
    "account.edit_details",
    /\b(address|personal details|my details|my name|surname|email|phone number)\b/,
    /\b(change|update|edit|new|wrong|correct|moved)\b/,
  ),
  rule("account.edit_details", /\bmarried\b/),
  rule("account.close", /\b(close|delete|terminate|cancel|shut) (my |the )?account\b/),
  rule("account.close", /\bdelete my\b/),
  rule("account.close", /\bnot (happy|satisfied)\b/),
];
