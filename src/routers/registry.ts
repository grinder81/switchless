import type { Example } from "../data/banking77.js";
import { JEVRouter } from "./jev.js";
import { OracleRouter } from "./oracle.js";
import { RandomRouter } from "./random.js";
import { RulesRouter } from "./rules.js";
import type { Router } from "./types.js";

/** Dispatchers available to the benchmark, by name. */
export const ROUTERS = ["oracle", "random", "rules", "llm", "jev", "hybrid"] as const;
export type RouterName = (typeof ROUTERS)[number];

const PLANNED: Partial<Record<RouterName, string>> = {
  llm: "Phase 4",
  hybrid: "Phase 6",
};

export function createRouter(name: string, labelled: Example[]): Router {
  switch (name) {
    case "oracle":
      return new OracleRouter(labelled);
    case "random":
      return new RandomRouter();
    case "rules":
      return new RulesRouter();
    case "jev":
      return new JEVRouter();
    default: {
      const phase = PLANNED[name as RouterName];
      throw new Error(
        phase
          ? `the ${name} dispatcher is built in ${phase}`
          : `unknown dispatcher "${name}" (${ROUTERS.join(", ")})`,
      );
    }
  }
}
