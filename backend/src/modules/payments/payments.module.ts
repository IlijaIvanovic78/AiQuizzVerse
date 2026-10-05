import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../realtime/realtime.module';
import { STRIPE_TEST_KEY_PREFIX } from './payments.constants';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DemoPaymentProvider } from './providers/demo-payment.provider';
import { PAYMENT_PROVIDER, PaymentProvider } from './providers/payment-provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';

/** This project never charges real money: Stripe is used only with a test key. */
function createPaymentProvider(config: ConfigService): PaymentProvider {
  const secretKey = config.get<string>('STRIPE_SECRET_KEY') ?? '';
  if (secretKey.startsWith(STRIPE_TEST_KEY_PREFIX)) {
    return new StripePaymentProvider(secretKey, config.getOrThrow<string>('FRONTEND_URL'));
  }
  if (secretKey !== '') {
    new Logger('PaymentsModule').warn(
      'STRIPE_SECRET_KEY is not a Stripe test key, so coin packs use the demo checkout.',
    );
  }
  return new DemoPaymentProvider();
}

@Module({
  imports: [RealtimeModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_PROVIDER, inject: [ConfigService], useFactory: createPaymentProvider },
  ],
})
export class PaymentsModule {}
