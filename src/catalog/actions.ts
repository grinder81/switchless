import type { ServiceId } from "./services.js";

export interface Action {
  /** Stable action id used in code and logs: `<service>.<verb>`. */
  id: string;
  /** The Banking77 label this action answers (ground truth). */
  intent: string;
  service: ServiceId;
  /** One line shown to the LLM and JEV routers as the option text. */
  description: string;
  /** What the handler does against the fake bank. */
  handler: string;
}

const a = (
  intent: string,
  service: ServiceId,
  verb: string,
  description: string,
  handler: string,
): Action => ({ id: `${service}.${verb}`, intent, service, description, handler });

/** The 77 actions, one per Banking77 intent. */
export const ACTIONS: readonly Action[] = [
  // Cards
  a(
    "activate_my_card",
    "cards",
    "activate",
    "Activate a physical card the customer has received",
    "Mark the delivered card active",
  ),
  a(
    "card_arrival",
    "cards",
    "track_delivery",
    "An ordered card has not arrived yet; where is it",
    "Return shipping status and tracking for the latest card order",
  ),
  a(
    "card_delivery_estimate",
    "cards",
    "delivery_estimate",
    "How long card delivery takes",
    "Return delivery time for the customer's country",
  ),
  a(
    "card_about_to_expire",
    "cards",
    "renew_expiring",
    "The card is about to expire; how to get a new one",
    "Show expiry date and schedule a replacement",
  ),
  a(
    "get_physical_card",
    "cards",
    "physical_card_info",
    "How to get a physical card",
    "Explain physical card eligibility and steps",
  ),
  a(
    "order_physical_card",
    "cards",
    "order_physical",
    "Order a physical card, including delivery options and cost",
    "Create a card order",
  ),
  a(
    "getting_spare_card",
    "cards",
    "order_spare",
    "Get an additional or spare card on the same account",
    "Create an additional card order",
  ),
  a(
    "card_not_working",
    "cards",
    "troubleshoot",
    "The physical card is not working",
    "Check card status and recent declines; suggest fixes",
  ),
  a(
    "card_swallowed",
    "cards",
    "atm_retained",
    "An ATM kept or swallowed the card",
    "Block the retained card and offer a replacement",
  ),
  a(
    "contactless_not_working",
    "cards",
    "contactless_troubleshoot",
    "Contactless payments are not working",
    "Check contactless status and chip-and-PIN reset",
  ),
  a(
    "card_linking",
    "cards",
    "link_card",
    "Link a received or existing card to the app",
    "Attach the card to the customer's app account",
  ),
  a(
    "visa_or_mastercard",
    "cards",
    "card_network",
    "Whether cards are Visa or Mastercard",
    "Return the card network",
  ),

  // Virtual cards
  a("getting_virtual_card", "virtual_cards", "create", "Get a virtual card", "Create a virtual card"),
  a(
    "get_disposable_virtual_card",
    "virtual_cards",
    "create_disposable",
    "Get a single-use disposable virtual card",
    "Create a disposable virtual card",
  ),
  a(
    "disposable_card_limits",
    "virtual_cards",
    "disposable_limits",
    "Limits on disposable virtual cards",
    "Return disposable card limits",
  ),
  a(
    "virtual_card_not_working",
    "virtual_cards",
    "troubleshoot",
    "A virtual card is not working",
    "Check virtual card status and recent declines",
  ),

  // Card payments
  a(
    "card_payment_fee_charged",
    "card_payments",
    "explain_fee",
    "A fee was charged on a card payment",
    "Find the fee and explain why it applied",
  ),
  a(
    "card_payment_not_recognised",
    "card_payments",
    "unrecognised",
    "The customer does not recognise a card payment",
    "Freeze the card, then list recent card payments",
  ),
  a(
    "card_payment_wrong_exchange_rate",
    "card_payments",
    "fx_rate_query",
    "A card payment abroad used the wrong exchange rate",
    "Show the rate applied vs the market rate at the time",
  ),
  a(
    "declined_card_payment",
    "card_payments",
    "declined",
    "A card payment was declined",
    "Find the decline and its reason",
  ),
  a(
    "pending_card_payment",
    "card_payments",
    "pending",
    "A card payment is still pending",
    "Show pending card payments and expected settlement",
  ),
  a(
    "reverted_card_payment?",
    "card_payments",
    "reverted",
    "A card payment was reverted or returned",
    "Find the reversal and explain it",
  ),
  a(
    "card_acceptance",
    "card_payments",
    "acceptance",
    "Where the card is or isn't accepted",
    "Explain merchant acceptance rules",
  ),
  a(
    "apple_pay_or_google_pay",
    "card_payments",
    "mobile_wallets",
    "Using Apple Pay or Google Pay",
    "Explain wallet setup and supported devices",
  ),

  // ATM & cash
  a(
    "atm_support",
    "atm",
    "atm_usage",
    "Which ATMs accept the card and how to use them",
    "Explain ATM support",
  ),
  a(
    "cash_withdrawal_charge",
    "atm",
    "explain_fee",
    "A fee was charged on a cash withdrawal",
    "Find the withdrawal fee and explain it",
  ),
  a(
    "cash_withdrawal_not_recognised",
    "atm",
    "unrecognised",
    "The customer does not recognise a cash withdrawal",
    "Freeze the card, then list recent withdrawals",
  ),
  a(
    "declined_cash_withdrawal",
    "atm",
    "declined",
    "A cash withdrawal was declined",
    "Find the declined withdrawal and its reason",
  ),
  a(
    "pending_cash_withdrawal",
    "atm",
    "pending",
    "A cash withdrawal is still pending",
    "Show pending withdrawals",
  ),
  a(
    "wrong_amount_of_cash_received",
    "atm",
    "wrong_amount",
    "The ATM gave the wrong amount of cash",
    "Open an ATM discrepancy claim",
  ),
  a(
    "wrong_exchange_rate_for_cash_withdrawal",
    "atm",
    "fx_rate_query",
    "A cash withdrawal abroad used the wrong exchange rate",
    "Show the rate applied vs the market rate",
  ),

  // Transfers
  a(
    "beneficiary_not_allowed",
    "transfers",
    "beneficiary_rejected",
    "Adding a beneficiary or payee is not allowed",
    "Explain why the beneficiary was rejected",
  ),
  a("cancel_transfer", "transfers", "cancel", "Cancel a transfer", "Cancel the transfer if still pending"),
  a(
    "declined_transfer",
    "transfers",
    "declined",
    "An outgoing transfer was declined",
    "Find the declined transfer and its reason",
  ),
  a(
    "failed_transfer",
    "transfers",
    "failed",
    "An outgoing transfer failed",
    "Find the failed transfer and next steps",
  ),
  a(
    "pending_transfer",
    "transfers",
    "pending",
    "An outgoing transfer is still pending",
    "Show pending transfers",
  ),
  a(
    "transfer_fee_charged",
    "transfers",
    "explain_fee",
    "A fee was charged on a transfer",
    "Find the transfer fee and explain it",
  ),
  a(
    "transfer_into_account",
    "transfers",
    "incoming_instructions",
    "How to transfer money into this account from another bank",
    "Return the account's bank details",
  ),
  a(
    "transfer_not_received_by_recipient",
    "transfers",
    "not_received",
    "A sent transfer has not reached the recipient",
    "Show transfer status and trace reference",
  ),
  a(
    "transfer_timing",
    "transfers",
    "timing",
    "How long transfers take",
    "Return transfer times by type and currency",
  ),
  a(
    "receiving_money",
    "transfers",
    "receive_money",
    "How to receive money from others",
    "Explain receiving and share account details",
  ),
  a(
    "balance_not_updated_after_bank_transfer",
    "transfers",
    "incoming_not_credited",
    "An incoming bank transfer has not shown in the balance",
    "Look for the incoming transfer and its status",
  ),

  // Top-up
  a(
    "automatic_top_up",
    "topup",
    "auto_topup",
    "Set up or manage automatic top-up",
    "Show or change auto top-up settings",
  ),
  a("pending_top_up", "topup", "pending", "A top-up is still pending", "Show pending top-ups"),
  a(
    "top_up_by_bank_transfer_charge",
    "topup",
    "bank_transfer_fee",
    "Fees for topping up by bank transfer",
    "Explain bank-transfer top-up fees",
  ),
  a("top_up_by_card_charge", "topup", "card_fee", "Fees for topping up by card", "Explain card top-up fees"),
  a(
    "top_up_by_cash_or_cheque",
    "topup",
    "cash_or_cheque",
    "Topping up with cash or a cheque",
    "Explain cash and cheque top-ups",
  ),
  a("top_up_failed", "topup", "failed", "A top-up failed", "Find the failed top-up and its reason"),
  a("top_up_limits", "topup", "limits", "Limits on top-ups", "Return top-up limits"),
  a("top_up_reverted", "topup", "reverted", "A top-up was reverted", "Find the reversal and explain it"),
  a("topping_up_by_card", "topup", "by_card", "How to top up with a card", "Explain card top-up steps"),
  a(
    "verify_top_up",
    "topup",
    "verify_card",
    "Verifying a card used for top-up",
    "Start the top-up card verification",
  ),
  a(
    "balance_not_updated_after_cheque_or_cash_deposit",
    "topup",
    "deposit_not_credited",
    "A cash or cheque deposit has not shown in the balance",
    "Look for the deposit and its status",
  ),

  // FX
  a("exchange_charge", "fx", "explain_fee", "Fees for currency exchange", "Explain exchange fees"),
  a("exchange_rate", "fx", "rates", "Exchange rates used by the bank", "Return current rates"),
  a("exchange_via_app", "fx", "exchange_in_app", "Exchange currency in the app", "Explain in-app exchange"),
  a(
    "fiat_currency_support",
    "fx",
    "supported_currencies",
    "Which currencies can be held or exchanged",
    "Return supported currencies",
  ),
  a(
    "supported_cards_and_currencies",
    "fx",
    "supported_cards_currencies",
    "Which cards and currencies are supported",
    "Return supported cards and currencies",
  ),

  // Security
  a("change_pin", "security", "change_pin", "Change the card PIN", "Explain how to change the PIN"),
  a("pin_blocked", "security", "unblock_pin", "The PIN is blocked", "Unblock the PIN after checks"),
  a("passcode_forgotten", "security", "reset_passcode", "Forgot the app passcode", "Start passcode reset"),
  a(
    "lost_or_stolen_card",
    "security",
    "report_lost_card",
    "The card is lost or stolen",
    "Freeze the card and offer a replacement",
  ),
  a(
    "lost_or_stolen_phone",
    "security",
    "report_lost_phone",
    "The phone with the app is lost or stolen",
    "Sign out devices and secure the account",
  ),
  a(
    "compromised_card",
    "security",
    "compromised_card",
    "Card details may have been stolen or used by someone else",
    "Freeze the card and review recent activity",
  ),

  // Identity
  a("verify_my_identity", "identity", "start_verification", "Verify identity", "Start identity verification"),
  a(
    "unable_to_verify_identity",
    "identity",
    "verification_problem",
    "Identity verification is failing",
    "Show the verification status and failure reason",
  ),
  a(
    "why_verify_identity",
    "identity",
    "why_verify",
    "Why identity verification is required",
    "Explain KYC requirements",
  ),
  a(
    "verify_source_of_funds",
    "identity",
    "source_of_funds",
    "Why and how to verify where money comes from",
    "Explain source-of-funds checks",
  ),
  a("age_limit", "identity", "age_requirement", "Minimum age to open an account", "Return age requirements"),
  a(
    "country_support",
    "identity",
    "country_eligibility",
    "Which countries the bank supports",
    "Return supported countries",
  ),

  // Disputes
  a(
    "request_refund",
    "disputes",
    "request_refund",
    "Request a refund for a purchase",
    "Open a refund request",
  ),
  a(
    "Refund_not_showing_up",
    "disputes",
    "refund_status",
    "A refund has not shown up",
    "Look for the refund and its status",
  ),
  a(
    "transaction_charged_twice",
    "disputes",
    "duplicate_charge",
    "A transaction was charged twice",
    "Find duplicates and open a claim",
  ),
  a(
    "extra_charge_on_statement",
    "disputes",
    "unexplained_charge",
    "An unexplained extra charge on the statement",
    "Find the charge and explain it",
  ),
  a(
    "direct_debit_payment_not_recognised",
    "disputes",
    "unrecognised_direct_debit",
    "The customer does not recognise a direct debit",
    "List direct debits and offer to cancel one",
  ),

  // Account
  a(
    "edit_personal_details",
    "account",
    "edit_details",
    "Change personal details",
    "Update name, address or contact details",
  ),
  a("terminate_account", "account", "close", "Close the account", "Start account closure"),
];

export const ACTION_BY_INTENT: ReadonlyMap<string, Action> = new Map(ACTIONS.map((x) => [x.intent, x]));
export const ACTION_BY_ID: ReadonlyMap<string, Action> = new Map(ACTIONS.map((x) => [x.id, x]));
