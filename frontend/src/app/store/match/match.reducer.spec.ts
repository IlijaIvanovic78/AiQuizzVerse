import { DuelInvite, MatchQuestionEvent } from '../../core/models/realtime-events.model';
import { ShopActions } from '../shop/shop.actions';
import { MatchSocketActions } from './match-socket.actions';
import { MatchActions } from './match.actions';
import { MatchState, initialMatchState, matchFeature } from './match.reducer';
import { FREE_HINTS_PER_MATCH } from './match.constants';

const reducer = matchFeature.reducer;
const MATCH_ID = 'match-1';
const DEADLINE_AT = 1_000_000;

const firstQuestion: MatchQuestionEvent = {
  matchId: MATCH_ID,
  index: 0,
  total: 5,
  text: 'Which planet is the biggest?',
  options: ['Mars', 'Jupiter', 'Venus', 'Earth'],
  timeLimitSeconds: 45,
  remainingMs: 45_000,
};

function questionOpen(): MatchState {
  const entered = reducer(initialMatchState, MatchActions.entered({ matchId: MATCH_ID }));
  return reducer(
    entered,
    MatchSocketActions.questionReceived({ question: firstQuestion, deadlineAt: DEADLINE_AT }),
  );
}

describe('match reducer', () => {
  it('opens a question with a clean round', () => {
    const state = questionOpen();

    expect(state.phase).toBe('question');
    expect(state.question?.index).toBe(0);
    expect(state.myAnswer).toBeNull();
    expect(state.deadlineAt).toBe(DEADLINE_AT);
  });

  it('keeps only the first answer for a question', () => {
    const answered = reducer(questionOpen(), MatchActions.answer({ optionIndex: 1 }));
    const state = reducer(answered, MatchActions.answer({ optionIndex: 3 }));

    expect(state.myAnswer).toBe(1);
  });

  it('moves to the reveal phase and stores the new scores', () => {
    const state = reducer(
      questionOpen(),
      MatchSocketActions.roundFinished({
        round: {
          matchId: MATCH_ID,
          index: 0,
          correctIndex: 1,
          explanation: 'Jupiter is the largest planet.',
          players: [{ userId: 'hero', optionIndex: 1, correct: true, points: 140, score: 140 }],
          teamCorrect: 1,
        },
      }),
    );

    expect(state.phase).toBe('reveal');
    expect(state.scores['hero']).toBe(140);
    expect(state.teamCorrect).toBe(1);
    expect(state.deadlineAt).toBeNull();
  });

  it('counts the free hints as hint uses until the server sends its own count', () => {
    const state = reducer(
      questionOpen(),
      ShopActions.boostsLoaded({
        boosts: [
          { type: 'HINT', name: 'Hint', description: '', price: 10, owned: 3 },
          { type: 'FIFTY_FIFTY', name: '50/50', description: '', price: 15, owned: 1 },
        ],
      }),
    );

    expect(state.boostUses).toEqual({
      HINT: 3 + FREE_HINTS_PER_MATCH,
      FIFTY_FIFTY: 1,
      EXTRA_TIME: 0,
    });
  });

  it('spends a free hint before owned hints', () => {
    const state = reducer(
      questionOpen(),
      MatchSocketActions.boostUsed({
        boost: { matchId: MATCH_ID, type: 'HINT', hint: 'It is a gas giant.', remaining: 4 },
        deadlineAt: null,
      }),
    );

    expect(state.freeHintsLeft).toBe(FREE_HINTS_PER_MATCH - 1);
    expect(state.boostUses.HINT).toBe(4);
    expect(state.hint).toBe('It is a gas giant.');
    expect(state.boostsUsedThisRound).toEqual(['HINT']);
  });

  it('keeps a pending duel invite when the player leaves the match page', () => {
    const invite: DuelInvite = {
      matchId: 'match-2',
      inviteCode: 'ABC234',
      mode: 'DUEL',
      quizTitle: 'Animals of the World',
      from: { id: 'friend', username: 'demo_friend', avatarKey: null, petKey: null, level: 4 },
    };
    const withInvite = reducer(questionOpen(), MatchActions.inviteReceived({ invite }));

    const state = reducer(withInvite, MatchActions.left());

    expect(state.phase).toBe('idle');
    expect(state.invite).toEqual(invite);
  });
});
