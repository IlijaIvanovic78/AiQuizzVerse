export type PurchaseStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type PaymentProviderName = 'stripe' | 'demo';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceCents: number;
  currency: 'eur';
}

export interface CheckoutRequest {
  packageId: string;
}

export interface CheckoutSession {
  purchaseId: string;
  checkoutUrl: string;
  provider: PaymentProviderName;
}

export interface PurchaseView {
  id: string;
  packageId: string;
  packageName: string;
  coins: number;
  amountCents: number;
  currency: string;
  status: PurchaseStatus;
  provider: PaymentProviderName;
  createdAt: string;
  paidAt: string | null;
}

export interface PurchaseConfirmation {
  purchase: PurchaseView;
  coins: number;
}
