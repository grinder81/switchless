import type { Example } from "../data/banking77.js";
import { OracleRouter } from "./oracle.js";
import { RandomRouter } from "./random.js";
import type { Router } from "./types.js";

/** Dispatchers available to the benchmark, by name. */
export const ROUTERS = ["oracle", "random", "rules", "llm", "jev", "hybrid"] as const;
export type RouterName = (typeof ROUTERS)[number];

const PLANNED: Partial<Record<RouterName, string>> = {
  jev: "Phase 3",
  llm: "Phase 4",
  rules: "Phase 5",
  hybrid: "Phase 6",
};

export function createRouter(name: string, labelled: Example[]): Router {
  switch (name) {
    case "oracle":
      return new OracleRouter(labelled);
    case "random":
      return new RandomRouter();
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
