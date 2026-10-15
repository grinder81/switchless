import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIONS } from "../src/catalog/actions.js";
import { SERVICES } from "../src/catalog/services.js";
import { DATA_DIR, loadSplit } from "../src/data/banking77.js";

describe("catalog", () => {
  it("has 77 actions with unique ids and intents", () => {
    expect(ACTIONS).toHaveLength(77);
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(77);
    expect(new Set(ACTIONS.map((a) => a.intent)).size).toBe(77);
  });

  it("gives every service at least 2 actions", () => {
    for (const id of Object.keys(SERVICES)) {
      expect(ACTIONS.filter((a) => a.service === id).length, id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe.skipIf(!existsSync(`${DATA_DIR}test.csv`))("banking77", () => {
  it("loads both splits and every label maps to exactly one action", () => {
    const train = loadSplit("train");
    const test = loadSplit("test");
    expect(train).toHaveLength(10003);
    expect(test).toHaveLength(3080);
    const labels = new Set(test.map((e) => e.intent));
    expect(labels).toEqual(new Set(ACTIONS.map((a) => a.intent)));
  });
});
