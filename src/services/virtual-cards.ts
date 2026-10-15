import { POLICY } from "../bank/policy.js";
import type { ServiceHandlers } from "./types.js";

export const virtualCards: ServiceHandlers = {
  create: ({ bank, customer }) => {
    const card = bank.issueCard(customer, "virtual", "active");
    return {
      text: `Your new virtual card ending ${card.last4} is ready to use in Cards.`,
      data: { cardId: card.id },
    };
  },

  create_disposable: ({ bank, customer }) => {
    const card = bank.issueCard(customer, "disposable", "active");
    return {
      text: `Your disposable card ending ${card.last4} is ready. It works for one payment, then its details change automatically.`,
      data: { cardId: card.id },
    };
  },

  disposable_limits: () => {
    const l = POLICY.disposableCard;
    return {
      text: `Each disposable card can be used for ${l.perCardLimit} payment. You can create up to ${l.dailyCreateLimit} a day and ${l.monthlyCreateLimit} a month.`,
      data: l,
    };
  },

  troubleshoot: ({ bank, customer }) => {
    const virtual = bank.cards(customer).filter((k) => k.kind !== "physical");
    if (!virtual.length) return { text: "You don't have any virtual cards yet." };
    const ids = new Set(virtual.map((k) => k.id));
    const decline = bank
      .cardPayments(customer)
      .filter((p) => ids.has(p.cardId) && p.status === "declined")
      .at(-1);
    const states = virtual.map((k) => `${k.kind} card ending ${k.last4} is ${k.status}`).join("; ");
    const why = decline
      ? ` The last payment at ${decline.merchant} was declined because ${decline.reason}.`
      : "";
    const hint = virtual.some((k) => k.status === "frozen") ? " Unfreeze it in Cards to use it again." : "";
    return { text: `${states}.${why}${hint}`, data: { cards: virtual, decline } };
  },
};
