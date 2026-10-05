import { MatchMode, Question } from '@prisma/client';
import { MatchSession, MatchSessionDeps } from './match-session';
import {
  COUNTDOWN_SECONDS,
  EXTRA_TIME_MS,
  FREEZE_DURATION_MS,
  INK_DURATION_MS,
  MS_PER_SECOND,
  RETURN_GRACE_MS,
  REVEAL_MAX_MS,
} from './matches.constants';
import {
  BoostUsedPayload,
  FinishedPlayer,
  LockedOutPayload,
  MatchBoostType,
  MatchSummary,
  OptionsPayload,
  PlayerEventPayload,
  QuestionPayload,
  RoundResultPayload,
  SabotagedPayload,
  WaitingNextPayload,
} from './matches.types';

const TIME_PER_QUESTION = 20;
const TIME_LIMIT_MS = TIME_PER_QUESTION * MS_PER_SECOND;
const COUNTDOWN_MS = COUNTDOWN_SECONDS * MS_PER_SECOND;
const CORRECT_OPTION = 'Jupiter';
const MATCH_ROOM = 'match:match-1';
const PARTY = ['ana', 'marko', 'iva'];

interface SentEvent {
  room: string;
  event: string;
  payload: unknown;
}

function makeQuestion(position: number): Question {
  return {
    id: `question-${position}`,
    quizId: 'quiz-1',
    position,
    text: `Question ${position}`,
    options: ['Mars', CORRECT_OPTION, 'Venus', 'Saturn'],
    correctIndex: 1,
    explanation: 'Jupiter is the biggest planet.',
    hint: 'Think big.',
    sourceQuestionId: null,
  };
}

function setUp(mode: MatchMode, playerIds: string[], questionCount = 2) {
  const sent: SentEvent[] = [];
  const server = {
    to: (room: string) => ({
      emit: (event: string, payload: unknown) => sent.push({ room, event, payload }),
    }),
  };
  const results = { save: jest.fn<Promise<FinishedPlayer[]>, [MatchSummary]>() };
  results.save.mockResolvedValue([]);
  const play = {
    spendBoost: jest.fn<Promise<boolean>, [string, MatchBoostType]>(),
    ownedBoosts: jest.fn<Promise<number>, [string, MatchBoostType]>(),
  };
  play.spendBoost.mockResolvedValue(true);
  play.ownedBoosts.mockResolvedValue(1);

  const deps = {
    server,
    results,
    play,
    notifications: { emitToUser: jest.fn() },
    onClosed: jest.fn(),
  } as unknown as MatchSessionDeps;
  const questions = Array.from({ length: questionCount }, (_, i) => makeQuestion(i + 1));
  const session = new MatchSession(
    deps,
    {
      id: 'match-1',
      mode,
      hostId: playerIds[0],
      quiz: {
        id: 'quiz-1',
        kind: 'STANDARD',
        difficulty: 'EASY',
        timePerQuestion: TIME_PER_QUESTION,
      },
      playerIds,
    },
    questions,
  );

  const payloads = <T>(event: string): T[] =>
    sent
      .filter((sentEvent) => sentEvent.event === event)
      .map((sentEvent) => sentEvent.payload as T);
  /** What one player gets: events for the whole match room plus events sent only to them. */
  const received = <T>(userId: string, event: string): T[] =>
    sent
      .filter((sentEvent) => sentEvent.room === MATCH_ROOM || sentEvent.room === `user:${userId}`)
      .filter((sentEvent) => sentEvent.event === event)
      .map((sentEvent) => sentEvent.payload as T);
  const lastQuestion = () => payloads<QuestionPayload>('match:question').at(-1);
  const correctOption = () => lastQuestion()?.options.indexOf(CORRECT_OPTION) ?? -1;
  const wrongOption = () => (correctOption() + 1) % 4;
  const savedSummary = () => results.save.mock.calls[0][0];
  const startFirstRound = (connectedUserIds = playerIds) => {
    session.start(connectedUserIds);
    jest.advanceTimersByTime(COUNTDOWN_MS);
  };

  return {
    session,
    payloads,
    received,
    correctOption,
    wrongOption,
    savedSummary,
    startFirstRound,
    results,
    play,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('a round', () => {
  it('starts after the countdown', () => {
    const { session, payloads } = setUp('SOLO', ['ana']);
    session.start(['ana']);
    expect(payloads('match:question')).toHaveLength(0);

    jest.advanceTimersByTime(COUNTDOWN_MS);
    expect(payloads<QuestionPayload>('match:question')[0]).toMatchObject({
      index: 0,
      total: 2,
      remainingMs: TIME_LIMIT_MS,
    });
  });

  it('ignores a second answer from the same player', () => {
    const { session, payloads, correctOption, wrongOption, startFirstRound } = setUp('DUEL', [
      'ana',
      'marko',
    ]);
    startFirstRound();

    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('ana', 0, wrongOption());
    expect(payloads<PlayerEventPayload>('match:answered')).toHaveLength(1);
    expect(payloads('match:round-result')).toHaveLength(0);

    session.submitAnswer('marko', 0, wrongOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players.find((player) => player.userId === 'ana')?.correct).toBe(true);
  });

  it('ends early when everyone has answered', () => {
    const { session, received, correctOption, startFirstRound } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound();

    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('marko', 0, correctOption());
    expect(received('ana', 'match:round-result')).toHaveLength(1);
    expect(received('marko', 'match:round-result')).toHaveLength(1);
  });

  it('ends at the deadline when nobody answers', () => {
    const { payloads, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    jest.advanceTimersByTime(TIME_LIMIT_MS - 1);
    expect(payloads('match:round-result')).toHaveLength(0);

    jest.advanceTimersByTime(1);
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0]).toMatchObject({ optionIndex: null, correct: false, points: 0 });
    expect(result.winnerUserId).toBeNull();
  });

  it('gives speed points for the time that was left', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    jest.advanceTimersByTime(TIME_LIMIT_MS / 2);
    session.submitAnswer('ana', 0, correctOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0].points).toBe(125);
  });

  it('shows the shuffled order but stores the original option', () => {
    const { session, payloads, correctOption, savedSummary, startFirstRound } = setUp(
      'SOLO',
      ['ana'],
      1,
    );
    startFirstRound();
    const shownIndex = correctOption();

    session.submitAnswer('ana', 0, shownIndex);
    expect(payloads<RoundResultPayload>('match:round-result')[0].correctIndex).toBe(shownIndex);

    session.pressNext('ana', 0);
    expect(savedSummary().players[0].answers[0]).toMatchObject({ optionIndex: 1, correct: true });
  });

  it('does not wait for a duel player who left in the middle of the question', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound();

    session.playerDisconnected('marko');
    session.submitAnswer('ana', 0, correctOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players.find((player) => player.userId === 'marko')?.optionIndex).toBeNull();
    expect(payloads<PlayerEventPayload>('match:answered').map((event) => event.userId)).toEqual([
      'ana',
    ]);
  });
});

describe('the reveal', () => {
  it('waits until every player pressed Next', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound();
    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('marko', 0, correctOption());

    session.pressNext('ana', 0);
    expect(payloads<WaitingNextPayload>('match:waiting-next').at(-1)?.userIds).toEqual(['marko']);
    expect(payloads('match:question')).toHaveLength(1);

    session.pressNext('marko', 0);
    expect(payloads<QuestionPayload>('match:question')[1].index).toBe(1);
  });

  it('moves on by itself when the reveal time is over', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();
    session.submitAnswer('ana', 0, correctOption());

    jest.advanceTimersByTime(REVEAL_MAX_MS.SOLO);
    expect(payloads('match:question')).toHaveLength(2);
  });
});

describe('the end of a match', () => {
  function playOneQuestionDuel(anaOption: 'correct' | 'wrong', markoOption: 'correct' | 'wrong') {
    const setup = setUp('DUEL', ['ana', 'marko'], 1);
    const option = (choice: 'correct' | 'wrong') =>
      choice === 'correct' ? setup.correctOption() : setup.wrongOption();
    setup.startFirstRound();
    setup.session.submitAnswer('ana', 0, option(anaOption));
    setup.session.submitAnswer('marko', 0, option(markoOption));
    setup.session.pressNext('ana', 0);
    setup.session.pressNext('marko', 0);
    return setup;
  }

  it('makes the player with more correct answers the duel winner', () => {
    const { savedSummary } = playOneQuestionDuel('correct', 'wrong');
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.map((player) => player.isWinner)).toEqual([true, false]);
  });

  it('is a draw when both duel players did equally well', () => {
    const { savedSummary } = playOneQuestionDuel('correct', 'correct');
    expect(savedSummary().players.every((player) => !player.isWinner)).toBe(true);
  });

  it('lets the remaining duel player win when the opponent does not come back', () => {
    const { session, payloads, savedSummary, startFirstRound } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound();

    session.playerDisconnected('marko');
    expect(payloads<PlayerEventPayload>('match:player-left')[0].userId).toBe('marko');

    jest.advanceTimersByTime(RETURN_GRACE_MS.DUEL);
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.find((player) => player.isWinner)?.userId).toBe('ana');
  });

  it('keeps a solo round open while the player only refreshes the page', () => {
    const { session, payloads, results, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    session.playerDisconnected('ana');
    session.playerReturned('ana');
    expect(payloads('match:round-result')).toHaveLength(0);
    expect(payloads('match:question')).toHaveLength(2);

    jest.advanceTimersByTime(RETURN_GRACE_MS.SOLO);
    expect(results.save).not.toHaveBeenCalled();
  });

  it('abandons a solo match after a minute without the player, with no rewards', () => {
    const { session, savedSummary, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    session.playerDisconnected('ana');
    jest.advanceTimersByTime(RETURN_GRACE_MS.SOLO);
    expect(savedSummary().status).toBe('ABANDONED');
    expect(savedSummary().players[0].rewarded).toBe(false);
  });
});

describe('power-ups', () => {
  it('are off in duels and parties', async () => {
    const duel = setUp('DUEL', ['ana', 'marko']);
    duel.startFirstRound();
    await expect(duel.session.useBoost('ana', 'HINT')).rejects.toThrow('Power-ups are off');

    const party = setUp('PARTY', PARTY);
    party.startFirstRound();
    await expect(party.session.useBoost('ana', 'HINT')).rejects.toThrow('Power-ups are off');
  });

  it('use the free hints before the owned ones', async () => {
    const { session, payloads, play, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'HINT');
    expect(play.spendBoost).not.toHaveBeenCalled();
    expect(payloads<BoostUsedPayload>('match:boost-used')[0]).toMatchObject({
      hint: 'Think big.',
      remaining: 2,
    });
  });

  it('cannot be used twice on the same question', async () => {
    const { session, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'HINT');
    await expect(session.useBoost('ana', 'HINT')).rejects.toThrow('already used');
  });

  it('can be tried again when the player had none left', async () => {
    const { session, play, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    play.spendBoost.mockResolvedValueOnce(false);
    await expect(session.useBoost('ana', 'FIFTY_FIFTY')).rejects.toThrow('none of this');
    await expect(session.useBoost('ana', 'FIFTY_FIFTY')).resolves.toBeUndefined();
  });

  it('removes two wrong options with fifty-fifty', async () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'FIFTY_FIFTY');
    const [boost] = payloads<BoostUsedPayload>('match:boost-used');
    expect(boost.eliminatedOptions).toHaveLength(2);
    expect(boost.eliminatedOptions).not.toContain(correctOption());
  });

  it('adds 15 seconds to the round with extra time', async () => {
    const { session, payloads, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'EXTRA_TIME');
    expect(payloads('match:deadline')).toHaveLength(1);

    jest.advanceTimersByTime(TIME_LIMIT_MS);
    expect(payloads('match:round-result')).toHaveLength(0);

    jest.advanceTimersByTime(EXTRA_TIME_MS);
    expect(payloads('match:round-result')).toHaveLength(1);
  });
});

describe('a party round', () => {
  it('is won by the first correct answer and closes at once', () => {
    const { session, received, correctOption, wrongOption, startFirstRound } = setUp(
      'PARTY',
      PARTY,
    );
    startFirstRound();

    session.submitAnswer('ana', 0, wrongOption());
    expect(received('ana', 'match:round-result')).toHaveLength(0);

    session.submitAnswer('marko', 0, correctOption());
    session.submitAnswer('iva', 0, correctOption());
    const [result] = received<RoundResultPayload>('iva', 'match:round-result');
    expect(result.winnerUserId).toBe('marko');
    expect(result.players.find((player) => player.userId === 'marko')).toMatchObject({
      correct: true,
      points: 150,
      charges: 2,
    });
    expect(result.players.find((player) => player.userId === 'iva')).toMatchObject({
      optionIndex: null,
      points: 0,
      charges: 1,
    });
  });

  it('locks out a wrong answer, announces it and keeps the score at 0 or more', () => {
    const { session, payloads, received, correctOption, wrongOption, startFirstRound } = setUp(
      'PARTY',
      PARTY,
    );
    startFirstRound();

    session.submitAnswer('ana', 0, wrongOption());
    session.submitAnswer('ana', 0, correctOption());
    expect(payloads<LockedOutPayload>('match:locked-out')).toEqual([
      { matchId: 'match-1', index: 0, userId: 'ana' },
    ]);

    session.submitAnswer('marko', 0, correctOption());
    const [result] = received<RoundResultPayload>('ana', 'match:round-result');
    expect(result.players.find((player) => player.userId === 'ana')).toMatchObject({
      correct: false,
      points: 0,
      score: 0,
    });
  });

  it('costs 25 points for a wrong answer once the player has points', () => {
    const { session, received, correctOption, wrongOption, startFirstRound } = setUp(
      'PARTY',
      PARTY,
    );
    startFirstRound();
    session.submitAnswer('ana', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    session.submitAnswer('ana', 1, wrongOption());
    session.submitAnswer('marko', 1, correctOption());
    const [, secondRound] = received<RoundResultPayload>('ana', 'match:round-result');
    expect(secondRound.players.find((player) => player.userId === 'ana')).toMatchObject({
      points: -25,
      score: 125,
    });
  });

  it('ends when every connected player is locked out', () => {
    const { session, received, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    PARTY.forEach((userId) => session.submitAnswer(userId, 0, wrongOption()));
    const [result] = received<RoundResultPayload>('ana', 'match:round-result');
    expect(result.winnerUserId).toBeNull();
  });

  it('starts without the players who are not connected yet', () => {
    const { session, payloads, received, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound(['ana', 'marko']);

    expect(payloads<PlayerEventPayload>('match:player-left')[0].userId).toBe('iva');
    session.submitAnswer('ana', 0, wrongOption());
    session.submitAnswer('marko', 0, wrongOption());
    expect(received('ana', 'match:round-result')).toHaveLength(1);
  });
});

describe('party sabotage', () => {
  it('freezes the target, who cannot answer for 3 seconds', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('ana', 'marko', 'FREEZE');
    expect(payloads<SabotagedPayload>('match:sabotaged')[0]).toMatchObject({
      type: 'FREEZE',
      fromUserId: 'ana',
      targetUserId: 'marko',
      durationMs: FREEZE_DURATION_MS,
      fromCharges: 0,
    });
    expect(() => session.submitAnswer('marko', 0, correctOption())).toThrow('You are frozen!');

    jest.advanceTimersByTime(FREEZE_DURATION_MS);
    session.submitAnswer('marko', 0, correctOption());
    expect(payloads<RoundResultPayload>('match:round-result')[0].winnerUserId).toBe('marko');
  });

  it('ends a freeze when the next question starts', () => {
    const { session, received, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    session.sabotage('ana', 'marko', 'FREEZE');
    session.submitAnswer('iva', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    session.submitAnswer('marko', 1, correctOption());
    const [, secondRound] = received<RoundResultPayload>('marko', 'match:round-result');
    expect(secondRound.winnerUserId).toBe('marko');
  });

  it('covers the target with ink for 4 seconds', () => {
    const { session, payloads, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('iva', 'ana', 'INK');
    expect(payloads<SabotagedPayload>('match:sabotaged')[0]).toMatchObject({
      type: 'INK',
      durationMs: INK_DURATION_MS,
    });
  });

  it('scrambles only the target options, and scores them in the new order', () => {
    const { session, received, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    const sharedCorrect = correctOption();

    session.sabotage('ana', 'marko', 'SCRAMBLE');
    expect(received('ana', 'match:options')).toHaveLength(0);
    const [scrambled] = received<OptionsPayload>('marko', 'match:options');
    const markoCorrect = scrambled.options.indexOf(CORRECT_OPTION);
    expect(markoCorrect).not.toBe(sharedCorrect);

    session.submitAnswer('marko', 0, markoCorrect);
    const [markoResult] = received<RoundResultPayload>('marko', 'match:round-result');
    const [anaResult] = received<RoundResultPayload>('ana', 'match:round-result');
    expect(markoResult.winnerUserId).toBe('marko');
    expect(markoResult.correctIndex).toBe(markoCorrect);
    expect(anaResult.correctIndex).toBe(sharedCorrect);
    expect(anaResult.players.find((player) => player.userId === 'marko')?.optionIndex).toBe(
      sharedCorrect,
    );
  });

  it('allows one sabotage per question and needs a charge', () => {
    const { session, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('ana', 'marko', 'INK');
    expect(() => session.sabotage('ana', 'iva', 'INK')).toThrow('One sabotage per question');

    session.submitAnswer('iva', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));
    expect(() => session.sabotage('ana', 'marko', 'INK')).toThrow('No sabotage charges');
    expect(() => session.sabotage('iva', 'iva', 'INK')).toThrow('not yourself');
  });

  it('cannot hit a player who already answered', () => {
    const { session, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.submitAnswer('marko', 0, wrongOption());
    expect(() => session.sabotage('ana', 'marko', 'FREEZE')).toThrow('already answered');
  });

  it('cannot hit a player who came back in the middle of the question', () => {
    const { session, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound(['ana', 'marko']);

    session.playerReturned('iva');
    expect(() => session.sabotage('ana', 'iva', 'FREEZE')).toThrow('already answered');
  });

  it('is only for party matches', () => {
    const { session, startFirstRound } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound();
    expect(() => session.sabotage('ana', 'marko', 'INK')).toThrow('only for party');
  });
});

describe('the end of a party', () => {
  it('makes the highest score the winner', () => {
    const { session, savedSummary, correctOption, wrongOption, startFirstRound } = setUp(
      'PARTY',
      PARTY,
      1,
    );
    startFirstRound();
    session.submitAnswer('iva', 0, wrongOption());
    session.submitAnswer('marko', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.filter((player) => player.isWinner)).toMatchObject([
      { userId: 'marko' },
    ]);
  });

  it('is a draw when nobody scored more than the others', () => {
    const { session, savedSummary, startFirstRound } = setUp('PARTY', PARTY, 1);
    startFirstRound();
    jest.advanceTimersByTime(TIME_LIMIT_MS);
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    expect(savedSummary().players.every((player) => !player.isWinner)).toBe(true);
  });

  it('goes on while two players are still here', () => {
    const { session, results, received, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.playerDisconnected('iva');
    session.submitAnswer('ana', 0, wrongOption());
    session.submitAnswer('marko', 0, wrongOption());
    expect(received('ana', 'match:round-result')).toHaveLength(1);

    jest.advanceTimersByTime(RETURN_GRACE_MS.PARTY);
    expect(results.save).not.toHaveBeenCalled();
  });

  it('lets the last player win when nobody comes back for 30 seconds', () => {
    const { session, savedSummary, results, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.playerDisconnected('iva');
    session.playerDisconnected('marko');
    jest.advanceTimersByTime(RETURN_GRACE_MS.PARTY - 1);
    expect(results.save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.filter((player) => player.isWinner)).toMatchObject([
      { userId: 'ana' },
    ]);
  });

  it('keeps going when a player comes back in time', () => {
    const { session, results, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.playerDisconnected('iva');
    session.playerDisconnected('marko');
    session.playerReturned('marko');
    jest.advanceTimersByTime(RETURN_GRACE_MS.PARTY);
    expect(results.save).not.toHaveBeenCalled();
  });

  it('goes on without a player who quits while two are still here', async () => {
    const { session, results, received, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    await session.quit('iva');
    session.submitAnswer('ana', 0, wrongOption());
    session.submitAnswer('marko', 0, wrongOption());
    expect(received('ana', 'match:round-result')).toHaveLength(1);
    expect(results.save).not.toHaveBeenCalled();
  });

  it('ends at once when a player quits and only one is left', async () => {
    const { session, savedSummary, startFirstRound } = setUp('PARTY', ['ana', 'marko']);
    startFirstRound();

    await session.quit('marko');
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.filter((player) => player.isWinner)).toMatchObject([
      { userId: 'ana' },
    ]);
  });
});
