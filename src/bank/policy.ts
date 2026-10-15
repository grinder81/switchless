/** Bank-wide policy: fees, limits, timings and support lists. Fictional values. */

/** Fixed clock so every handler answer is reproducible. */
export const NOW = new Date("2026-10-15T12:00:00Z");

export const POLICY = {
  homeCurrency: "GBP",
  cardDeliveryDays: { GB: 3, EU: 7, other: 14 } as Record<string, number>,
  physicalCardFee: 5,
  spareCardFee: 5,
  expressDeliveryFee: 15,
  disposableCard: { perCardLimit: 1, dailyCreateLimit: 5, monthlyCreateLimit: 20 },
  fx: {
    weekdayMarkupPct: 0.5,
    weekendMarkupPct: 1,
    freeMonthlyAllowance: 1000,
    overAllowanceFeePct: 0.5,
    rates: { "GBP/EUR": 1.152, "GBP/USD": 1.268, "GBP/PLN": 4.98, "GBP/JPY": 191.4 } as Record<
      string,
      number
    >,
  },
  supportedCurrencies: ["GBP", "EUR", "USD", "PLN", "CHF", "SEK", "NOK", "DKK", "JPY", "AUD", "CAD"],
  topUpCardsAccepted: ["Visa", "Mastercard", "Maestro"],
  atm: { freeMonthly: 200, overFeePct: 2 },
  topUp: {
    cardFeePct: 0.5,
    cardFeeFreeUpTo: 500,
    bankTransferFee: 0,
    cashOrCheque: "Not supported: Kestrel has no branches. Use a card or bank transfer.",
    limits: { single: 10_000, monthly: 30_000 },
  },
  transfers: {
    domesticFee: 0,
    internationalFee: 3,
    timing: { domestic: "within 2 hours", sepa: "1 working day", swift: "1 to 5 working days" },
  },
  minAge: 18,
  supportedCountries: ["GB", "IE", "DE", "FR", "ES", "IT", "NL", "PL", "PT", "SE"],
} as const;
