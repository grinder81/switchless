import { POLICY } from "../bank/policy.js";
import type { Transfer } from "../bank/types.js";
import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

const describe = (t: Transfer) =>
  `${money(t.amount, t.currency)} ${t.direction === "out" ? "to" : "from"} ${t.counterparty} on ${day(t.at)} (ref ${t.reference})`;

const byStatus =
  (status: Transfer["status"], direction: Transfer["direction"] = "out"): ServiceHandlers[string] =>
  ({ bank, customer }) => {
    const t = bank.transfers(customer).filter((x) => x.status === status && x.direction === direction);
    if (!t.length) return { text: `You have no ${status} transfers.` };
    return {
      text: `${status[0]?.toUpperCase()}${status.slice(1)}: ${list(t.map((x) => `${describe(x)}${x.reason ? `, because ${x.reason}` : ""}`))}.`,
      data: t,
    };
  };

const details = (iban: string, sortCode: string, accountNumber: string, name: string) =>
  `Name: ${name}, sort code ${sortCode}, account number ${accountNumber}, IBAN ${iban}`;

export const transfers: ServiceHandlers = {
  beneficiary_rejected: ({ bank, customer }) => {
    const r = bank.account(customer).rejectedBeneficiaries;
    if (!r.length)
      return { text: "None of your payees have been rejected. Check the details and try again." };
    return { text: `${list(r.map((b) => `${b.name} was rejected because ${b.reason}`))}.`, data: r };
  },

  cancel: ({ bank, customer }) => {
    const t = bank.transfers(customer).find((x) => x.direction === "out" && x.status === "pending");
    if (!t) return { text: "You have no pending transfers that can still be cancelled." };
    t.status = "cancelled";
    return { text: `Cancelled: ${describe(t)}. The money is back in your balance.`, data: t };
  },

  declined: byStatus("declined"),
  failed: byStatus("failed"),
  pending: byStatus("pending"),

  explain_fee: ({ bank, customer }) => {
    const t = bank.transfers(customer).filter((x) => x.fee > 0);
    const policy = `Domestic transfers are free; international transfers cost ${money(POLICY.transfers.internationalFee, POLICY.homeCurrency)}.`;
    if (!t.length) return { text: `None of your recent transfers had a fee. ${policy}` };
    return {
      text: `Fees: ${list(t.map((x) => `${money(x.fee, x.currency)} on ${describe(x)}`))}. ${policy}`,
      data: t,
    };
  },

  incoming_instructions: ({ bank, customer }) => {
    const d = bank.account(customer).bankDetails;
    return {
      text: `Send money to your Kestrel account using: ${details(d.iban, d.sortCode, d.accountNumber, customer.name)}.`,
      data: d,
    };
  },

  not_received: ({ bank, customer }) => {
    const t = bank.transfers(customer).filter((x) => x.direction === "out" && x.status === "completed");
    if (!t.length) return { text: "You have no completed transfers to trace." };
    return {
      text: `${list(t.map(describe))} left Kestrel successfully. Share the reference with the recipient's bank; international payments can take up to 5 working days.`,
      data: t,
    };
  },

  timing: () => {
    const x = POLICY.transfers.timing;
    return {
      text: `Domestic transfers arrive ${x.domestic}, SEPA transfers in ${x.sepa}, and SWIFT transfers in ${x.swift}.`,
      data: x,
    };
  },

  receive_money: ({ bank, customer }) => {
    const d = bank.account(customer).bankDetails;
    return {
      text: `Share these details with whoever is paying you: ${details(d.iban, d.sortCode, d.accountNumber, customer.name)}.`,
    };
  },

  incoming_not_credited: byStatus("pending", "in"),
};
