import { Purchase } from '@prisma/client';
import Stripe from 'stripe';
import { CoinPackage } from '../payments.types';
import { CheckoutLink, PaymentProvider } from './payment-provider';

export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly frontendUrl: string,
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(purchase: Purchase, pack: CoinPackage): Promise<CheckoutLink> {
    const resultUrl = `${this.frontendUrl}/shop/payment/${purchase.id}`;
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: purchase.id,
      metadata: { purchaseId: purchase.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pack.currency,
            unit_amount: pack.priceCents,
            product_data: { name: pack.name },
          },
        },
      ],
      success_url: `${resultUrl}?status=success`,
      cancel_url: `${resultUrl}?status=cancelled`,
    });
    if (!session.url) {
      throw new Error(`Stripe returned no checkout URL for session ${session.id}`);
    }
    return { checkoutUrl: session.url, providerRef: session.id };
  }

  async isPaid(purchase: Purchase): Promise<boolean> {
    if (!purchase.providerRef) {
      return false;
    }
    const session = await this.stripe.checkout.sessions.retrieve(purchase.providerRef);
    return session.payment_status === 'paid';
  }

  async cancelUnlessPaid(purchase: Purchase): Promise<boolean> {
    if (!purchase.providerRef) {
      return true;
    }
    try {
      await this.stripe.checkout.sessions.expire(purchase.providerRef);
      return true;
    } catch (error) {
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
        throw error;
      }
      // Stripe refuses to expire a closed session: it either expired already or was paid.
      return !(await this.isPaid(purchase));
    }
  }
}
