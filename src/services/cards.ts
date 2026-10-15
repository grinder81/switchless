import { isoDate } from "../bank/bank.js";
import { NOW, POLICY } from "../bank/policy.js";
import type { Card } from "../bank/types.js";
import { day, list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

const label = (k: Card) => `${k.kind} ${k.network} card ending ${k.last4}`;
const deliveryDays = (country: string) =>
  POLICY.cardDeliveryDays[country] ??
  (["IE", "DE", "FR", "ES", "IT", "NL", "PL", "PT", "SE"].includes(country)
    ? POLICY.cardDeliveryDays.EU
    : POLICY.cardDeliveryDays.other) ??
  14;

export const cards: ServiceHandlers = {
  activate: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.status === "inactive");
    if (card) {
      card.status = "active";
      return { text: `Done: your ${label(card)} is now active.`, data: { cardId: card.id } };
    }
    if (bank.cards(customer).some((k) => k.status === "ordered")) {
      return { text: "Your new card hasn't been delivered yet. You can activate it as soon as it arrives." };
    }
    return { text: "You don't have a card waiting to be activated." };
  },

  track_delivery: ({ bank, customer }) => {
    const order = bank.cardOrders(customer).at(-1);
    if (!order) return { text: "You don't have a card order in progress." };
    if (order.status === "delivered") {
      return {
        text: `Your card was delivered on ${day(order.eta)}. Activate it in the app to start using it.`,
        data: order,
      };
    }
    const where = order.carrier ? ` via ${order.carrier} (tracking ${order.tracking})` : "";
    return {
      text: `Your card was ordered on ${day(order.orderedAt)} and is ${order.status}${where}. Expected delivery: ${day(order.eta)}.`,
      data: order,
    };
  },

  delivery_estimate: ({ customer }) => {
    const days = deliveryDays(customer.country);
    return {
      text: `Cards to ${customer.country} usually arrive within ${days} working days. Express delivery (${money(POLICY.expressDeliveryFee, POLICY.homeCurrency)}) takes 1 to 2 days.`,
      data: { days },
    };
  },

  renew_expiring: ({ bank, customer }) => {
    const soon = new Date(NOW);
    soon.setUTCMonth(soon.getUTCMonth() + 2);
    const limit = isoDate(soon).slice(0, 7);
    const expiring = bank.cards(customer).filter((k) => k.kind === "physical" && k.expiry <= limit);
    if (!expiring.length) {
      const dates = bank.cards(customer).map((k) => `ending ${k.last4}: ${k.expiry}`);
      return { text: `None of your cards expire in the next two months (${list(dates)}).` };
    }
    for (const k of expiring) bank.issueCard(customer, "physical", "ordered");
    return {
      text: `Your ${list(expiring.map(label))} expires ${expiring[0]?.expiry}. We've ordered a free replacement; it will arrive before then.`,
      data: { expiring: expiring.map((k) => k.id) },
    };
  },

  physical_card_info: ({ bank, customer }) => {
    const has = bank.cards(customer).some((k) => k.kind === "physical");
    return {
      text: has
        ? "You already have a physical card. You can order a spare from Cards > Order card."
        : `You can order a physical card in the app under Cards > Order card. It costs ${money(POLICY.physicalCardFee, POLICY.homeCurrency)} and arrives in ${deliveryDays(customer.country)} working days.`,
    };
  },

  order_physical: ({ bank, customer }) => {
    const card = bank.issueCard(customer, "physical", "ordered");
    return {
      text: `Ordered: a physical ${card.network} card ending ${card.last4}. Fee ${money(POLICY.physicalCardFee, POLICY.homeCurrency)}, delivery in ${deliveryDays(customer.country)} working days (or ${money(POLICY.expressDeliveryFee, POLICY.homeCurrency)} for express).`,
      data: { cardId: card.id },
    };
  },

  order_spare: ({ bank, customer }) => {
    const card = bank.issueCard(customer, "physical", "ordered");
    return {
      text: `Ordered a spare card ending ${card.last4} on the same account. Fee ${money(POLICY.spareCardFee, POLICY.homeCurrency)}.`,
      data: { cardId: card.id },
    };
  },

  troubleshoot: ({ bank, customer }) => {
    const physical = bank.cards(customer).filter((k) => k.kind === "physical");
    const declines = bank.cardPayments(customer).filter((p) => p.status === "declined");
    if (!physical.length) return { text: "You don't have a physical card yet." };
    const states = physical.map((k) => `${label(k)} is ${k.status}${k.pinBlocked ? " (PIN blocked)" : ""}`);
    const why = declines.length
      ? ` Your last decline was at ${declines.at(-1)?.merchant} because ${declines.at(-1)?.reason}.`
      : "";
    return { text: `${list(states)}.${why}`, data: { cards: physical, declines } };
  },

  atm_retained: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.kind === "physical" && k.status === "active");
    if (!card) return { text: "You don't have an active physical card that could have been retained." };
    card.status = "blocked";
    const replacement = bank.issueCard(customer, "physical", "ordered");
    return {
      text: `We've blocked your card ending ${card.last4} so nobody can use it, and ordered a free replacement ending ${replacement.last4}.`,
      data: { blocked: card.id, replacement: replacement.id },
    };
  },

  contactless_troubleshoot: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => k.kind === "physical" && k.status === "active");
    if (!card) return { text: "You don't have an active physical card." };
    return {
      text: card.contactless
        ? `Contactless is on for your card ending ${card.last4}. If a tap fails, the terminal may need one chip-and-PIN payment first.`
        : `Contactless is switched off for your card ending ${card.last4}. Make one chip-and-PIN payment and it will turn on automatically.`,
      data: { contactless: card.contactless },
    };
  },

  link_card: ({ bank, customer }) => {
    const card = bank.cards(customer).find((k) => !k.linkedToApp);
    if (!card) return { text: "All your cards are already linked to the app." };
    card.linkedToApp = true;
    return { text: `Your ${label(card)} is now linked to the app.`, data: { cardId: card.id } };
  },

  card_network: ({ bank, customer }) => ({
    text: `Your cards: ${list(bank.cards(customer).map(label))}. New Kestrel cards are issued on Visa.`,
  }),
};
