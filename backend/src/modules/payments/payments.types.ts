import { PurchaseStatus } from '@prisma/client';

export type PaymentProviderName = 'stripe' | 'demo';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceCents: number;
  currency: 'eur';
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
  provider: string;
  createdAt: Date;
  paidAt: Date | null;
}

export interface PurchaseConfirmation {
  purchase: PurchaseView;
  coins: number;
}
