import { masteryByTheme, matchStats } from './profile.rules';
import { PlayedMatch } from './profile.types';

const space: PlayedMatch = { theme: 'SPACE', questionCount: 6, correctCount: 6, isWinner: false };
const nature: PlayedMatch = { theme: 'NATURE', questionCount: 6, correctCount: 3, isWinner: true };
const moon: PlayedMatch = { theme: 'SPACE', questionCount: 4, correctCount: 1, isWinner: false };

describe('profile stats', () => {
  it('starts empty for a new player', () => {
    expect(matchStats([])).toEqual({
      matchesPlayed: 0,
      wins: 0,
      questionsAnswered: 0,
      accuracy: 0,
    });
    expect(masteryByTheme([])).toEqual([]);
  });

  it('adds up matches, wins, questions and accuracy', () => {
    expect(matchStats([space, nature, moon])).toEqual({
      matchesPlayed: 3,
      wins: 1,
      questionsAnswered: 16,
      accuracy: 62,
    });
  });

  it('shows mastery per theme with the most played theme first', () => {
    expect(masteryByTheme([nature, space, moon])).toEqual([
      { theme: 'SPACE', accuracy: 70, answered: 10 },
      { theme: 'NATURE', accuracy: 50, answered: 6 },
    ]);
  });

  it('never goes above 100% when questions were deleted after the match', () => {
    const shrunk: PlayedMatch = { ...space, questionCount: 3 };

    expect(matchStats([shrunk]).accuracy).toBe(100);
    expect(masteryByTheme([shrunk])).toEqual([{ theme: 'SPACE', accuracy: 100, answered: 6 }]);
  });
});
