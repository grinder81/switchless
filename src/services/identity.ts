import { POLICY } from "../bank/policy.js";
import { list } from "./format.js";
import type { ServiceHandlers } from "./types.js";

export const identity: ServiceHandlers = {
  start_verification: ({ customer }) => {
    if (customer.kyc.status === "verified") return { text: "Your identity is already verified." };
    customer.kyc.status = "pending";
    return {
      text: "Let's verify you: take a photo of your passport or driving licence, then a short selfie video. It usually takes a few minutes.",
    };
  },

  verification_problem: ({ customer }) => {
    const k = customer.kyc;
    if (k.status === "verified")
      return { text: "Your identity is verified; there's nothing blocking your account." };
    if (k.status === "failed") {
      return {
        text: `Your verification didn't go through because ${k.failureReason}. Please try again in good light, with the whole document in frame.`,
        data: k,
      };
    }
    return { text: "Your verification is still being reviewed. This usually takes under an hour.", data: k };
  },

  why_verify: () => ({
    text: "As a regulated bank we must confirm who you are before you can use your account. It protects you against fraud and is required by anti-money-laundering law.",
  }),

  source_of_funds: ({ customer }) => ({
    text: customer.kyc.sourceOfFundsRequested
      ? "We've asked you to confirm where your money comes from because of a large incoming payment. Upload a payslip, bank statement or sale contract in Account > Documents."
      : "We sometimes ask where your money comes from, usually after a large deposit. It's a legal requirement; we'll tell you what to upload if we need it.",
  }),

  age_requirement: () => ({ text: `You need to be at least ${POLICY.minAge} to open a Kestrel account.` }),

  country_eligibility: ({ customer }) => {
    const ok = (POLICY.supportedCountries as readonly string[]).includes(customer.country);
    return {
      text: `Kestrel is available to residents of ${list([...POLICY.supportedCountries])}. ${ok ? `Your country (${customer.country}) is supported.` : ""}`.trim(),
    };
  },
};
