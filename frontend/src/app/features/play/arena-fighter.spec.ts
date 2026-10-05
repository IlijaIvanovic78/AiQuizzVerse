import { MatchMode } from '../../core/models/match.model';
import { ArenaFighter, arenaSides, restingFighter } from './arena-fighter';

function fighter(id: string): ArenaFighter {
  const user = { id, username: id, avatarKey: null, petKey: null, level: 1 };
  return restingFighter(user, 0, 'hero', 'idle');
}

function sideIds(mode: MatchMode, ids: string[]) {
  const sides = arenaSides(mode, ids.map(fighter));
  return { left: sides.left.map((item) => item.id), right: sides.right.map((item) => item.id) };
}

describe('arenaSides', () => {
  it('keeps a solo player and a team together on the left', () => {
    expect(sideIds('SOLO', ['hero'])).toEqual({ left: ['hero'], right: [] });
    expect(sideIds('TEAM', ['hero', 'fox'])).toEqual({ left: ['hero', 'fox'], right: [] });
  });

  it('splits a party into two halves, with the bigger half on the player side', () => {
    expect(sideIds('PARTY', ['hero', 'fox'])).toEqual({ left: ['hero'], right: ['fox'] });
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
