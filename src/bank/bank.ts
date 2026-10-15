import { NOW } from "./policy.js";
import { SEED } from "./seed.js";
import type { Account, BankData, Card, Claim, Customer } from "./types.js";

/** In-memory bank. Every `createBank()` starts from a fresh copy of the seed. */
export class Bank {
  private nextId = 1;
  constructor(readonly data: BankData) {}

  customer(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  account(c: Customer): Account {
    const acc = this.data.accounts.find((a) => a.customerId === c.id);
    if (!acc) throw new Error(`no account for ${c.id}`);
    return acc;
  }

  cards(c: Customer): Card[] {
    const acc = this.account(c);
    return this.data.cards.filter((k) => k.accountId === acc.id);
  }

  private cardIds(c: Customer): Set<string> {
    return new Set(this.cards(c).map((k) => k.id));
  }

  cardOrders(c: Customer) {
    const ids = this.cardIds(c);
    return this.data.cardOrders.filter((o) => ids.has(o.cardId));
  }

  cardPayments(c: Customer) {
    const ids = this.cardIds(c);
    return this.data.cardPayments.filter((p) => ids.has(p.cardId));
  }

  cashWithdrawals(c: Customer) {
    const ids = this.cardIds(c);
    return this.data.cashWithdrawals.filter((w) => ids.has(w.cardId));
  }

  transfers(c: Customer) {
    const acc = this.account(c);
    return this.data.transfers.filter((t) => t.accountId === acc.id);
  }

  topUps(c: Customer) {
    const acc = this.account(c);
    return this.data.topUps.filter((t) => t.accountId === acc.id);
  }

  directDebits(c: Customer) {
    const acc = this.account(c);
    return this.data.directDebits.filter((d) => d.accountId === acc.id);
  }

  refunds(c: Customer) {
    const acc = this.account(c);
    return this.data.refunds.filter((r) => r.accountId === acc.id);
  }

  newId(prefix: string): string {
    return `${prefix}-new-${this.nextId++}`;
  }

  issueCard(c: Customer, kind: Card["kind"], status: Card["status"]): Card {
    const card: Card = {
      id: this.newId("card"),
      accountId: this.account(c).id,
      kind,
      network: "Visa",
      last4: String(1000 + this.nextId * 37).slice(-4),
      status,
      expiry: `${NOW.getUTCFullYear() + 4}-${String(NOW.getUTCMonth() + 1).padStart(2, "0")}`,
      contactless: kind === "physical",
      pinBlocked: false,
      linkedToApp: kind !== "physical",
    };
    this.data.cards.push(card);
    return card;
  }

  openClaim(c: Customer, kind: Claim["kind"], subjectId: string): Claim {
    const claim: Claim = {
      id: this.newId("claim"),
      customerId: c.id,
      kind,
      subjectId,
      openedAt: isoDate(NOW),
    };
    this.data.claims.push(claim);
    return claim;
  }
}

export function createBank(seed: BankData = SEED): Bank {
  return new Bank(structuredClone(seed));
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
