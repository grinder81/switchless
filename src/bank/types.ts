/** Kestrel Bank domain model (fake, in-memory). Amounts are in major units, e.g. 42.99. */

export type KycStatus = "verified" | "pending" | "failed";

export interface Customer {
  id: string;
  name: string;
  country: string;
  dateOfBirth: string;
  kyc: { status: KycStatus; failureReason?: string; sourceOfFundsRequested?: boolean };
  /** Devices signed in to the app. */
  activeDevices: number;
  passcodeResetRequested?: boolean;
}

export interface Account {
  id: string;
  customerId: string;
  balances: Record<string, number>;
  bankDetails: { iban: string; sortCode: string; accountNumber: string };
  autoTopUp: { enabled: boolean; threshold: number; amount: number };
  rejectedBeneficiaries: { name: string; reason: string }[];
}

export type CardKind = "physical" | "virtual" | "disposable";
export type CardStatus = "ordered" | "inactive" | "active" | "frozen" | "blocked";

export interface Card {
  id: string;
  accountId: string;
  kind: CardKind;
  network: "Visa" | "Mastercard";
  last4: string;
  status: CardStatus;
  /** YYYY-MM */
  expiry: string;
  contactless: boolean;
  pinBlocked: boolean;
  linkedToApp: boolean;
}

export interface CardOrder {
  id: string;
  cardId: string;
  orderedAt: string;
  status: "processing" | "shipped" | "delivered";
  carrier?: string;
  tracking?: string;
  eta: string;
}

export type MoneyStatus = "pending" | "settled" | "declined" | "reverted";

export interface CardPayment {
  id: string;
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  /** Account currency charged, after any exchange. */
  charged: number;
  rateApplied?: number;
  marketRate?: number;
  fee: number;
  status: MoneyStatus;
  reason?: string;
  at: string;
}

export interface CashWithdrawal {
  id: string;
  cardId: string;
  atm: string;
  amount: number;
  currency: string;
  /** What the ATM actually dispensed, if different. */
  dispensed?: number;
  rateApplied?: number;
  marketRate?: number;
  fee: number;
  status: MoneyStatus;
  reason?: string;
  at: string;
}

export interface Transfer {
  id: string;
  accountId: string;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  currency: string;
  fee: number;
  status: "pending" | "completed" | "failed" | "declined" | "cancelled";
  reason?: string;
  reference: string;
  at: string;
}

export interface TopUp {
  id: string;
  accountId: string;
  method: "card" | "bank_transfer" | "cash" | "cheque";
  amount: number;
  currency: string;
  fee: number;
  status: "pending" | "completed" | "failed" | "reverted";
  reason?: string;
  at: string;
}

export interface DirectDebit {
  id: string;
  accountId: string;
  merchant: string;
  amount: number;
  currency: string;
  lastCollected: string;
}

export interface Refund {
  id: string;
  accountId: string;
  merchant: string;
  amount: number;
  currency: string;
  status: "requested" | "processing" | "completed";
  expectedBy: string;
}

export interface Claim {
  id: string;
  customerId: string;
  kind: "atm_discrepancy" | "duplicate_charge" | "refund_request";
  subjectId: string;
  openedAt: string;
}

export interface BankData {
  customers: Customer[];
  accounts: Account[];
  cards: Card[];
  cardOrders: CardOrder[];
  cardPayments: CardPayment[];
  cashWithdrawals: CashWithdrawal[];
  transfers: Transfer[];
  topUps: TopUp[];
  directDebits: DirectDebit[];
  refunds: Refund[];
  claims: Claim[];
}
