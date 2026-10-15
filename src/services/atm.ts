import { POLICY } from "../bank/policy.js";
import type { CashWithdrawal } from "../bank/types.js";
import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

const describe = (w: CashWithdrawal) => `${money(w.amount, w.currency)} at ${w.atm} on ${day(w.at)}`;

export const atm: ServiceHandlers = {
  atm_usage: () => ({
    text: `Your card works at any ATM showing the Visa or Mastercard logo. The first ${money(POLICY.atm.freeMonthly, POLICY.homeCurrency)} each month is free, then ${POLICY.atm.overFeePct}%. The ATM operator may add its own fee.`,
  }),

  explain_fee: ({ bank, customer }) => {
    const w = bank.cashWithdrawals(customer).filter((x) => x.fee > 0);
    if (!w.length) return { text: "None of your recent withdrawals had a fee." };
    return {
      text: `Fees: ${list(w.map((x) => `${money(x.fee, POLICY.homeCurrency)} on ${describe(x)}`))}. You'd used your free ${money(POLICY.atm.freeMonthly, POLICY.homeCurrency)} monthly allowance.`,
      data: w,
    };
  },

  unrecognised: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.kind === "physical" && k.status === "active");
    if (card) card.status = "frozen";
    const w = bank.cashWithdrawals(customer).filter((x) => x.status !== "declined");
    const frozen = card ? `We've frozen your card ending ${card.last4} to be safe. ` : "";
    return {
      text: `${frozen}Your recent withdrawals: ${list(w.map(describe))}.`,
      data: { frozen: card?.id, recent: w },
    };
  },

  declined: ({ bank, customer }) => {
    const w = bank.cashWithdrawals(customer).filter((x) => x.status === "declined");
    if (!w.length) return { text: "None of your recent withdrawals were declined." };
    return { text: `Declined: ${list(w.map((x) => `${describe(x)}, because ${x.reason}`))}.`, data: w };
  },

  pending: ({ bank, customer }) => {
    const w = bank.cashWithdrawals(customer).filter((x) => x.status === "pending");
    if (!w.length) return { text: "You have no pending withdrawals." };
    return {
      text: `Pending: ${list(w.map(describe))}. Withdrawals usually settle within 2 working days.`,
      data: w,
    };
  },

  wrong_amount: ({ bank, customer }) => {
    const w = bank.cashWithdrawals(customer).find((x) => x.dispensed !== undefined && x.dispensed < x.amount);
    if (!w || w.dispensed === undefined) {
      return {
        text: "We can't see a withdrawal where the ATM gave less than requested. Tell us which one and we'll investigate.",
      };
    }
    const claim = bank.openClaim(customer, "atm_discrepancy", w.id);
    return {
      text: `We've opened claim ${claim.id}: you were charged ${money(w.amount, w.currency)} at ${w.atm} but received ${money(w.dispensed, w.currency)}. We'll update you within 10 working days.`,
      data: { claim, withdrawal: w },
    };
  },

  fx_rate_query: ({ bank, customer }) => {
    const w = bank.cashWithdrawals(customer).filter((x) => x.rateApplied && x.marketRate);
    if (!w.length) return { text: "You have no recent withdrawals in another currency." };
    return {
      text: `Rates on your withdrawals: ${list(w.map((x) => `${describe(x)}: ${x.rateApplied} vs market ${x.marketRate}`))}. Some ATMs offer their own conversion; always choose to be charged in the local currency.`,
      data: w,
    };
  },
};
