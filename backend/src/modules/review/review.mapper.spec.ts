import { QuizTheme } from '@prisma/client';
import { ReviewCardRow, toPracticeQuizData, toReviewCardView } from './review.mapper';

function makeCard(questionId: string, theme: QuizTheme = 'SPACE'): ReviewCardRow {
  return {
    id: `card-${questionId}`,
    userId: 'user-1',
    questionId,
    timesWrong: 2,
    correctStreak: 1,
    dueOn: new Date('2026-10-05T00:00:00Z'),
    createdAt: new Date('2026-10-01T00:00:00Z'),
    question: {
      id: questionId,
      quizId: 'quiz-1',
      position: 1,
      text: 'Which planet is closest to the Sun?',
      options: ['Venus', 'Mercury', 'Earth', 'Mars'],
      correctIndex: 1,
      explanation: 'Mercury is the closest planet to the Sun.',
      hint: 'It is the smallest planet.',
      sourceQuestionId: null,
      quiz: { title: 'The Solar System', theme, audience: 'KIDS', language: 'EN' },
    },
  };
}

describe('toReviewCardView', () => {
  it('shows the question with its correct answer and quiz title', () => {
    expect(toReviewCardView(makeCard('question-1'))).toMatchObject({
      questionText: 'Which planet is closest to the Sun?',
      correctAnswer: 'Mercury',
      quizTitle: 'The Solar System',
      timesWrong: 2,
    });
  });
});

describe('toPracticeQuizData', () => {
  it('builds a hidden review quiz whose questions point to the originals', () => {
    const quiz = toPracticeQuizData('user-1', [makeCard('question-1'), makeCard('question-2')]);

    expect(quiz).toMatchObject({
      kind: 'REVIEW',
      title: 'Mistakes review',
      theme: 'SPACE',
      timePerQuestion: 45,
      ownerId: 'user-1',
    });
    expect(quiz.questions?.create).toEqual([
      expect.objectContaining({ position: 1, sourceQuestionId: 'question-1', correctIndex: 1 }),
      expect.objectContaining({ position: 2, sourceQuestionId: 'question-2', correctIndex: 1 }),
    ]);
  });

  it('uses the general theme when the questions come from different themes', () => {
    const quiz = toPracticeQuizData('user-1', [makeCard('a', 'SPACE'), makeCard('b', 'NATURE')]);

    expect(quiz.theme).toBe('GENERAL');
  });
});
