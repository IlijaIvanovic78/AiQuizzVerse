import { MatchResult, MatchView } from '../../core/models/match.model';
import {
  MatchQuestionEvent,
  RoundResultEvent,
  SabotagedEvent,
} from '../../core/models/realtime-events.model';
import { PublicUser } from '../../core/models/user.model';
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

const soloMatch: MatchView = {
  id: MATCH_ID,
  mode: 'SOLO',
  status: 'IN_PROGRESS',
  inviteCode: null,
  hostId: 'hero',
  quiz: {
    id: 'quiz-1',
    title: 'The Solar System',
    theme: 'SPACE',
    language: 'EN',
    questionCount: 5,
    timePerQuestion: 45,
    kind: 'STANDARD',
  },
  players: [],
};

const soloResult: MatchResult = {
  matchId: MATCH_ID,
  mode: 'SOLO',
  quizId: 'quiz-1',
  quizTitle: 'The Solar System',
  theme: 'SPACE',
  kind: 'STANDARD',
  questionCount: 5,
  players: [],
  questions: [],
  path: null,
  leveledUp: false,
  coinCapReached: false,
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
          winnerUserId: null,
          players: [
            { userId: 'hero', optionIndex: 1, correct: true, points: 140, score: 140, charges: 0 },
          ],
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

  it('keeps the error that stopped the match from loading as the interrupted reason', () => {
    const entered = reducer(initialMatchState, MatchActions.entered({ matchId: MATCH_ID }));

    const state = reducer(entered, MatchActions.failed({ error: 'Match not found.' }));

    expect(state.phase).toBe('interrupted');
    expect(state.error).toBe('Match not found.');
  });

  it('does not show an old toast error as the reason for a later interruption', () => {
    const frozen = reducer(
      questionOpen(),
      MatchSocketActions.errorReceived({ error: 'You are frozen!' }),
    );

    const state = reducer(
      frozen,
      MatchSocketActions.lobbyUpdated({ match: { ...soloMatch, status: 'ABANDONED' } }),
    );

    expect(state.phase).toBe('interrupted');
    expect(state.error).toBeNull();
  });

  it('ignores a result that belongs to another match', () => {
    const state = reducer(
      questionOpen(),
      MatchActions.resultLoaded({ result: { ...soloResult, matchId: 'match-old' } }),
    );

    expect(state.phase).toBe('question');
    expect(state.result).toBeNull();
  });

  it('shows the result of the open match', () => {
    const state = reducer(questionOpen(), MatchSocketActions.finished({ result: soloResult }));

    expect(state.phase).toBe('finished');
    expect(state.result).toBe(soloResult);
  });
});

describe('match reducer in a party', () => {
  const LANDED_AT = 5_000;

  function partyPlayer(id: string, isConnected = true) {
    const user: PublicUser = { id, username: id, avatarKey: null, petKey: null, level: 1 };
    return { user, score: 0, correctCount: 0, isConnected, charges: 1 };
  }

  const party: MatchView = {
    ...soloMatch,
    mode: 'PARTY',
    inviteCode: 'ABC234',
    players: [partyPlayer('hero'), partyPlayer('fox'), partyPlayer('owl', false)],
  };

  function sabotage(changes: Partial<SabotagedEvent>): SabotagedEvent {
    return {
      matchId: MATCH_ID,
      index: 0,
      type: 'INK',
      fromUserId: 'fox',
      targetUserId: 'hero',
      durationMs: 4000,
      fromCharges: 0,
      ...changes,
    };
  }

  function partyRound(changes: Partial<RoundResultEvent>): RoundResultEvent {
    return {
      matchId: MATCH_ID,
      index: 0,
      correctIndex: 1,
      explanation: 'Jupiter is the largest planet.',
      winnerUserId: 'fox',
      players: [
        { userId: 'hero', optionIndex: 2, correct: false, points: 0, score: 0, charges: 1 },
        { userId: 'fox', optionIndex: 1, correct: true, points: 140, score: 140, charges: 2 },
      ],
      teamCorrect: 1,
      ...changes,
    };
  }

  function partyQuestionOpen(): MatchState {
    return reducer(questionOpen(), MatchSocketActions.lobbyUpdated({ match: party }));
  }

  it('takes the charges and the away players from the live lobby', () => {
    const state = partyQuestionOpen();

    expect(state.charges).toEqual({ hero: 1, fox: 1, owl: 1 });
    expect(state.leftUserIds).toEqual(['owl']);
  });

  it('locks out a player for the open question only', () => {
    const lockedOut = reducer(
      partyQuestionOpen(),
      MatchSocketActions.playerLockedOut({ index: 0, userId: 'fox' }),
    );
    const late = reducer(
      lockedOut,
      MatchSocketActions.playerLockedOut({ index: 3, userId: 'owl' }),
    );

    expect(late.lockedOutUserIds).toEqual(['fox']);
  });

  it('remembers a sabotage with the time it landed and the attacker charges', () => {
    const state = reducer(
      partyQuestionOpen(),
      MatchSocketActions.playerSabotaged({ sabotage: sabotage({}), landedAt: LANDED_AT }),
    );

    expect(state.sabotages).toEqual([{ ...sabotage({}), landedAt: LANDED_AT }]);
    expect(state.charges['fox']).toBe(0);
  });

  it('ignores a sabotage of a question that is already over, but keeps the charges', () => {
    const state = reducer(
      partyQuestionOpen(),
      MatchSocketActions.playerSabotaged({
        sabotage: sabotage({ index: 4, fromCharges: 1 }),
        landedAt: LANDED_AT,
      }),
    );

    expect(state.sabotages).toEqual([]);
    expect(state.charges['fox']).toBe(1);
  });

  it('shows my options in the scrambled order and keeps my pick', () => {
    const answered = reducer(partyQuestionOpen(), MatchActions.answer({ optionIndex: 2 }));
    const scrambled = ['Earth', 'Venus', 'Jupiter', 'Mars'];

    const state = reducer(
      answered,
      MatchSocketActions.optionsScrambled({ index: 0, options: scrambled }),
    );

    expect(state.question?.options).toEqual(scrambled);
    expect(state.question?.text).toBe(firstQuestion.text);
    expect(state.myAnswer).toBe(2);
  });

  it('opens the answers again when the server refused my answer for this question', () => {
    const answered = reducer(partyQuestionOpen(), MatchActions.answer({ optionIndex: 2 }));

    const refused = reducer(answered, MatchActions.answerRefused({ index: 0 }));
    const stale = reducer(answered, MatchActions.answerRefused({ index: 3 }));

    expect(refused.myAnswer).toBeNull();
    expect(stale.myAnswer).toBe(2);
  });

  it('keeps the round winner and the new charges from the round result', () => {
    const state = reducer(
      partyQuestionOpen(),
      MatchSocketActions.roundFinished({ round: partyRound({}) }),
    );

    expect(matchFeature.selectRoundWinnerId.projector(state.round)).toBe('fox');
    expect(state.charges).toEqual({ hero: 1, fox: 2, owl: 1 });
    expect(state.scores['fox']).toBe(140);
  });

  it('starts the next question without lockouts or sabotages', () => {
    const lockedOut = reducer(
      partyQuestionOpen(),
      MatchSocketActions.playerLockedOut({ index: 0, userId: 'hero' }),
    );
    const sabotaged = reducer(
      lockedOut,
      MatchSocketActions.playerSabotaged({ sabotage: sabotage({}), landedAt: LANDED_AT }),
    );

    const state = reducer(
      sabotaged,
      MatchSocketActions.questionReceived({
        question: { ...firstQuestion, index: 1 },
        deadlineAt: DEADLINE_AT,
      }),
    );

    expect(state.lockedOutUserIds).toEqual([]);
    expect(state.sabotages).toEqual([]);
    expect(state.charges['fox']).toBe(0);
  });
});
