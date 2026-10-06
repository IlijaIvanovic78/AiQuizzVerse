import { MatchOutcome, MatchResult, MatchResultPlayer } from '../../core/models/match.model';
import { PathResult } from '../../core/models/path.model';
import { mainActionFor, missedQuestions, rankPlayers, resultHeadline } from './match-result.rules';

function player(id: string, correctCount: number, outcome: MatchOutcome): MatchResultPlayer {
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
    players: [player('hero', 5, 'DONE')],
    questions: [],
    path: null,
    leveledUp: false,
    coinCapReached: false,
    chestsEarned: [],
    ...changes,
  };
}

describe('missedQuestions', () => {
  it('keeps wrong and unanswered questions', () => {
    const question = { text: 'Q', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: '' };
    const missed = missedQuestions(
      result({
        questions: [
          { ...question, questionId: 'right', myAnswer: 1 },
          { ...question, questionId: 'wrong', myAnswer: 2 },
          { ...question, questionId: 'skipped', myAnswer: null },
        ],
      }),
    );

    expect(missed.map((item) => item.questionId)).toEqual(['wrong', 'skipped']);
  });

  it('keeps only wrong answers in a party, where others can answer first', () => {
    const question = { text: 'Q', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: '' };
    const missed = missedQuestions(
      result({
        mode: 'PARTY',
        questions: [
          { ...question, questionId: 'wrong', myAnswer: 2 },
          { ...question, questionId: 'beaten', myAnswer: null },
        ],
      }),
    );

    expect(missed.map((item) => item.questionId)).toEqual(['wrong']);
  });
});

describe('mainActionFor', () => {
  const step = (changes: Partial<PathResult>): PathResult => ({
    pathId: 'path-1',
    stepId: 'step-1',
    stars: 3,
    cleared: true,
    nextStepId: 'step-2',
    reward: null,
    ...changes,
  });

  it('leads a cleared step on to the next one', () => {
    expect(mainActionFor(result({ path: step({}) }))).toBe('next-step');
  });

  it('leads back to the path after its last step', () => {
    expect(mainActionFor(result({ path: step({ nextStepId: null }) }))).toBe('back-to-path');
  });

  it('offers to try again when the step is not cleared yet', () => {
    expect(mainActionFor(result({ path: step({ cleared: false, nextStepId: null }) }))).toBe(
      'replay',
    );
    expect(mainActionFor(result({}))).toBe('replay');
  });

  it('asks for a rematch after a match with friends', () => {
    expect(mainActionFor(result({ mode: 'PARTY' }))).toBe('rematch');
  });
});

describe('resultHeadline', () => {
  it('never calls a low solo score a defeat', () => {
    const headline = resultHeadline(result({ players: [player('hero', 2, 'DONE')] }), 'hero');

    expect(headline.title).toBe('Almost! Try again for a star');
    expect(headline.tone).toBe('almost');
  });

  it('celebrates a cleared path step', () => {
    const headline = resultHeadline(result({ kind: 'PATH_STEP' }), 'hero');

    expect(headline.title).toBe('Step cleared!');
  });
});

describe('rankPlayers', () => {
  it('puts the highest score first and lets a tie share a place', () => {
    const ranked = rankPlayers([
      player('owl', 2, 'LOSS'),
      player('hero', 4, 'DRAW'),
      player('fox', 4, 'DRAW'),
    ]);

    expect(ranked.map((entry) => [entry.player.user.id, entry.rank])).toEqual([
      ['hero', 1],
      ['fox', 1],
      ['owl', 3],
    ]);
  });

  it('puts a leader who left the party below the players who stayed and drew', () => {
    const ranked = rankPlayers([
      player('quitter', 5, 'LOSS'),
      player('hero', 3, 'DRAW'),
      player('fox', 3, 'DRAW'),
      player('owl', 1, 'LOSS'),
    ]);

    expect(ranked.map((entry) => [entry.player.user.id, entry.rank])).toEqual([
      ['hero', 1],
      ['fox', 1],
      ['quitter', 3],
      ['owl', 4],
    ]);
  });
});

describe('party headline', () => {
  const party = (players: MatchResultPlayer[]) => result({ mode: 'PARTY', players });

  it('crowns the party winner', () => {
    const headline = resultHeadline(
      party([player('hero', 4, 'WIN'), player('fox', 2, 'LOSS')]),
      'hero',
    );

    expect(headline.title).toBe('Victory!');
  });

  it('tells the others their place without calling it a defeat', () => {
    const players = [player('fox', 4, 'WIN'), player('owl', 3, 'LOSS'), player('hero', 1, 'LOSS')];

    const headline = resultHeadline(party(players), 'hero');

    expect(headline.title).toBe('Good fight!');
    expect(headline.subtitle).toBe('You finished third of 3. Ask for a rematch!');
  });

  it('cheers for the loser of a two-player party too', () => {
    const headline = resultHeadline(
      party([player('fox', 4, 'WIN'), player('hero', 2, 'LOSS')]),
      'hero',
    );

    expect(headline.title).toBe('Good fight!');
    expect(headline.subtitle).toBe('You finished second of 2. Ask for a rematch!');
  });

  it('calls a shared first place a draw', () => {
    const headline = resultHeadline(
      party([player('hero', 3, 'DRAW'), player('fox', 3, 'DRAW')]),
      'hero',
    );

    expect(headline.title).toBe('Draw!');
  });

  it('keeps the stored draw when the leader left the party early', () => {
    const headline = resultHeadline(
      party([player('quitter', 5, 'LOSS'), player('hero', 3, 'DRAW'), player('fox', 3, 'DRAW')]),
      'hero',
    );

    expect(headline.title).toBe('Draw!');
    expect(headline.subtitle).toBe('You share first place. What a close party!');
  });
});

describe('team headline', () => {
  const team = (outcome: MatchOutcome) =>
    result({ mode: 'TEAM', players: [player('hero', 4, outcome), player('fox', 3, outcome)] });

  it('celebrates a team win', () => {
    expect(resultHeadline(team('WIN'), 'hero').title).toBe('Team victory!');
  });

  it('calls a missed team goal so close', () => {
    expect(resultHeadline(team('DONE'), 'hero').title).toBe('So close!');
  });
});
