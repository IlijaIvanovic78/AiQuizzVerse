import { Item } from '@prisma/client';
import {
  chestOdds,
  chestsForMatch,
  RandomFn,
  rollChest,
  SkinPools,
  skinPools,
} from './chests.rules';
import { ChestsEarnedToday, MatchChestFacts } from './chests.types';

function makeItem(id: string, price: number, extra: Partial<Item> = {}): Item {
  return {
    id,
    name: id,
    type: 'PET',
    price,
    minLevel: 1,
    isStarter: false,
    isChestOnly: false,
    ...extra,
  };
}

/** A random function that returns the given numbers one after another. */
function randomSequence(...values: number[]): RandomFn {
  return () => {
    const next = values.shift();
    if (next === undefined) {
      throw new Error('The test ran out of random numbers.');
    }
    return next;
  };
}

const slime = makeItem('pet-slime-green', 40);
const goldenKing = makeItem('hero-golden-king', 0, { type: 'AVATAR', isChestOnly: true });
const POOLS: SkinPools = { BASIC: [slime], CHEST_ONLY: [goldenKing] };
const NOTHING_OWNED = new Set<string>();

describe('rolling a chest', () => {
  it('gives coins from the range of the chest most of the time', () => {
    expect(rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0, 0))).toMatchObject({
      kind: 'COINS',
      coins: 20,
    });
    expect(rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0.69, 0.999))).toMatchObject({
      kind: 'COINS',
      coins: 40,
    });
    expect(rollChest('GOLDEN', POOLS, NOTHING_OWNED, randomSequence(0.1, 0.5))).toMatchObject({
      kind: 'COINS',
      coins: 160,
    });
  });

  it('gives one power-up from a wooden chest', () => {
    const reward = rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0.7, 0.99));
    expect(reward).toMatchObject({ kind: 'BOOSTS', coins: 0, item: null });
    expect(reward.boosts).toEqual([{ type: 'SECOND_CHANCE', quantity: 1 }]);
  });

  it('adds a streak freeze to the three power-ups of a golden chest', () => {
    const reward = rollChest('GOLDEN', POOLS, NOTHING_OWNED, randomSequence(0.4, 0, 0, 0.3));
    expect(reward.boosts).toEqual([
      { type: 'HINT', quantity: 2 },
      { type: 'FIFTY_FIFTY', quantity: 1 },
      { type: 'STREAK_FREEZE', quantity: 1 },
    ]);
  });

  it('gives a basic skin from the shop', () => {
    const reward = rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0.98, 0));
    expect(reward).toEqual({ kind: 'ITEM', coins: 0, boosts: [], item: slime, duplicate: false });
  });

  it('gives a chest-only skin only from silver and golden chests', () => {
    const silver = rollChest('SILVER', POOLS, NOTHING_OWNED, randomSequence(0.98, 0));
    expect(silver.item).toBe(goldenKing);
    const wooden = rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0.999, 0));
    expect(wooden.item).toBe(slime);
  });

  it('turns a skin the player owns into its shop price in coins', () => {
    const reward = rollChest('WOODEN', POOLS, new Set([slime.id]), randomSequence(0.98, 0));
    expect(reward).toMatchObject({ kind: 'ITEM', coins: 40, item: slime, duplicate: true });
  });

  it('turns a chest-only skin the player owns into 150 coins', () => {
    const reward = rollChest('GOLDEN', POOLS, new Set([goldenKing.id]), randomSequence(0.95, 0));
    expect(reward).toMatchObject({ coins: 150, item: goldenKing, duplicate: true });
  });

  it('leaves out a skin drop when there is no item to give', () => {
    const noChestOnly: SkinPools = { BASIC: [slime], CHEST_ONLY: [] };
    const reward = rollChest('SILVER', noChestOnly, NOTHING_OWNED, randomSequence(0.999, 0));
    expect(reward.item).toBe(slime);
  });
});

describe('skin pools', () => {
  it('keep starters, chest-only items and expensive items out of the basic pool', () => {
    const starter = makeItem('mini-mage', 0, { isStarter: true });
    const dragon = makeItem('pet-dragon-red', 300);

    const pools = skinPools([starter, slime, dragon, goldenKing]);

    expect(pools.BASIC).toEqual([slime]);
    expect(pools.CHEST_ONLY).toEqual([goldenKing]);
  });
});

describe('chest odds', () => {
  it('lists every drop of a chest as a percentage', () => {
    const odds = chestOdds();

    expect(odds.WOODEN).toEqual([
      { label: '20-40 coins', percent: 70 },
      { label: '1 power-up', percent: 27 },
      { label: 'A hero or pet from the shop', percent: 3 },
    ]);
    expect(odds.GOLDEN[1]).toEqual({ label: '3 power-ups + 1 streak freeze', percent: 35 });
  });

  it('adds up to 100 percent for every chest', () => {
    for (const drops of Object.values(chestOdds())) {
      expect(drops.reduce((sum, drop) => sum + drop.percent, 0)).toBe(100);
    }
  });
});

describe('chests from a match', () => {
  const soloRun: MatchChestFacts = {
    matchId: 'match-1',
    mode: 'SOLO',
    finished: true,
    accuracy: 60,
    isWinner: false,
    levelsGained: 0,
    newStreak: null,
  };
  const nothingYet: ChestsEarnedToday = { daily: 0, victories: 0 };

  it('gives a wooden chest for the first good match of the day', () => {
    expect(chestsForMatch(soloRun, nothingYet)).toEqual([
      { type: 'WOODEN', source: 'DAILY_MATCH' },
    ]);
  });

  it('gives no daily chest below 60% or after the first one', () => {
    expect(chestsForMatch({ ...soloRun, accuracy: 59 }, nothingYet)).toEqual([]);
    expect(chestsForMatch(soloRun, { daily: 1, victories: 0 })).toEqual([]);
  });

  it('gives a wooden chest for a duel or party win, two a day at most', () => {
    const duelWin = { ...soloRun, mode: 'DUEL' as const, isWinner: true, accuracy: 0 };
    expect(chestsForMatch(duelWin, nothingYet)).toEqual([{ type: 'WOODEN', source: 'VICTORY' }]);
    expect(chestsForMatch({ ...duelWin, mode: 'PARTY' }, { daily: 0, victories: 1 })).toEqual([
      { type: 'WOODEN', source: 'VICTORY' },
    ]);
    expect(chestsForMatch(duelWin, { daily: 0, victories: 2 })).toEqual([]);
  });

  it('gives no victory chest for a team win', () => {
    const teamWin = { ...soloRun, mode: 'TEAM' as const, isWinner: true, accuracy: 0 };
    expect(chestsForMatch(teamWin, nothingYet)).toEqual([]);
  });

  it('gives a silver chest for every level gained', () => {
    const chests = chestsForMatch({ ...soloRun, accuracy: 0, levelsGained: 2 }, nothingYet);
    expect(chests).toEqual([
      { type: 'SILVER', source: 'LEVEL_UP' },
      { type: 'SILVER', source: 'LEVEL_UP' },
    ]);
  });

  it('gives a golden chest when the streak reaches a multiple of 7', () => {
    const run = { ...soloRun, accuracy: 0 };
    expect(chestsForMatch({ ...run, newStreak: 7 }, nothingYet)).toEqual([
      { type: 'GOLDEN', source: 'STREAK' },
    ]);
    expect(chestsForMatch({ ...run, newStreak: 14 }, nothingYet)).toHaveLength(1);
    expect(chestsForMatch({ ...run, newStreak: 8 }, nothingYet)).toEqual([]);
  });

  it('keeps level and streak chests for an abandoned match, but not the daily one', () => {
    const abandoned = { ...soloRun, finished: false, levelsGained: 1, newStreak: 7 };
    expect(chestsForMatch(abandoned, nothingYet).map((chest) => chest.source)).toEqual([
      'LEVEL_UP',
      'STREAK',
    ]);
  });
});
