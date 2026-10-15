import { describe, expect, it } from "vitest";
import { createBank } from "../src/bank/bank.js";
import { ACTION_BY_ID, ACTIONS } from "../src/catalog/actions.js";
import { STATE_CHANGING } from "../src/catalog/effects.js";
import { HANDLERS } from "../src/services/index.js";

/** Seed customers whose bank state changed when the action ran (each on a fresh bank). */
const changedFor = (actionId: string) =>
  createBank()
    .data.customers.map((c) => c.id)
    .filter((id) => {
      const bank = createBank();
      const before = JSON.stringify(bank.data);
      const customer = bank.customer(id);
      const handler = HANDLERS.get(actionId);
      if (!customer || !handler) throw new Error(`missing ${actionId} or ${id}`);
      handler({ bank, customer, message: "" });
      return JSON.stringify(bank.data) !== before;
    });

describe("handler effects classification", () => {
  it("lists only catalogue actions", () => {
    for (const id of STATE_CHANGING.keys()) expect(ACTION_BY_ID.has(id), id).toBe(true);
  });

  it("every handler that changed state for a seed customer is listed as state-changing", () => {
    for (const a of ACTIONS) {
      if (changedFor(a.id).length) expect(STATE_CHANGING.has(a.id), a.id).toBe(true);
    }
  });

  it("every listed handler changes state for at least one seed customer", () => {
    for (const id of STATE_CHANGING.keys()) expect(changedFor(id).length, id).toBeGreaterThan(0);
  });
});
