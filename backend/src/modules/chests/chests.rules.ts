import { BoostType, ChestType, Item } from '@prisma/client';
import {
  BASIC_SKIN_MAX_PRICE,
  CHEST_BOOSTS,
  CHEST_ONLY_DUPLICATE_COINS,
  DAILY_CHEST_MIN_ACCURACY,
  DROP_TABLES,
  MATCH_CHESTS,
  MAX_VICTORY_CHESTS_PER_DAY,
  STREAK_CHEST_EVERY_DAYS,
  VICTORY_MODES,
} from './chests.constants';
import {
  BoostAmount,
  ChestDrop,
  ChestOdds,
  ChestsEarnedToday,
  DropOdds,
  EarnedChest,
  MatchChestFacts,
  MatchChestSource,
  RolledReward,
  SkinPool,
} from './chests.types';

/** Returns a number from 0 (included) to 1 (excluded), like Math.random. */
export type RandomFn = () => number;

export type SkinPools = Record<SkinPool, Item[]>;

export function chestsForMatch(match: MatchChestFacts, today: ChestsEarnedToday): EarnedChest[] {
  const sources: MatchChestSource[] = [];
  if (earnsDailyChest(match, today)) {
    sources.push('DAILY_MATCH');
  }
  if (earnsVictoryChest(match, today)) {
    sources.push('VICTORY');
  }
  for (let level = 0; level < match.levelsGained; level++) {
    sources.push('LEVEL_UP');
  }
  if (match.newStreak !== null && match.newStreak % STREAK_CHEST_EVERY_DAYS === 0) {
    sources.push('STREAK');
  }
  return sources.map((source) => ({ type: MATCH_CHESTS[source], source }));
}

/** The first finished match of the day that goes well enough. */
function earnsDailyChest(match: MatchChestFacts, today: ChestsEarnedToday): boolean {
  return match.finished && today.daily === 0 && match.accuracy >= DAILY_CHEST_MIN_ACCURACY;
}

function earnsVictoryChest(match: MatchChestFacts, today: ChestsEarnedToday): boolean {
  return (
    match.finished &&
    match.isWinner &&
    VICTORY_MODES.includes(match.mode) &&
    today.victories < MAX_VICTORY_CHESTS_PER_DAY
  );
}

/** Basic skins come from the cheaper end of the shop; starters are never in a chest. */
export function skinPools(items: Item[]): SkinPools {
  const shopSkins = items.filter((item) => !item.isStarter && !item.isChestOnly);
  return {
    BASIC: shopSkins.filter((item) => item.price <= BASIC_SKIN_MAX_PRICE),
    CHEST_ONLY: items.filter((item) => item.isChestOnly),
  };
}

export function rollChest(
  type: ChestType,
  pools: SkinPools,
  ownedItemIds: Set<string>,
  random: RandomFn,
): RolledReward {
  // A skin drop whose pool has no items is left out, so the other drops share its chance.
  const drops = DROP_TABLES[type].filter(
    (drop) => drop.kind !== 'SKIN' || pools[drop.pool].length > 0,
  );
  const drop = pickDrop(drops, random);
  if (drop.kind === 'COINS') {
    const coins = randomInt(drop.minCoins, drop.maxCoins, random);
    return { kind: 'COINS', coins, boosts: [], item: null, duplicate: false };
  }
  if (drop.kind === 'BOOSTS') {
    const boosts = rollBoosts(drop.boostCount, drop.streakFreezes, random);
    return { kind: 'BOOSTS', coins: 0, boosts, item: null, duplicate: false };
  }
  return skinReward(pickOne(pools[drop.pool], random), ownedItemIds);
}

/** A skin the player already owns is turned into coins. */
function duplicateCoins(item: Item): number {
  return item.isChestOnly ? CHEST_ONLY_DUPLICATE_COINS : item.price;
}

export function chestOdds(): ChestOdds {
  return {
    WOODEN: dropOdds(DROP_TABLES.WOODEN),
    SILVER: dropOdds(DROP_TABLES.SILVER),
    GOLDEN: dropOdds(DROP_TABLES.GOLDEN),
  };
}

function dropOdds(drops: ChestDrop[]): DropOdds[] {
  const total = totalWeight(drops);
  return drops.map((drop) => ({
    label: dropLabel(drop),
    percent: Math.round((drop.weight * 100) / total),
  }));
}

function dropLabel(drop: ChestDrop): string {
  if (drop.kind === 'COINS') {
    return `${drop.minCoins}-${drop.maxCoins} coins`;
  }
  if (drop.kind === 'BOOSTS') {
    const boosts = drop.boostCount === 1 ? '1 power-up' : `${drop.boostCount} power-ups`;
    return drop.streakFreezes > 0 ? `${boosts} + ${drop.streakFreezes} streak freeze` : boosts;
  }
  return drop.pool === 'BASIC' ? 'A hero or pet from the shop' : 'A chest-only hero or pet';
}

function pickDrop(drops: ChestDrop[], random: RandomFn): ChestDrop {
  let roll = random() * totalWeight(drops);
  for (const drop of drops) {
    if (roll < drop.weight) {
      return drop;
    }
    roll -= drop.weight;
  }
  // Only rounding can get here.
  return drops[drops.length - 1];
}

function rollBoosts(boostCount: number, streakFreezes: number, random: RandomFn): BoostAmount[] {
  const types: BoostType[] = [];
  for (let i = 0; i < boostCount; i++) {
    types.push(pickOne(CHEST_BOOSTS, random));
  }
  for (let i = 0; i < streakFreezes; i++) {
    types.push('STREAK_FREEZE');
  }
  return countByType(types);
}

function countByType(types: BoostType[]): BoostAmount[] {
  const amounts: BoostAmount[] = [];
  for (const type of types) {
    const amount = amounts.find((candidate) => candidate.type === type);
    if (amount) {
      amount.quantity += 1;
    } else {
      amounts.push({ type, quantity: 1 });
    }
  }
  return amounts;
}

function skinReward(item: Item, ownedItemIds: Set<string>): RolledReward {
  const duplicate = ownedItemIds.has(item.id);
  const coins = duplicate ? duplicateCoins(item) : 0;
  return { kind: 'ITEM', coins, boosts: [], item, duplicate };
}

function totalWeight(drops: ChestDrop[]): number {
  return drops.reduce((sum, drop) => sum + drop.weight, 0);
}

function randomInt(min: number, max: number, random: RandomFn): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pickOne<T>(items: T[], random: RandomFn): T {
  return items[Math.floor(random() * items.length)];
}
