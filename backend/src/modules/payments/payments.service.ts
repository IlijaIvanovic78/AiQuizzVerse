import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, Purchase } from '@prisma/client';
import { errorStack } from '../../common/utils/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../realtime/notifications.service';
import { COIN_PACKAGES, findCoinPackage, totalCoins } from './coin-packages';
import {
  MONTHLY_LIMIT_MESSAGE,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  PURCHASE_HISTORY_LIMIT,
} from './payments.constants';
import { exceedsMonthlyLimit, spendingWindowStart } from './payments.rules';
import { CheckoutSession, CoinPackage, PurchaseConfirmation, PurchaseView } from './payments.types';
import { CheckoutLink, PAYMENT_PROVIDER, type PaymentProvider } from './providers/payment-provider';
import { toPurchaseView } from './purchase.mapper';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  listPackages(): CoinPackage[] {
    return COIN_PACKAGES;
  }

  async listHistory(userId: string): Promise<PurchaseView[]> {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PURCHASE_HISTORY_LIMIT,
    });
    return purchases.map(toPurchaseView);
  }

  async getPurchase(userId: string, purchaseId: string): Promise<PurchaseView> {
    return toPurchaseView(await this.findOwnPurchase(userId, purchaseId));
  }

  async checkout(userId: string, packageId: string): Promise<CheckoutSession> {
    const pack = findCoinPackage(packageId);
    if (!pack) {
      throw new NotFoundException('We could not find that coin pack.');
    }
    await this.closeOpenCheckouts(userId);
    const purchase = await this.createPurchaseWithinLimit(userId, pack);
    const link = await this.openCheckout(purchase, pack);
    if (link.providerRef) {
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { providerRef: link.providerRef },
      });
    }
    return { purchaseId: purchase.id, checkoutUrl: link.checkoutUrl, provider: this.provider.name };
  }

  async confirm(userId: string, purchaseId: string): Promise<PurchaseConfirmation> {
    const purchase = await this.findOwnPurchase(userId, purchaseId);
    if (purchase.status === 'PENDING') {
      const paid = await this.askProvider(() => this.provider.isPaid(purchase));
      if (paid) {
        await this.payOut(purchase);
      }
    }

    const [saved, user] = await Promise.all([
      this.findOwnPurchase(userId, purchaseId),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true } }),
    ]);
    return { purchase: toPurchaseView(saved), coins: user.coins };
  }

  async cancel(userId: string, purchaseId: string): Promise<PurchaseView> {
    const purchase = await this.findOwnPurchase(userId, purchaseId);
    if (purchase.status === 'PENDING') {
      await this.cancelOrPayOut(purchase);
    }
    return this.getPurchase(userId, purchaseId);
  }

  /**
   * Only one checkout stays open: older ones are cancelled (or paid out if they were paid),
   * so an abandoned checkout does not keep counting against the monthly limit.
   */
  private async closeOpenCheckouts(userId: string): Promise<void> {
    const openPurchases = await this.prisma.purchase.findMany({
      where: { userId, status: 'PENDING' },
    });
    for (const purchase of openPurchases) {
      await this.cancelOrPayOut(purchase);
    }
  }

  private async cancelOrPayOut(purchase: Purchase): Promise<void> {
    const cancelled = await this.askProvider(() => this.provider.cancel(purchase));
    if (!cancelled) {
      await this.payOut(purchase);
      return;
    }
    await this.prisma.purchase.updateMany({
      where: { id: purchase.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
  }

  /** Only a PENDING purchase can turn PAID, so confirming twice never pays the coins twice. */
  private async payOut(purchase: Purchase): Promise<void> {
    const coins = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.purchase.updateMany({
        where: { id: purchase.id, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (count === 0) {
        return null;
      }
      const user = await tx.user.update({
        where: { id: purchase.userId },
        data: { coins: { increment: purchase.coins } },
        select: { coins: true },
      });
      return user.coins;
    });

    if (coins !== null) {
      this.notifications.emitToUser(purchase.userId, 'coins:updated', { coins });
    }
  }

  // Locks the user row, so two quick checkouts (a double click, two tabs) cannot both
  // pass the limit check before either purchase is saved.
  private createPurchaseWithinLimit(userId: string, pack: CoinPackage): Promise<Purchase> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      await this.assertWithinMonthlyLimit(tx, userId, pack.priceCents);
      return tx.purchase.create({
        data: {
          userId,
          packageId: pack.id,
          coins: totalCoins(pack),
          amountCents: pack.priceCents,
          currency: pack.currency,
          provider: this.provider.name,
        },
      });
    });
  }

  /** Open checkouts count too, because each of them can still be paid. */
  private async assertWithinMonthlyLimit(
    tx: Prisma.TransactionClient,
    userId: string,
    priceCents: number,
  ): Promise<void> {
    const windowStart = spendingWindowStart(new Date());
    const { _sum } = await tx.purchase.aggregate({
      _sum: { amountCents: true },
      where: {
        userId,
        OR: [
          { status: 'PAID', paidAt: { gte: windowStart } },
          { status: 'PENDING', createdAt: { gte: windowStart } },
        ],
      },
    });
    if (exceedsMonthlyLimit(_sum.amountCents ?? 0, priceCents)) {
      throw new BadRequestException(MONTHLY_LIMIT_MESSAGE);
    }
  }

  private async openCheckout(purchase: Purchase, pack: CoinPackage): Promise<CheckoutLink> {
    try {
      return await this.askProvider(() => this.provider.createCheckout(purchase, pack));
    } catch (error) {
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'CANCELLED' },
      });
      throw error;
    }
  }

  private async askProvider<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      this.logger.error(`The ${this.provider.name} payment request failed`, errorStack(error));
      throw new ServiceUnavailableException(PAYMENTS_UNAVAILABLE_MESSAGE);
    }
  }

  private async findOwnPurchase(userId: string, purchaseId: string): Promise<Purchase> {
    const purchase = await this.prisma.purchase.findFirst({ where: { id: purchaseId, userId } });
    if (!purchase) {
      throw new NotFoundException('We could not find that purchase.');
    }
    return purchase;
  }
}
