import { MatchMode, Question } from '@prisma/client';
import { MatchSession, MatchSessionDeps } from './match-session';
import {
  COUNTDOWN_SECONDS,
  EXTRA_TIME_MS,
  FOG_DURATION_MS,
  FREEZE_DURATION_MS,
  INK_DURATION_MS,
  MIRROR_DURATION_MS,
  MS_PER_SECOND,
  QUAKE_DURATION_MS,
  RETURN_GRACE_MS,
  REVEAL_MAX_MS,
  SABOTAGE_TYPES,
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
  SabotagePayload,
  SabotagedPayload,
  SabotageType,
  SecondChancePayload,
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

/** Every player owns the sabotages given, all of them unless a test says otherwise. */
function setUp(
  mode: MatchMode,
  playerIds: string[],
  questionCount = 2,
  sabotages: SabotageType[] = SABOTAGE_TYPES,
) {
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
      players: playerIds.map((userId) => ({ userId, sabotages })),
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
    const { session, payloads, correctOption, wrongOption, startFirstRound } = setUp('TEAM', [
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
    const { session, received, correctOption, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
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

  it('does not wait for a team player who left in the middle of the question', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
    startFirstRound();

    session.playerDisconnected('marko');
    session.submitAnswer('ana', 0, correctOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players.find((player) => player.userId === 'marko')?.optionIndex).toBeNull();
    expect(payloads<PlayerEventPayload>('match:answered').map((event) => event.userId)).toEqual([
      'ana',
    ]);
  });

  it('tells a team player who comes back in the middle of the question that it is done', () => {
    const { session, received, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
    startFirstRound();

    session.playerDisconnected('marko');
    session.playerReturned('marko');
    expect(received<QuestionPayload>('marko', 'match:question')).toHaveLength(2);
    expect(received<PlayerEventPayload>('marko', 'match:answered')).toEqual([
      { matchId: 'match-1', userId: 'marko' },
    ]);
  });
});

describe('the reveal', () => {
  it('waits until every player pressed Next', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
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
  function playOneQuestionTeam(anaOption: 'correct' | 'wrong', markoOption: 'correct' | 'wrong') {
    const setup = setUp('TEAM', ['ana', 'marko'], 1);
    const option = (choice: 'correct' | 'wrong') =>
      choice === 'correct' ? setup.correctOption() : setup.wrongOption();
    setup.startFirstRound();
    setup.session.submitAnswer('ana', 0, option(anaOption));
    setup.session.submitAnswer('marko', 0, option(markoOption));
    setup.session.pressNext('ana', 0);
    setup.session.pressNext('marko', 0);
    return setup;
  }

  it('makes both team players winners when the team reaches 60%', () => {
    const { savedSummary } = playOneQuestionTeam('correct', 'correct');
    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players.map((player) => player.isWinner)).toEqual([true, true]);
  });

  it('has no winners when the team stays below 60%', () => {
    const { savedSummary } = playOneQuestionTeam('correct', 'wrong');
    expect(savedSummary().players.every((player) => !player.isWinner)).toBe(true);
  });

  it('abandons a team match when the partner does not come back', () => {
    const { session, payloads, savedSummary, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
    startFirstRound();

    session.playerDisconnected('marko');
    expect(payloads<PlayerEventPayload>('match:player-left')[0].userId).toBe('marko');

    jest.advanceTimersByTime(RETURN_GRACE_MS.TEAM);
    expect(savedSummary().status).toBe('ABANDONED');
    expect(savedSummary().players.map((player) => player.rewarded)).toEqual([true, false]);
  });

  it('keeps a solo round open while the player only refreshes the page', () => {
    const { session, payloads, results, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    session.playerDisconnected('ana');
    session.playerReturned('ana');
    expect(payloads('match:round-result')).toHaveLength(0);
    expect(payloads('match:question')).toHaveLength(2);
    expect(payloads('match:answered')).toHaveLength(0);

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
  it('are off in party matches', async () => {
    const { session, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    await expect(session.useBoost('ana', 'HINT')).rejects.toThrow(
      'Power-ups are off in party matches',
    );
  });

  it('wait for the question to start', async () => {
    const { session } = setUp('SOLO', ['ana']);
    session.start(['ana']);
    await expect(session.useBoost('ana', 'HINT')).rejects.toThrow('Wait for the question');
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

describe('second chance', () => {
  it('lets the player try again after a wrong answer and pays half points', async () => {
    const { session, payloads, received, correctOption, wrongOption, startFirstRound } = setUp(
      'SOLO',
      ['ana'],
    );
    startFirstRound();

    await session.useBoost('ana', 'SECOND_CHANCE');
    expect(payloads<BoostUsedPayload>('match:boost-used')[0]).toMatchObject({
      type: 'SECOND_CHANCE',
      remaining: 1,
    });
    session.submitAnswer('ana', 0, wrongOption());
    expect(received<SecondChancePayload>('ana', 'match:second-chance')).toEqual([
      { matchId: 'match-1', index: 0, wrongOption: wrongOption() },
    ]);
    expect(payloads('match:round-result')).toHaveLength(0);

    session.submitAnswer('ana', 0, correctOption());
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0]).toMatchObject({ correct: true, points: 50 });
  });

  it('gives a normal wrong result when the second try is wrong too', async () => {
    const { session, payloads, received, wrongOption, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'SECOND_CHANCE');
    session.submitAnswer('ana', 0, wrongOption());
    session.submitAnswer('ana', 0, wrongOption());
    expect(received('ana', 'match:second-chance')).toHaveLength(1);
    const [result] = payloads<RoundResultPayload>('match:round-result');
    expect(result.players[0]).toMatchObject({ correct: false, points: 0 });
  });

  it('is not needed when the first answer is right, which keeps the speed bonus', async () => {
    const { session, payloads, received, correctOption, startFirstRound } = setUp('SOLO', ['ana']);
    startFirstRound();

    await session.useBoost('ana', 'SECOND_CHANCE');
    session.submitAnswer('ana', 0, correctOption());
    expect(received('ana', 'match:second-chance')).toHaveLength(0);
    expect(payloads<RoundResultPayload>('match:round-result')[0].players[0].points).toBe(150);
  });

  it('lasts one question and keeps a team round open for the second try', async () => {
    const { session, payloads, correctOption, wrongOption, startFirstRound } = setUp('TEAM', [
      'ana',
      'marko',
    ]);
    startFirstRound();

    await session.useBoost('ana', 'SECOND_CHANCE');
    session.submitAnswer('marko', 0, correctOption());
    session.submitAnswer('ana', 0, wrongOption());
    expect(payloads('match:round-result')).toHaveLength(0);
    session.submitAnswer('ana', 0, wrongOption());
    session.pressNext('ana', 0);
    session.pressNext('marko', 0);

    session.submitAnswer('ana', 1, wrongOption());
    session.submitAnswer('marko', 1, wrongOption());
    const [, secondRound] = payloads<RoundResultPayload>('match:round-result');
    expect(secondRound.players.find((player) => player.userId === 'ana')?.correct).toBe(false);
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

  it('keeps the live scores and charges for a player who comes back', () => {
    const { session, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.submitAnswer('marko', 0, correctOption());
    expect(session.liveStats()).toEqual([
      { userId: 'ana', score: 0, correctCount: 0, charges: 1 },
      { userId: 'marko', score: 150, correctCount: 1, charges: 2 },
      { userId: 'iva', score: 0, correctCount: 0, charges: 1 },
    ]);
  });
});

describe('party sabotage', () => {
  it('freezes the target, who cannot answer for 3 seconds', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('ana', 'FREEZE', 'marko');
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
    session.sabotage('ana', 'FREEZE', 'marko');
    session.submitAnswer('iva', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    session.submitAnswer('marko', 1, correctOption());
    const [, secondRound] = received<RoundResultPayload>('marko', 'match:round-result');
    expect(secondRound.winnerUserId).toBe('marko');
  });

  it('covers the target with ink for 4 seconds', () => {
    const { session, payloads, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('iva', 'INK', 'ana');
    expect(payloads<SabotagedPayload>('match:sabotaged')[0]).toMatchObject({
      type: 'INK',
      durationMs: INK_DURATION_MS,
    });
  });

  it('blurs, shakes or mirrors the target screen for a few seconds', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('ana', 'FOG', 'marko');
    session.sabotage('marko', 'QUAKE', 'iva');
    session.sabotage('iva', 'MIRROR', 'ana');
    expect(
      payloads<SabotagedPayload>('match:sabotaged').map(({ type, durationMs }) => ({
        type,
        durationMs,
      })),
    ).toEqual([
      { type: 'FOG', durationMs: FOG_DURATION_MS },
      { type: 'QUAKE', durationMs: QUAKE_DURATION_MS },
      { type: 'MIRROR', durationMs: MIRROR_DURATION_MS },
    ]);

    session.submitAnswer('marko', 0, correctOption());
    expect(payloads<RoundResultPayload>('match:round-result')[0].winnerUserId).toBe('marko');
  });

  it('raises a shield on yourself without a target and shows it to the room', () => {
    const { session, payloads, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.sabotage('ana', 'SHIELD');
    expect(payloads<SabotagedPayload>('match:sabotaged')[0]).toEqual({
      matchId: 'match-1',
      index: 0,
      type: 'SHIELD',
      fromUserId: 'ana',
      targetUserId: 'ana',
      durationMs: 0,
      fromCharges: 0,
    });
    expect(() => session.sabotage('ana', 'INK', 'marko')).toThrow('One sabotage per question');
  });

  it('blocks the next sabotage with a shield, and the attacker still spends the charge', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    session.sabotage('ana', 'SHIELD');

    session.sabotage('marko', 'FREEZE', 'ana');
    expect(payloads<SabotagePayload>('match:sabotage-blocked')).toEqual([
      {
        matchId: 'match-1',
        index: 0,
        type: 'FREEZE',
        fromUserId: 'marko',
        targetUserId: 'ana',
        fromCharges: 0,
      },
    ]);
    expect(payloads('match:sabotaged')).toHaveLength(1);

    session.sabotage('iva', 'FREEZE', 'ana');
    expect(payloads('match:sabotaged')).toHaveLength(2);
    expect(() => session.submitAnswer('ana', 0, correctOption())).toThrow('You are frozen!');
  });

  it('allows a shield only before you answer', () => {
    const { session, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.submitAnswer('ana', 0, wrongOption());
    expect(() => session.sabotage('ana', 'SHIELD')).toThrow('before you answer');
  });

  it('drops the shield when the next question starts', () => {
    const { session, payloads, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    session.sabotage('ana', 'SHIELD');
    session.submitAnswer('iva', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    session.sabotage('iva', 'INK', 'ana');
    expect(payloads('match:sabotage-blocked')).toHaveLength(0);
    expect(payloads<SabotagedPayload>('match:sabotaged').at(-1)?.type).toBe('INK');
  });

  it('scrambles only the target options, and scores them in the new order', () => {
    const { session, received, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    const sharedCorrect = correctOption();

    session.sabotage('ana', 'SCRAMBLE', 'marko');
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

    session.sabotage('ana', 'INK', 'marko');
    expect(() => session.sabotage('ana', 'INK', 'iva')).toThrow('One sabotage per question');

    session.submitAnswer('iva', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));
    expect(() => session.sabotage('ana', 'INK', 'marko')).toThrow('No sabotage charges');
    expect(() => session.sabotage('iva', 'INK', 'iva')).toThrow('not yourself');
  });

  it('cannot hit a player who already answered', () => {
    const { session, wrongOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();

    session.submitAnswer('marko', 0, wrongOption());
    expect(() => session.sabotage('ana', 'FREEZE', 'marko')).toThrow('already answered');
  });

  it('cannot hit a player who came back in the middle of the question', () => {
    const { session, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound(['ana', 'marko']);

    session.playerReturned('iva');
    expect(() => session.sabotage('ana', 'FREEZE', 'iva')).toThrow('already answered');
  });

  it('needs a target who plays in this match', () => {
    const { session, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    expect(() => session.sabotage('ana', 'INK', 'nobody')).toThrow('not in this match');
  });

  it('is only for party matches', () => {
    const { session, startFirstRound } = setUp('TEAM', ['ana', 'marko']);
    startFirstRound();
    expect(() => session.sabotage('ana', 'INK', 'marko')).toThrow('only for party');
  });

  it('needs a sabotage from the shop, and a refused one does not spend the charge', () => {
    const { session, payloads, startFirstRound } = setUp('PARTY', PARTY, 2, ['INK']);
    startFirstRound();

    expect(() => session.sabotage('ana', 'FOG', 'marko')).toThrow("You don't own this sabotage");
    expect(() => session.sabotage('ana', 'SHIELD')).toThrow('You can get it in the shop');
    session.sabotage('ana', 'INK', 'marko');
    expect(payloads<SabotagedPayload>('match:sabotaged')).toMatchObject([
      { type: 'INK', fromUserId: 'ana', fromCharges: 0 },
    ]);
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

  it('lets only the players who stayed win, even when the leader quits', async () => {
    const { session, savedSummary, correctOption, startFirstRound } = setUp('PARTY', PARTY);
    startFirstRound();
    session.submitAnswer('ana', 0, correctOption());
    PARTY.forEach((userId) => session.pressNext(userId, 0));

    await session.quit('ana');
    jest.advanceTimersByTime(TIME_LIMIT_MS / 2);
    session.submitAnswer('marko', 1, correctOption());
    session.pressNext('marko', 1);
    session.pressNext('iva', 1);

    expect(savedSummary().status).toBe('FINISHED');
    expect(savedSummary().players).toMatchObject([
      { userId: 'ana', score: 150, isWinner: false, ranked: false, rewarded: true },
      { userId: 'marko', score: 125, isWinner: true, ranked: true },
      { userId: 'iva', score: 0, isWinner: false, ranked: true },
    ]);
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
