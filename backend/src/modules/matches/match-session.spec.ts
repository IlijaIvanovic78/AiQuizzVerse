import { MatchMode, Question } from '@prisma/client';
import { MatchSession, MatchSessionDeps } from './match-session';
import {
  COUNTDOWN_SECONDS,
  EXTRA_TIME_MS,
  MS_PER_SECOND,
  RETURN_GRACE_MS,
  REVEAL_MAX_MS,
} from './matches.constants';
import {
  BoostUsedPayload,
  FinishedPlayer,
  MatchBoostType,
  MatchSummary,
  PlayerEventPayload,
  QuestionPayload,
  RoundResultPayload,
  WaitingNextPayload,
} from './matches.types';

const TIME_PER_QUESTION = 20;
const TIME_LIMIT_MS = TIME_PER_QUESTION * MS_PER_SECOND;
const COUNTDOWN_MS = COUNTDOWN_SECONDS * MS_PER_SECOND;
const CORRECT_OPTION = 'Jupiter';

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
  const lastQuestion = () => payloads<QuestionPayload>('match:question').at(-1);
  const correctOption = () => lastQuestion()?.options.indexOf(CORRECT_OPTION) ?? -1;
  const wrongOption = () => (correctOption() + 1) % 4;
  const savedSummary = () => results.save.mock.calls[0][0];

  return { session, payloads, correctOption, wrongOption, savedSummary, results, play };
}

function startFirstRound(session: MatchSession): void {
  session.start();
  jest.advanceTimersByTime(COUNTDOWN_MS);
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
    session.start();
    expect(payloads('match:question')).toHaveLength(0);

    jest.advanceTimersByTime(COUNTDOWN_MS);
    expect(payloads<QuestionPayload>('match:question')[0]).toMatchObject({
      index: 0,
      total: 2,
      remainingMs: TIME_LIMIT_MS,
    });
  });

  it('ignores a second answer from the same player', () => {
    const { session, payloads, correctOption, wrongOption } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);

    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('ana', 0, wrongOption());
    expect(payloads<PlayerEventPayload>('match:answered')).toHaveLength(1);
    expect(payloads('match:round-result')).toHaveLength(0);

    session.submitAnswer('marko', 0, wrongOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players.find((player) => player.userId === 'ana')?.correct).toBe(true);
  });

  it('ends early when everyone has answered', () => {
    const { session, payloads, correctOption } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);

    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('marko', 0, correctOption());
    expect(payloads('match:round-result')).toHaveLength(1);
  });

  it('ends at the deadline when nobody answers', () => {
    const { session, payloads } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    jest.advanceTimersByTime(TIME_LIMIT_MS - 1);
    expect(payloads('match:round-result')).toHaveLength(0);

    jest.advanceTimersByTime(1);
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0]).toMatchObject({ optionIndex: null, correct: false, points: 0 });
  });

  it('gives speed points for the time that was left', () => {
    const { session, payloads, correctOption } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    jest.advanceTimersByTime(TIME_LIMIT_MS / 2);
    session.submitAnswer('ana', 0, correctOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0].points).toBe(125);
  });

  it('shows the shuffled order but stores the original option', () => {
    const { session, payloads, correctOption, savedSummary } = setUp('SOLO', ['ana'], 1);
    startFirstRound(session);
    const shownIndex = correctOption();

    session.submitAnswer('ana', 0, shownIndex);
    expect(payloads<RoundResultPayload>('match:round-result')[0].correctIndex).toBe(shownIndex);

    session.pressNext('ana', 0);
    expect(savedSummary().players[0].answers[0]).toMatchObject({ optionIndex: 1, correct: true });
  });

  it('does not wait for a duel player who left in the middle of the question', () => {
    const { session, payloads, correctOption } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);

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
    const { session, payloads, correctOption } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);
    session.submitAnswer('ana', 0, correctOption());
    session.submitAnswer('marko', 0, correctOption());

    session.pressNext('ana', 0);
    expect(payloads<WaitingNextPayload>('match:waiting-next').at(-1)?.userIds).toEqual(['marko']);
    expect(payloads('match:question')).toHaveLength(1);

    session.pressNext('marko', 0);
    expect(payloads<QuestionPayload>('match:question')[1].index).toBe(1);
  });

  it('moves on by itself when the reveal time is over', () => {
    const { session, payloads, correctOption } = setUp('SOLO', ['ana']);
    startFirstRound(session);
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
    startFirstRound(setup.session);
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
    const { session, payloads, savedSummary } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);

    session.playerDisconnected('marko');
    expect(payloads<PlayerEventPayload>('match:player-left')[0].userId).toBe('marko');

    jest.advanceTimersByTime(RETURN_GRACE_MS.DUEL);
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.find((player) => player.isWinner)?.userId).toBe('ana');
  });

  it('keeps a solo round open while the player only refreshes the page', () => {
    const { session, payloads, results } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    session.playerDisconnected('ana');
    session.playerReturned('ana');
    expect(payloads('match:round-result')).toHaveLength(0);
    expect(payloads('match:question')).toHaveLength(2);

    jest.advanceTimersByTime(RETURN_GRACE_MS.SOLO);
    expect(results.save).not.toHaveBeenCalled();
  });

  it('abandons a solo match after a minute without the player, with no rewards', () => {
    const { session, savedSummary } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    session.playerDisconnected('ana');
    jest.advanceTimersByTime(RETURN_GRACE_MS.SOLO);
    expect(savedSummary().status).toBe('ABANDONED');
    expect(savedSummary().players[0].rewarded).toBe(false);
  });
});

describe('power-ups', () => {
  it('are off in duels', async () => {
    const { session } = setUp('DUEL', ['ana', 'marko']);
    startFirstRound(session);
    await expect(session.useBoost('ana', 'HINT')).rejects.toThrow('Power-ups are off in duels');
  });

  it('use the free hints before the owned ones', async () => {
    const { session, payloads, play } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    await session.useBoost('ana', 'HINT');
    expect(play.spendBoost).not.toHaveBeenCalled();
    expect(payloads<BoostUsedPayload>('match:boost-used')[0]).toMatchObject({
      hint: 'Think big.',
      remaining: 2,
    });
  });

  it('cannot be used twice on the same question', async () => {
    const { session } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    await session.useBoost('ana', 'HINT');
    await expect(session.useBoost('ana', 'HINT')).rejects.toThrow('already used');
  });

  it('can be tried again when the player had none left', async () => {
    const { session, play } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    play.spendBoost.mockResolvedValueOnce(false);
    await expect(session.useBoost('ana', 'FIFTY_FIFTY')).rejects.toThrow('none of this');
    await expect(session.useBoost('ana', 'FIFTY_FIFTY')).resolves.toBeUndefined();
  });

  it('removes two wrong options with fifty-fifty', async () => {
    const { session, payloads, correctOption } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    await session.useBoost('ana', 'FIFTY_FIFTY');
    const [boost] = payloads<BoostUsedPayload>('match:boost-used');
    expect(boost.eliminatedOptions).toHaveLength(2);
    expect(boost.eliminatedOptions).not.toContain(correctOption());
  });

  it('adds 15 seconds to the round with extra time', async () => {
    const { session, payloads } = setUp('SOLO', ['ana']);
    startFirstRound(session);

    await session.useBoost('ana', 'EXTRA_TIME');
    expect(payloads('match:deadline')).toHaveLength(1);

    jest.advanceTimersByTime(TIME_LIMIT_MS);
    expect(payloads('match:round-result')).toHaveLength(0);

    jest.advanceTimersByTime(EXTRA_TIME_MS);
    expect(payloads('match:round-result')).toHaveLength(1);
  });
});
