import { CoinPackage } from './payments.types';

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pouch', name: 'Coin Pouch', coins: 150, bonusCoins: 0, priceCents: 99, currency: 'eur' },
  { id: 'chest', name: 'Coin Chest', coins: 300, bonusCoins: 30, priceCents: 199, currency: 'eur' },
  { id: 'vault', name: 'Coin Vault', coins: 600, bonusCoins: 90, priceCents: 399, currency: 'eur' },
];

export const COIN_PACKAGE_IDS = COIN_PACKAGES.map((pack) => pack.id);

export function findCoinPackage(packageId: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((pack) => pack.id === packageId);
}

export function totalCoins(pack: CoinPackage): number {
  return pack.coins + pack.bonusCoins;
}
