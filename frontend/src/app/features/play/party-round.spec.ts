import { MatchPlayerView, SabotageType } from '../../core/models/match.model';
import { SabotageBlock, SabotageHit } from '../../store/match/match.reducer';
import {
  blockNotice,
  effectEndsAt,
  lastingHits,
  missesSabotages,
  ownedAttacks,
  sabotageNotice,
  sabotageTargets,
  secondsLeft,
} from './party-round';

function hit(changes: Partial<SabotageHit>): SabotageHit {
  return {
    matchId: 'match-1',
    index: 0,
    type: 'FREEZE',
    fromUserId: 'fox',
    targetUserId: 'hero',
    durationMs: 3000,
    fromCharges: 0,
    landedAt: 10_000,
    ...changes,
  };
}

function player(id: string): MatchPlayerView {
  return {
    user: { id, username: id, avatarKey: null, petKey: null, level: 1 },
    score: 0,
    correctCount: 0,
    isConnected: true,
    charges: 1,
  };
}

const names = { hero: 'demo_hero', fox: 'quick_fox', owl: 'wise_owl' };

describe('effectEndsAt', () => {
  it('ends the latest of two freezes on the same player', () => {
    const hits = [hit({}), hit({ fromUserId: 'owl', landedAt: 11_000 })];

    expect(effectEndsAt(hits, 'hero', 'FREEZE')).toBe(14_000);
  });

  it('is 0 when the effect never hit the player', () => {
    expect(effectEndsAt([hit({ type: 'INK' })], 'hero', 'FREEZE')).toBe(0);
    expect(effectEndsAt([hit({})], 'owl', 'FREEZE')).toBe(0);
  });
});

describe('lastingHits', () => {
  it('keeps the newest effect that still lasts on each player', () => {
    const hits = [
      hit({ type: 'INK', durationMs: 4000 }),
      hit({ type: 'FREEZE', fromUserId: 'owl', durationMs: 3000, landedAt: 10_500 }),
      hit({ type: 'MIRROR', targetUserId: 'owl', durationMs: 5000 }),
    ];

    expect(lastingHits(hits, 12_000)).toEqual({ hero: 'FREEZE', owl: 'MIRROR' });
    expect(lastingHits(hits, 13_800)).toEqual({ hero: 'INK', owl: 'MIRROR' });
    expect(lastingHits(hits, 15_000)).toEqual({});
  });

  it('leaves out a scramble and a shield, which have no duration', () => {
    const hits = [
      hit({ type: 'SCRAMBLE', durationMs: 0 }),
      hit({ type: 'SHIELD', fromUserId: 'owl', targetUserId: 'owl', durationMs: 0 }),
    ];

    expect(lastingHits(hits, 10_000)).toEqual({});
  });
});

describe('secondsLeft', () => {
  it('rounds up, so the last second still shows 1', () => {
    expect(secondsLeft(13_000, 12_100)).toBe(1);
    expect(secondsLeft(13_000, 13_000)).toBe(0);
    expect(secondsLeft(0, 13_000)).toBe(0);
  });
});

describe('sabotageNotice', () => {
  it('names both players when someone else was hit', () => {
    expect(sabotageNotice(hit({ type: 'INK', targetUserId: 'owl' }), 'hero', names)).toBe(
      'quick_fox inked wise_owl!',
    );
  });

  it('talks to the player who was hit', () => {
    expect(sabotageNotice(hit({}), 'hero', names)).toBe('quick_fox froze you!');
    expect(sabotageNotice(hit({ type: 'SCRAMBLE' }), 'hero', names)).toBe(
      'quick_fox scrambled your answers!',
    );
  });

  it('says You for the player who threw it', () => {
    expect(sabotageNotice(hit({ targetUserId: 'owl' }), 'fox', names)).toBe('You froze wise_owl!');
  });

  it('tells the player what the new sabotages hit', () => {
    expect(sabotageNotice(hit({ type: 'FOG' }), 'hero', names)).toBe(
      'quick_fox fogged your question!',
    );
    expect(sabotageNotice(hit({ type: 'QUAKE' }), 'hero', names)).toBe(
      'quick_fox shook your answers!',
    );
  });

  it('announces a shield without a target', () => {
    const shield = hit({ type: 'SHIELD', fromUserId: 'owl', targetUserId: 'owl', durationMs: 0 });

    expect(sabotageNotice(shield, 'hero', names)).toBe('wise_owl raised a shield!');
    expect(sabotageNotice(shield, 'owl', names)).toBe('You raised a shield!');
  });
});

describe('blockNotice', () => {
  const block: SabotageBlock = {
    matchId: 'match-1',
    index: 0,
    type: 'INK',
    fromUserId: 'fox',
    targetUserId: 'owl',
    fromCharges: 0,
    landedAt: 10_000,
  };

  it('tells each player whose shield stopped whose sabotage', () => {
    expect(blockNotice(block, 'owl', names)).toBe("Your shield blocked quick_fox's ink!");
    expect(blockNotice(block, 'fox', names)).toBe("wise_owl's shield blocked your ink!");
    expect(blockNotice(block, 'hero', names)).toBe("wise_owl's shield blocked quick_fox's ink!");
  });
});

describe('sabotageTargets', () => {
  it('leaves out me, players who answered and players who are away', () => {
    const players = ['hero', 'fox', 'owl', 'cat'].map(player);

    expect(sabotageTargets(players, 'hero', ['fox'], ['owl'])).toEqual(['cat']);
  });
});

describe('ownedAttacks', () => {
  it('offers only free ink to a player who bought nothing yet', () => {
    expect(ownedAttacks(['INK'])).toEqual(['INK']);
  });

  it('keeps the usual order and leaves the shield out', () => {
    expect(ownedAttacks(['INK', 'SHIELD', 'FOG', 'FREEZE'])).toEqual(['INK', 'FREEZE', 'FOG']);
  });
});

describe('missesSabotages', () => {
  it('points to the shop while a sabotage is missing', () => {
    expect(missesSabotages(['INK'])).toBe(true);
    expect(missesSabotages(['INK', 'FREEZE', 'SCRAMBLE', 'FOG', 'QUAKE', 'MIRROR'])).toBe(true);
  });

  it('stays quiet once the player owns every sabotage', () => {
    const everything: SabotageType[] = [
      'SHIELD',
      'MIRROR',
      'QUAKE',
      'FOG',
      'SCRAMBLE',
      'FREEZE',
      'INK',
    ];

    expect(missesSabotages(everything)).toBe(false);
  });
});
