import { MatchPlayerView } from '../../core/models/match.model';
import { SabotageHit } from '../../store/match/match.reducer';
import { effectEndsAt, sabotageNotice, sabotageTargets, secondsLeft } from './party-round';

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
});

describe('sabotageTargets', () => {
  it('leaves out me, players who answered and players who are away', () => {
    const players = ['hero', 'fox', 'owl', 'cat'].map(player);

    expect(sabotageTargets(players, 'hero', ['fox'], ['owl'])).toEqual(['cat']);
  });
});
