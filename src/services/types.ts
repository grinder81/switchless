import type { Bank } from "../bank/bank.js";
import type { Customer } from "../bank/types.js";

export interface HandlerContext {
  bank: Bank;
  customer: Customer;
  message: string;
}

export interface HandlerResult {
  /** Customer-facing answer. */
  text: string;
  /** Structured facts the answer was built from. */
  data?: unknown;
}

export type Handler = (ctx: HandlerContext) => HandlerResult;

/** A service's handlers, keyed by the verb part of the action id (`cards.track_delivery` → `track_delivery`). */
export type ServiceHandlers = Record<string, Handler>;
