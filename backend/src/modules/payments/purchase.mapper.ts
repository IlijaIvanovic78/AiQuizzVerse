import { Purchase } from '@prisma/client';
import { findCoinPackage } from './coin-packages';
import { PurchaseView } from './payments.types';

export function toPurchaseView(purchase: Purchase): PurchaseView {
  return {
    id: purchase.id,
    packageId: purchase.packageId,
    packageName: findCoinPackage(purchase.packageId)?.name ?? purchase.packageId,
    coins: purchase.coins,
    amountCents: purchase.amountCents,
    currency: purchase.currency,
    status: purchase.status,
    provider: purchase.provider,
    createdAt: purchase.createdAt,
    paidAt: purchase.paidAt,
  };
}
