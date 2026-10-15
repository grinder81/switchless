/** The 11 Kestrel Bank microservices. */
export const SERVICES = {
  cards: {
    title: "Cards",
    description: "Physical card ordering, delivery, activation, renewal and card faults",
  },
  virtual_cards: {
    title: "Virtual Cards",
    description: "Virtual and single-use disposable cards: creating them, their limits and faults",
  },
  card_payments: {
    title: "Card Payments",
    description:
      "Payments made with a card: pending, declined, reverted or unrecognised payments, fees, exchange rates, where the card is accepted, Apple Pay and Google Pay",
  },
  atm: {
    title: "ATM & Cash",
    description:
      "Cash withdrawals at ATMs: fees, declines, pending or unrecognised withdrawals, wrong amount or exchange rate",
  },
  transfers: {
    title: "Transfers",
    description:
      "Bank transfers in and out: sending, receiving, cancelling, pending, failed or declined transfers, beneficiaries, timing and fees",
  },
  topup: {
    title: "Top-up",
    description:
      "Adding money to the account by card, bank transfer, cash or cheque: limits, fees, auto top-up, pending, failed or reverted top-ups",
  },
  fx: {
    title: "FX",
    description: "Currency exchange in the app, exchange rates and fees, and supported currencies",
  },
  security: {
    title: "Security",
    description: "PIN and passcode, lost or stolen cards and phones, compromised cards",
  },
  identity: {
    title: "Identity",
    description: "Identity verification (KYC), source of funds, age and country eligibility",
  },
  disputes: {
    title: "Disputes",
    description: "Refunds, duplicate or unexplained charges and unrecognised direct debits",
  },
  account: {
    title: "Account",
    description: "Personal details and closing the account",
  },
} as const satisfies Record<string, { title: string; description: string }>;

export type ServiceId = keyof typeof SERVICES;
