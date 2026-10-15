/**
 * Stage 1: written from the product spec only (action names and descriptions in docs/product.md),
 * before looking at any customer messages. One or two obvious rules per action.
 */
import { type Rule, rule } from "./rule.js";

const CARD = /\bcard\b/;
const FEE = /\b(fee|fees|charge|charged|charges)\b/;
const TOPUP = /\btop ?up|topp?ing up\b/;
const TRANSFER = /\btransfer/;
const WITHDRAW = /\b(withdraw|withdrawal|atm|cash)\b/;
const PAYMENT = /\b(payment|purchase|paid|pay)\b/;

export const stage1: Rule[] = [
  // Cards
  rule("cards.activate", /\bactivat/),
  rule("cards.track_delivery", CARD, /\barriv/),
  rule("cards.delivery_estimate", CARD, /\b(how long|deliver)/),
  rule("cards.renew_expiring", /\bexpir/),
  rule("cards.physical_card_info", /\bphysical card/),
  rule("cards.order_physical", /\border/, CARD),
  rule("cards.order_spare", /\b(spare|additional|extra|second|another) card/),
  rule("cards.troubleshoot", CARD, /\b(not working|doesn't work|isn't working|broken)/),
  rule("cards.atm_retained", /\b(swallow|retain|kept|ate)/, CARD),
  rule("cards.contactless_troubleshoot", /\bcontactless/),
  rule("cards.link_card", /\blink/),
  rule("cards.card_network", /\b(visa|mastercard)\b/),

  // Virtual cards
  rule("virtual_cards.create", /\bvirtual card/),
  rule("virtual_cards.create_disposable", /\bdisposable/),
  rule("virtual_cards.disposable_limits", /\bdisposable/, /\blimit/),
  rule("virtual_cards.troubleshoot", /\bvirtual/, /\b(not working|doesn't work|declin)/),

  // Card payments
  rule("card_payments.explain_fee", FEE, PAYMENT),
  rule("card_payments.unrecognised", /\b(don't|do not) recogni[sz]e/, PAYMENT),
  rule("card_payments.fx_rate_query", /\bexchange rate/, PAYMENT),
  rule("card_payments.declined", /\bdeclin/, PAYMENT),
  rule("card_payments.pending", /\bpending/, PAYMENT),
  rule("card_payments.reverted", /\b(revert|returned)/),
  rule("card_payments.acceptance", /\baccept/),
  rule("card_payments.mobile_wallets", /\b(apple pay|google pay)/),

  // ATM & cash
  rule("atm.atm_usage", /\batm\b/),
  rule("atm.explain_fee", FEE, WITHDRAW),
  rule("atm.unrecognised", /\brecogni[sz]e/, WITHDRAW),
  rule("atm.declined", /\bdeclin/, WITHDRAW),
  rule("atm.pending", /\bpending/, WITHDRAW),
  rule("atm.wrong_amount", /\b(wrong amount|less (cash|money))/),
  rule("atm.fx_rate_query", /\bexchange rate/, WITHDRAW),

  // Transfers
  rule("transfers.beneficiary_rejected", /\b(beneficiar|payee)/),
  rule("transfers.cancel", /\bcancel/, TRANSFER),
  rule("transfers.declined", /\bdeclin/, TRANSFER),
  rule("transfers.failed", /\bfail/, TRANSFER),
  rule("transfers.pending", /\bpending/, TRANSFER),
  rule("transfers.explain_fee", FEE, TRANSFER),
  rule("transfers.incoming_instructions", TRANSFER, /\b(into|to) (my|this) account/),
  rule("transfers.not_received", /\brecipient/),
  rule("transfers.timing", /\bhow long/, TRANSFER),
  rule("transfers.receive_money", /\breceiv(e|ing) money/),
  rule("transfers.incoming_not_credited", /\bbalance/, TRANSFER),

  // Top-up
  rule("topup.auto_topup", /\bauto(matic)? ?top/),
  rule("topup.pending", /\bpending/, TOPUP),
  rule("topup.bank_transfer_fee", FEE, TOPUP, TRANSFER),
  rule("topup.card_fee", FEE, TOPUP, CARD),
  rule("topup.cash_or_cheque", /\b(cheque|check)\b/),
  rule("topup.failed", /\bfail/, TOPUP),
  rule("topup.limits", /\blimit/, TOPUP),
  rule("topup.reverted", /\brevert/, TOPUP),
  rule("topup.by_card", TOPUP, CARD),
  rule("topup.verify_card", /\bverif/, TOPUP),
  rule("topup.deposit_not_credited", /\bdeposit/),

  // FX
  rule("fx.explain_fee", FEE, /\bexchang/),
  rule("fx.rates", /\bexchange rate/),
  rule("fx.exchange_in_app", /\bexchang/),
  rule("fx.supported_currencies", /\bcurrenc/),
  rule("fx.supported_cards_currencies", /\bsupport/, /\b(card|currenc)/),

  // Security
  rule("security.change_pin", /\bchange/, /\bpin\b/),
  rule("security.unblock_pin", /\bpin\b/, /\bblock/),
  rule("security.reset_passcode", /\bpasscode/),
  rule("security.report_lost_card", /\b(lost|stolen)/, CARD),
  rule("security.report_lost_phone", /\b(lost|stolen)/, /\bphone/),
  rule("security.compromised_card", /\b(compromis|fraud)/),

  // Identity
  rule("identity.start_verification", /\bverify (my )?identity/),
  rule("identity.verification_problem", /\b(can't|unable|fail)/, /\bverif/),
  rule("identity.why_verify", /\bwhy\b/, /\bverif/),
  rule("identity.source_of_funds", /\bsource of (funds|money)/),
  rule("identity.age_requirement", /\b(age|old)\b/),
  rule("identity.country_eligibility", /\bcountr/),

  // Disputes
  rule("disputes.request_refund", /\brefund/),
  rule("disputes.refund_status", /\brefund/, /\b(not|hasn't|still|where)\b/),
  rule("disputes.duplicate_charge", /\b(twice|double|duplicate)/),
  rule("disputes.unexplained_charge", /\b(extra|unexpected|unknown) (charge|fee)/),
  rule("disputes.unrecognised_direct_debit", /\bdirect debit/),

  // Account
  rule("account.edit_details", /\b(change|update|edit)\b/, /\b(address|name|details|email)/),
  rule("account.close", /\b(close|delete|terminate)\b/, /\baccount/),
];
