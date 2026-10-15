import { POLICY } from "../bank/policy.js";
import type { TopUp } from "../bank/types.js";
import { day, list, money } from "./format.js";
import type { Handler, ServiceHandlers } from "./types.js";

const describe = (t: TopUp) =>
  `${money(t.amount, t.currency)} by ${t.method.replace("_", " ")} on ${day(t.at)}`;

const byStatus =
  (status: TopUp["status"], methods?: TopUp["method"][]): Handler =>
  ({ bank, customer }) => {
    const t = bank
      .topUps(customer)
      .filter((x) => x.status === status && (!methods || methods.includes(x.method)));
    if (!t.length) return { text: `You have no ${status} top-ups.` };
    return {
      text: `${list(t.map((x) => `${describe(x)} is ${status}${x.reason ? ` because ${x.reason}` : ""}`))}.`,
      data: t,
    };
  };

const T = POLICY.topUp;

export const topup: ServiceHandlers = {
  auto_topup: ({ bank, customer }) => {
    const a = bank.account(customer).autoTopUp;
    return {
      text: a.enabled
        ? `Auto top-up is on: when your balance drops below ${money(a.threshold, POLICY.homeCurrency)} we add ${money(a.amount, POLICY.homeCurrency)}. Change it in Account > Auto top-up.`
        : "Auto top-up is off. Turn it on in Account > Auto top-up and choose a threshold and amount.",
      data: a,
    };
  },

  pending: byStatus("pending"),

  bank_transfer_fee: () => ({ text: "Topping up by bank transfer is free." }),

  card_fee: () => ({
    text: `Card top-ups are free up to ${money(T.cardFeeFreeUpTo, POLICY.homeCurrency)} a month, then ${T.cardFeePct}%.`,
  }),

  cash_or_cheque: () => ({ text: T.cashOrCheque }),

  failed: byStatus("failed"),

  limits: () => ({
    text: `You can top up up to ${money(T.limits.single, POLICY.homeCurrency)} at a time and ${money(T.limits.monthly, POLICY.homeCurrency)} a month.`,
    data: T.limits,
  }),

  reverted: byStatus("reverted"),

  by_card: () => ({
    text: `Go to Home > Add money > Card, enter your debit card and the amount. Accepted: ${list([...POLICY.topUpCardsAccepted])}.`,
  }),

  verify_card: ({ bank, customer }) => {
    const pending = bank.topUps(customer).find((x) => x.method === "card" && x.status === "pending");
    return {
      text: pending
        ? `We've sent a small charge with a 4-digit code to the card you used for ${describe(pending)}. Enter the code in the app to verify it and release the top-up.`
        : "To verify a top-up card, we make a small charge with a 4-digit code; enter it in Add money > Verify card.",
      data: pending,
    };
  },

  deposit_not_credited: byStatus("pending", ["cash", "cheque"]),
};
