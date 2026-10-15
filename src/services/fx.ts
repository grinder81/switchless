import { POLICY } from "../bank/policy.js";
import { list, money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

const F = POLICY.fx;

export const fx: ServiceHandlers = {
  explain_fee: () => ({
    text: `Exchanging is free up to ${money(F.freeMonthlyAllowance, POLICY.homeCurrency)} a month, then ${F.overAllowanceFeePct}%. We add ${F.weekdayMarkupPct}% on weekdays and ${F.weekendMarkupPct}% at weekends, when markets are closed.`,
  }),

  rates: () => ({
    text: `Current rates: ${list(Object.entries(F.rates).map(([pair, r]) => `${pair} ${r}`))}.`,
    data: F.rates,
  }),

  exchange_in_app: () => ({
    text: "Go to Home > Exchange, pick the two currencies and the amount. The money moves between your balances instantly.",
  }),

  supported_currencies: () => ({
    text: `You can hold and exchange ${list([...POLICY.supportedCurrencies])}.`,
    data: POLICY.supportedCurrencies,
  }),

  supported_cards_currencies: () => ({
    text: `You can top up with ${list([...POLICY.topUpCardsAccepted])} cards, and hold ${list([...POLICY.supportedCurrencies])}.`,
  }),
};
