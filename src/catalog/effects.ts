/**
 * Which handlers can change bank state, read from the handler code in `src/services/`. Every other
 * action only returns information. `tests/effects.test.ts` runs each handler for every seed customer
 * and checks this list against what actually changed.
 *
 * "Can change state" describes the handler, not an outcome: whether a call changes anything depends
 * on the customer's accounts (for example, `transfers.cancel` only cancels a pending transfer).
 */
export const STATE_CHANGING: ReadonlyMap<string, string> = new Map([
  ["cards.activate", "activates a delivered card"],
  ["cards.renew_expiring", "orders replacements for expiring cards"],
  ["cards.order_physical", "orders a new physical card"],
  ["cards.order_spare", "orders an additional physical card"],
  ["cards.atm_retained", "blocks the retained card and orders a replacement"],
  ["cards.link_card", "links a card to the app"],
  ["virtual_cards.create", "issues a virtual card"],
  ["virtual_cards.create_disposable", "issues a disposable virtual card"],
  ["card_payments.unrecognised", "freezes the card used for the payment"],
  ["atm.unrecognised", "freezes the card used for the withdrawal"],
  ["atm.wrong_amount", "opens an ATM discrepancy claim"],
  ["transfers.cancel", "cancels a pending transfer"],
  ["security.unblock_pin", "unblocks a blocked PIN"],
  ["security.reset_passcode", "flags a passcode reset"],
  ["security.report_lost_card", "blocks live cards and orders a replacement"],
  ["security.report_lost_phone", "signs the customer out on all devices"],
  ["security.compromised_card", "freezes live cards"],
  ["identity.start_verification", "starts identity verification"],
  ["disputes.request_refund", "opens a refund claim"],
  ["disputes.duplicate_charge", "opens a claim for each duplicate charge"],
]);
