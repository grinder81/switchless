import { describe, expect, it } from "vitest";
import { createBank } from "../src/bank/bank.js";
import { ACTIONS } from "../src/catalog/actions.js";
import { HANDLERS } from "../src/services/index.js";

const run = (actionId: string, customerId: string) => {
  const bank = createBank();
  const customer = bank.customer(customerId);
  const handler = HANDLERS.get(actionId);
  if (!customer || !handler) throw new Error(`missing ${actionId} or ${customerId}`);
  return { bank, customer, result: handler({ bank, customer, message: "" }) };
};

describe("action registry", () => {
  it("has exactly one handler per catalogue action", () => {
    expect(new Set(HANDLERS.keys())).toEqual(new Set(ACTIONS.map((a) => a.id)));
  });

  it("every handler answers every demo customer", () => {
    for (const a of ACTIONS) {
      for (const id of ["maya", "tom", "priya", "sam"]) {
        const { result } = run(a.id, id);
        expect(result.text.length, `${a.id} for ${id}`).toBeGreaterThan(10);
        expect(result.text, `${a.id} for ${id}`).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it("each run starts from a fresh bank", () => {
    run("cards.activate", "priya");
    expect(createBank().data.cards.find((k) => k.id === "card-priya-p")?.status).toBe("inactive");
  });
});

describe("persona stories", () => {
  it("Maya: tracks her card in transit", () => {
    const { result } = run("cards.track_delivery", "maya");
    expect(result.text).toContain("Royal Mail");
    expect(result.text).toContain("16 Oct");
  });

  it("Tom: sees the weekend markup on his Valencia payment", () => {
    const { result } = run("card_payments.fx_rate_query", "tom");
    expect(result.text).toContain("1.1287");
    expect(result.text).toContain("1.152");
  });

  it("Tom: cancels his pending transfer", () => {
    const { bank, result } = run("transfers.cancel", "tom");
    expect(result.text).toContain("Anna Becker");
    expect(bank.data.transfers.find((t) => t.id === "tr-1")?.status).toBe("cancelled");
  });

  it("Tom: opens an ATM claim for missing cash", () => {
    const { bank, result } = run("atm.wrong_amount", "tom");
    expect(result.text).toContain("€50.00");
    expect(bank.data.claims).toHaveLength(1);
  });

  it("Priya: learns why verification failed", () => {
    const { result } = run("identity.verification_problem", "priya");
    expect(result.text).toContain("blurry");
  });

  it("Priya: activates her delivered card", () => {
    const { bank } = run("cards.activate", "priya");
    expect(bank.data.cards.find((k) => k.id === "card-priya-p")?.status).toBe("active");
  });

  it("Sam: an unrecognised payment freezes his card first", () => {
    const { bank, result } = run("card_payments.unrecognised", "sam");
    expect(result.text).toMatch(/^We've frozen/);
    expect(bank.data.cards.find((k) => k.id === "card-sam-p")?.status).toBe("frozen");
  });

  it("Sam: the Tesco double charge is found and claimed", () => {
    const { bank, result } = run("disputes.duplicate_charge", "sam");
    expect(result.text).toContain("Tesco Dublin");
    expect(bank.data.claims[0]?.kind).toBe("duplicate_charge");
  });
});
