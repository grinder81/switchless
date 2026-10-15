import { describe, expect, it } from "vitest";
import { ACTION_BY_ID } from "../src/catalog/actions.js";
import { STAGES } from "../src/routers/rules/stages.js";
import { normalize, RulesRouter } from "../src/routers/rules.js";

describe("rules dispatcher", () => {
  const router = new RulesRouter();
  const route = async (t: string) => (await router.route(t)).action;

  it("only dispatches to real actions", () => {
    for (const r of STAGES.flat()) expect(ACTION_BY_ID.has(r.action), r.action).toBe(true);
  });

  it("routes plain requests", async () => {
    expect(await route("My new card still hasn't arrived")).toBe("cards.track_delivery");
    expect(await route("I want to delete my account")).toBe("account.close");
    expect(await route("My phone was stolen")).toBe("security.report_lost_phone");
    expect(await route("How do I verify my top-up card?")).toBe("topup.verify_card");
  });

  it("prefers the more specific rule for near-twins", async () => {
    expect(await route("The ATM only gave me half the cash I asked for")).toBe("atm.wrong_amount");
    expect(await route("Is there a direct debit payment I didn't make?")).toBe(
      "disputes.unrecognised_direct_debit",
    );
    expect(await route("How many disposable cards can I have per day?")).toBe(
      "virtual_cards.disposable_limits",
    );
  });

  it("abstains when nothing matches", async () => {
    expect(await route("Can you book me a table for dinner?")).toBeNull();
  });

  it("can run with only the first stages", async () => {
    const text = "How do I verify my top-up card?";
    expect((await new RulesRouter(1).route(text)).action).toBe("topup.by_card");
    expect(await route(text)).toBe("topup.verify_card");
  });

  it("normalizes text", () => {
    expect(normalize("Top-Up  isn’t   WORKING!")).toBe(" top up isn't working ");
  });
});
