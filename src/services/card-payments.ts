import type { CardPayment } from "../bank/types.js";
import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

const describe = (p: CardPayment) => `${p.merchant} ${money(p.amount, p.currency)} on ${day(p.at)}`;

export const cardPayments: ServiceHandlers = {
  explain_fee: ({ bank, customer }) => {
    const withFee = bank.cardPayments(customer).filter((p) => p.fee > 0);
    if (!withFee.length) return { text: "None of your recent card payments had a fee." };
    const lines = withFee.map((p) => `${money(p.fee, "GBP")} on ${describe(p)} (foreign-currency payment)`);
    return { text: `Fees on recent card payments: ${list(lines)}.`, data: withFee };
  },

  unrecognised: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.kind === "physical" && k.status === "active");
    if (card) card.status = "frozen";
    const recent = bank
      .cardPayments(customer)
      .filter((p) => p.status === "settled" || p.status === "pending");
    const frozen = card ? `We've frozen your card ending ${card.last4} to be safe. ` : "";
    return {
      text: `${frozen}Your recent card payments: ${list(recent.map(describe))}. Tap any you don't recognise to dispute it.`,
      data: { frozen: card?.id, recent },
    };
  },

  fx_rate_query: ({ bank, customer }) => {
    const fx = bank.cardPayments(customer).filter((p) => p.rateApplied && p.marketRate);
    if (!fx.length) return { text: "You have no recent card payments in another currency." };
    const lines = fx.map(
      (p) =>
        `${describe(p)}: rate ${p.rateApplied} vs market ${p.marketRate}${p.rateApplied !== p.marketRate ? " (weekend markup applied)" : ""}`,
    );
    return { text: `Exchange rates on your card payments: ${list(lines)}.`, data: fx };
  },

  declined: ({ bank, customer }) => {
    const d = bank.cardPayments(customer).filter((p) => p.status === "declined");
    if (!d.length) return { text: "None of your recent card payments were declined." };
    return { text: `Declined: ${list(d.map((p) => `${describe(p)}, because ${p.reason}`))}.`, data: d };
  },

  pending: ({ bank, customer }) => {
    const d = bank.cardPayments(customer).filter((p) => p.status === "pending");
    if (!d.length) return { text: "You have no pending card payments." };
    return {
      text: `Pending: ${list(d.map(describe))}. Card payments usually settle within 3 working days; hotels can take up to 7.`,
      data: d,
    };
  },

  reverted: ({ bank, customer }) => {
    const d = bank.cardPayments(customer).filter((p) => p.status === "reverted");
    if (!d.length) return { text: "None of your recent card payments were reverted." };
    return {
      text: `Reverted: ${list(d.map((p) => `${describe(p)}, because ${p.reason}`))}. The money is back in your balance.`,
      data: d,
    };
  },

  acceptance: () => ({
    text: "Your Kestrel card works anywhere Visa or Mastercard is accepted, online and in shops. A few merchants (some petrol stations, toll roads and car hire desks) don't accept prepaid-style cards.",
  }),

  mobile_wallets: () => ({
    text: "Add your card to Apple Pay or Google Pay from Cards > Add to wallet. Any iPhone with Face ID or Touch ID, and Android phones with NFC, are supported.",
  }),
};
