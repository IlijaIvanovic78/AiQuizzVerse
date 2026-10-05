import { MatchQuestionEvent, RoundResultEvent } from '../../core/models/realtime-events.model';
import { toRoundView } from './round-view';

const question: MatchQuestionEvent = {
  matchId: 'match-1',
  index: 2,
  total: 5,
  text: 'Which planet is the biggest?',
  options: ['Mars', 'Jupiter', 'Venus', 'Earth'],
  timeLimitSeconds: 45,
  remainingMs: 0,
};

const round: RoundResultEvent = {
  matchId: 'match-1',
  index: 2,
  correctIndex: 1,
  explanation: 'Jupiter is the largest planet.',
  players: [
    { userId: 'hero', optionIndex: null, correct: false, points: 0, score: 200 },
    { userId: 'friend', optionIndex: 1, correct: true, points: 140, score: 340 },
  ],
  teamCorrect: 3,
};

const names = { hero: 'demo_hero', friend: 'demo_friend' };

describe('toRoundView', () => {
  it('treats a missing answer as running out of time', () => {
    const view = toRoundView(round, question, 'hero', names);

    expect(view.outcome).toBe('missed');
    expect(view.myPick).toBeNull();
    expect(view.correctAnswer).toBe('Jupiter');
  });

  it('lists what the other player picked', () => {
    const view = toRoundView(round, question, 'hero', names);

    expect(view.others).toEqual([{ name: 'demo_friend', correct: true, points: 140 }]);
    expect(view.otherPicks).toEqual([{ name: 'demo_friend', optionIndex: 1 }]);
  });

  it('works without the question after a page refresh', () => {
    const view = toRoundView(round, null, 'friend', names);

    expect(view.outcome).toBe('correct');
    expect(view.points).toBe(140);
    expect(view.correctAnswer).toBeNull();
  });
});
