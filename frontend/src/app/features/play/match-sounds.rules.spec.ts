import { MatchOutcome, MatchResult, MatchResultPlayer } from '../../core/models/match.model';
import { RoundPlayerResult, RoundResultEvent } from '../../core/models/realtime-events.model';
import {
  countdownSound,
  endingSound,
  isSameRound,
  roundSound,
  starPlinkDelays,
  timerTick,
} from './match-sounds.rules';

function roundPlayer(
  userId: string,
  optionIndex: number | null,
  correct: boolean,
): RoundPlayerResult {
  return { userId, optionIndex, correct, points: 0, score: 0, charges: 0 };
}

function round(players: RoundPlayerResult[], winnerUserId: string | null = null): RoundResultEvent {
  return {
    matchId: 'match-1',
    index: 0,
    correctIndex: 1,
    explanation: '',
    winnerUserId,
    players,
    teamCorrect: 0,
  };
}

function resultPlayer(id: string, correctCount: number, outcome: MatchOutcome): MatchResultPlayer {
  return {
    user: { id, username: id, avatarKey: null, petKey: null, level: 1 },
    score: correctCount * 100,
    correctCount,
    outcome,
    xpEarned: 0,
    coinsEarned: 0,
  };
}

function result(changes: Partial<MatchResult>): MatchResult {
  return {
    matchId: 'match-1',
    mode: 'SOLO',
    quizId: 'quiz-1',
    quizTitle: 'The Solar System',
    theme: 'SPACE',
    kind: 'STANDARD',
    questionCount: 5,
    players: [resultPlayer('hero', 5, 'DONE')],
    questions: [],
    path: null,
    leveledUp: false,
    coinCapReached: false,
    chestsEarned: [],
    ...changes,
  };
}

describe('countdownSound', () => {
  it('beeps on 3, 2 and 1 and jumps up on GO!', () => {
    expect(['3', '2', '1', 'GO!'].map(countdownSound)).toEqual(['beep', 'beep', 'beep', 'go']);
  });

  it('stays quiet when there is no countdown', () => {
    expect(countdownSound(null)).toBeNull();
  });
});

describe('timerTick', () => {
  it('ticks through the last five seconds and more urgently through the last three', () => {
    const ticks = [6, 5, 4, 3, 2, 1, 0].map((seconds) => timerTick(seconds, false));

    expect(ticks).toEqual([null, 'tick', 'tick', 'urgent', 'urgent', 'urgent', null]);
  });

  it('stops ticking once I answered', () => {
    expect(timerTick(3, true)).toBeNull();
  });

  it('stays quiet without a running clock', () => {
    expect(timerTick(null, false)).toBeNull();
  });
});

describe('roundSound', () => {
  it('plays the right or wrong answer in solo and team games', () => {
    expect(roundSound(round([roundPlayer('hero', 1, true)]), 'hero', 'SOLO')).toBe('correct');
    expect(roundSound(round([roundPlayer('hero', 2, false)]), 'hero', 'TEAM')).toBe('wrong');
  });

  it('plays time up only when I did not answer before the deadline', () => {
    expect(roundSound(round([roundPlayer('hero', null, false)]), 'hero', 'SOLO')).toBe('time-up');
  });

  it('tells me when someone else won the party round first', () => {
    const lost = round([roundPlayer('hero', null, false), roundPlayer('fox', 1, true)], 'fox');

    expect(roundSound(lost, 'hero', 'PARTY')).toBe('round-lost');
  });

  it('does not repeat a party mistake that was heard when it locked me out', () => {
    const nobodyGotIt = round([roundPlayer('hero', 2, false), roundPlayer('fox', null, false)]);

    expect(roundSound(nobodyGotIt, 'hero', 'PARTY')).toBeNull();
  });

  it('stays quiet for a player who is not in the round', () => {
    expect(roundSound(round([roundPlayer('fox', 1, true)]), 'hero', 'TEAM')).toBeNull();
  });
});

describe('isSameRound', () => {
  it('knows a round result that was sent again', () => {
    const first = round([roundPlayer('hero', 1, true)]);

    expect(isSameRound(first, { ...first })).toBe(true);
    expect(isSameRound(first, { ...first, index: 1 })).toBe(false);
    expect(isSameRound(first, { ...first, matchId: 'match-2' })).toBe(false);
  });
});

describe('endingSound', () => {
  it('plinks the stars of a solo game instead of a fanfare', () => {
    expect(endingSound(result({}), 'hero')).toBe('stars');
  });

  it('plays almost for a solo game without stars', () => {
    const noStars = result({ players: [resultPlayer('hero', 1, 'DONE')] });

    expect(endingSound(noStars, 'hero')).toBe('almost');
  });

  it('follows the stored party outcome', () => {
    const party = (mine: MatchOutcome, theirs: MatchOutcome) =>
      result({
        mode: 'PARTY',
        players: [resultPlayer('hero', 3, mine), resultPlayer('fox', 3, theirs)],
      });

    expect(endingSound(party('WIN', 'LOSS'), 'hero')).toBe('victory');
    expect(endingSound(party('DRAW', 'DRAW'), 'hero')).toBe('draw');
    expect(endingSound(party('LOSS', 'WIN'), 'hero')).toBe('almost');
  });
});

describe('starPlinkDelays', () => {
  it('plinks every star when its pop is at its biggest', () => {
    expect(starPlinkDelays(3)).toEqual([315, 495, 675]);
    expect(starPlinkDelays(0)).toEqual([]);
  });
});
