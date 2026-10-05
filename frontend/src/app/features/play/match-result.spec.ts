import { MatchResult, MatchResultPlayer } from '../../core/models/match.model';
import { missedQuestions, resultHeadline } from './match-result';

function player(id: string, correctCount: number, isWinner: boolean): MatchResultPlayer {
  return {
    user: { id, username: id, avatarKey: null, petKey: null, level: 1 },
    score: correctCount * 100,
    correctCount,
    isWinner,
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
    players: [player('hero', 5, false)],
    questions: [],
    path: null,
    leveledUp: false,
    coinCapReached: false,
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
});

describe('resultHeadline', () => {
  it('never calls a low solo score a defeat', () => {
    const headline = resultHeadline(result({ players: [player('hero', 2, false)] }), 'hero');

    expect(headline.title).toBe('Almost! Try again for a star');
    expect(headline.tone).toBe('almost');
  });

  it('celebrates a cleared path step', () => {
    const headline = resultHeadline(result({ kind: 'PATH_STEP' }), 'hero');

    expect(headline.title).toBe('Step cleared!');
  });

  it('calls a duel without a winner a draw', () => {
    const duel = result({
      mode: 'DUEL',
      players: [player('hero', 3, false), player('rival', 3, false)],
    });

    expect(resultHeadline(duel, 'hero').title).toBe('Draw!');
  });

  it('cheers for the duel loser too', () => {
    const duel = result({
      mode: 'DUEL',
      players: [player('hero', 2, false), player('rival', 4, true)],
    });

    expect(resultHeadline(duel, 'hero').title).toBe('Good fight!');
  });
});
