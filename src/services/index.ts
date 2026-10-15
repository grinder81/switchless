import type { ServiceId } from "../catalog/services.js";
import { account } from "./account.js";
import { atm } from "./atm.js";
import { cardPayments } from "./card-payments.js";
import { cards } from "./cards.js";
import { disputes } from "./disputes.js";
import { fx } from "./fx.js";
import { identity } from "./identity.js";
import { security } from "./security.js";
import { topup } from "./topup.js";
import { transfers } from "./transfers.js";
import type { Handler, ServiceHandlers } from "./types.js";
import { virtualCards } from "./virtual-cards.js";

const SERVICE_HANDLERS: Record<ServiceId, ServiceHandlers> = {
  cards,
  virtual_cards: virtualCards,
  card_payments: cardPayments,
  atm,
  transfers,
  topup,
  fx,
  security,
  identity,
  disputes,
  account,
};

/** Action registry: action id (`service.verb`) → handler. */
export const HANDLERS: ReadonlyMap<string, Handler> = new Map(
  Object.entries(SERVICE_HANDLERS).flatMap(([service, handlers]) =>
    Object.entries(handlers).map(([verb, h]) => [`${service}.${verb}`, h] as const),
  ),
);
