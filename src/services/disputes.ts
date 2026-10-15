import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

export const disputes: ServiceHandlers = {
  request_refund: ({ bank, customer }) => {
    const last = bank
      .cardPayments(customer)
      .filter((p) => p.status === "settled")
      .at(-1);
    if (!last) return { text: "You have no settled payments to request a refund for." };
    const claim = bank.openClaim(customer, "refund_request", last.id);
    return {
      text: `We've opened refund request ${claim.id} for ${last.merchant} ${money(last.amount, last.currency)} on ${day(last.at)}. Wrong payment? Pick another in Transactions > Request refund.`,
      data: claim,
    };
  },

  refund_status: ({ bank, customer }) => {
    const r = bank.refunds(customer);
    if (!r.length)
      return {
        text: "We can't see any refunds on their way to you. Merchants can take up to 5 working days to send them.",
      };
    return {
      text: `${list(r.map((x) => `${x.merchant} ${money(x.amount, x.currency)} is ${x.status}, expected by ${day(x.expectedBy)}`))}.`,
      data: r,
    };
  },

  duplicate_charge: ({ bank, customer }) => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const p of bank.cardPayments(customer).filter((x) => x.status === "settled")) {
      const key = `${p.merchant}|${p.amount}|${p.at}`;
      if (seen.has(key)) dupes.push(p.id);
      else seen.set(key, p.id);
    }
    if (!dupes.length)
      return {
        text: "We can't see any duplicate charges. If one is still pending, it may drop off by itself.",
      };
    const claims = dupes.map((id) => bank.openClaim(customer, "duplicate_charge", id));
    const p = bank.data.cardPayments.find((x) => x.id === dupes[0]);
    return {
      text: `You were charged twice at ${p?.merchant} (${p ? money(p.amount, p.currency) : ""} on ${p ? day(p.at) : ""}). We've opened claim ${claims[0]?.id}; the duplicate will be refunded within 5 working days.`,
      data: claims,
    };
  },

  unexplained_charge: ({ bank, customer }) => {
    const fees = [
      ...bank
        .cardPayments(customer)
        .filter((p) => p.fee > 0)
        .map((p) => `${money(p.fee, "GBP")} foreign-payment fee (${p.merchant})`),
      ...bank
        .cashWithdrawals(customer)
        .filter((w) => w.fee > 0)
        .map((w) => `${money(w.fee, "GBP")} ATM fee (${w.atm})`),
      ...bank
        .transfers(customer)
        .filter((t) => t.fee > 0)
        .map((t) => `${money(t.fee, t.currency)} transfer fee (${t.counterparty})`),
    ];
    if (!fees.length)
      return {
        text: "We can't see any extra charges on your statement. Tell us the amount and date and we'll look.",
      };
    return { text: `Extra charges on your statement: ${list(fees)}.`, data: fees };
  },

  unrecognised_direct_debit: ({ bank, customer }) => {
    const d = bank.directDebits(customer);
    if (!d.length) return { text: "You have no direct debits." };
    return {
      text: `Your direct debits: ${list(d.map((x) => `${x.merchant} ${money(x.amount, x.currency)} (last collected ${day(x.lastCollected)})`))}. Tap one you don't recognise to cancel it and claim the money back.`,
      data: d,
    };
  },
};
