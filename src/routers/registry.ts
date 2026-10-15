import type { Example } from "../data/banking77.js";
import { HybridRouter } from "./hybrid.js";
import { JEVRouter } from "./jev.js";
import { LLMRouter } from "./llm.js";
import { OracleRouter } from "./oracle.js";
import { RandomRouter } from "./random.js";
import { RulesRouter } from "./rules.js";
import type { Router } from "./types.js";

/** Dispatchers available to the benchmark, by name. */
export const ROUTERS = ["oracle", "random", "rules", "llm", "jev", "hybrid"] as const;
export type RouterName = (typeof ROUTERS)[number];

export function createRouter(name: string, labelled: Example[]): Router {
  switch (name) {
    case "oracle":
      return new OracleRouter(labelled);
    case "random":
      return new RandomRouter();
    case "rules":
      return new RulesRouter();
    case "llm":
      return new LLMRouter();
    case "jev":
      return new JEVRouter();
    case "hybrid":
      return new HybridRouter(new RulesRouter(), new JEVRouter());
    default:
      throw new Error(`unknown dispatcher "${name}" (${ROUTERS.join(", ")})`);
  }
}
