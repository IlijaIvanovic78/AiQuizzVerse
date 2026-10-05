import { MatchMode } from '../../core/models/match.model';
import { ArenaFighter, arenaSides } from './arena-fighter';

function fighter(id: string): ArenaFighter {
  return {
    id,
    name: id,
    heroKey: null,
    petKey: null,
    isMe: id === 'hero',
    score: 0,
    action: 'idle',
    points: null,
    answered: false,
    away: false,
    charges: 0,
    lockedOut: false,
    frozen: false,
    inked: false,
  };
}

function sideIds(mode: MatchMode, ids: string[]) {
  const sides = arenaSides(mode, ids.map(fighter));
  return { left: sides.left.map((item) => item.id), right: sides.right.map((item) => item.id) };
}

describe('arenaSides', () => {
  it('puts a duel rival on the right and a team together on the left', () => {
    expect(sideIds('DUEL', ['hero', 'fox'])).toEqual({ left: ['hero'], right: ['fox'] });
    expect(sideIds('TEAM', ['hero', 'fox'])).toEqual({ left: ['hero', 'fox'], right: [] });
  });

  it('splits a party into two halves, with the bigger half on the player side', () => {
    expect(sideIds('PARTY', ['hero', 'fox', 'owl'])).toEqual({
      left: ['hero', 'fox'],
      right: ['owl'],
    });
    expect(sideIds('PARTY', ['hero', 'fox', 'owl', 'cat'])).toEqual({
      left: ['hero', 'fox'],
      right: ['owl', 'cat'],
    });
  });
});
