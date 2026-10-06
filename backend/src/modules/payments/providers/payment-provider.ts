import { Purchase } from '@prisma/client';
import { CoinPackage, PaymentProviderName } from '../payments.types';

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface CheckoutLink {
  checkoutUrl: string;
  providerRef: string | null;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(purchase: Purchase, pack: CoinPackage): Promise<CheckoutLink>;
  isPaid(purchase: Purchase): Promise<boolean>;
  /** True when the checkout was cancelled, false when it was already paid. */
  cancelUnlessPaid(purchase: Purchase): Promise<boolean>;
}
