import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

export const security: ServiceHandlers = {
  change_pin: () => ({
    text: "You can change your PIN at any ATM that offers PIN services, using your current PIN. You can view your current PIN in Cards > Show PIN.",
  }),

  unblock_pin: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.pinBlocked);
    if (!card) return { text: "None of your cards have a blocked PIN." };
    card.pinBlocked = false;
    return {
      text: `We've unblocked the PIN on your card ending ${card.last4}. You can check it in Cards > Show PIN.`,
      data: { cardId: card.id },
    };
  },

  reset_passcode: ({ customer }) => {
    customer.passcodeResetRequested = true;
    return { text: "We've emailed you a link to reset your app passcode. It expires in 30 minutes." };
  },

  report_lost_card: ({ bank, customer }) => {
    const live = bank.cards(customer).filter((k) => k.kind === "physical" && k.status === "active");
    if (!live.length) return { text: "You have no active physical card to block." };
    for (const k of live) k.status = "blocked";
    const replacement = bank.issueCard(customer, "physical", "ordered");
    return {
      text: `We've blocked your card ending ${list(live.map((k) => k.last4))} and ordered a free replacement ending ${replacement.last4}.`,
      data: { blocked: live.map((k) => k.id), replacement: replacement.id },
    };
  },

  report_lost_phone: ({ customer }) => {
    const n = customer.activeDevices;
    customer.activeDevices = 0;
    return {
      text: `We've signed you out on all ${n} device${n === 1 ? "" : "s"}. Your cards still work; sign in on your new phone to continue.`,
      data: { signedOut: n },
    };
  },

  compromised_card: ({ bank, customer }) => {
    const live = bank.cards(customer).filter((k) => k.status === "active");
    for (const k of live) k.status = "frozen";
    const recent = bank
      .cardPayments(customer)
      .filter((p) => p.status === "settled" || p.status === "pending");
    return {
      text: `We've frozen ${live.length} card${live.length === 1 ? "" : "s"}. Recent payments: ${list(recent.map((p) => `${p.merchant} ${money(p.amount, p.currency)} on ${day(p.at)}`))}. Dispute any you don't recognise and we'll send a new card.`,
      data: { frozen: live.map((k) => k.id), recent },
    };
  },
};
