import { Purchase } from '@prisma/client';
import { CheckoutLink, PaymentProvider } from './payment-provider';

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = 'demo';

  createCheckout(purchase: Purchase): Promise<CheckoutLink> {
    return Promise.resolve({ checkoutUrl: `/shop/checkout/${purchase.id}`, providerRef: null });
  }

  /**
   * The demo checkout has no outside payment step: pressing Pay on it is the payment.
   * So this is only asked from confirm, never to check an abandoned checkout.
   */
  isPaid(): Promise<boolean> {
    return Promise.resolve(true);
  }

  cancelUnlessPaid(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
