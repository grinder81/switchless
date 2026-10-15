import { money } from "./format.js";
import type { ServiceHandlers } from "./types.js";

export const account: ServiceHandlers = {
  edit_details: () => ({
    text: "You can change your email, phone number and address in Account > Personal details. To change your name, upload a document showing the new name.",
  }),

  close: ({ bank, customer }) => {
    const balances = Object.entries(bank.account(customer).balances).filter(([, v]) => v > 0);
    if (balances.length) {
      return {
        text: `Before closing, move your remaining money out: ${balances.map(([c, v]) => money(v, c)).join(", ")}. Then go to Account > Close account.`,
        data: { balances },
      };
    }
    return { text: "Your balance is zero, so you can close your account from Account > Close account." };
  },
};
