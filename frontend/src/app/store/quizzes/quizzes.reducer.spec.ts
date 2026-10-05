import { QuestionView, QuizDetail, QuizSummary } from '../../core/models/quiz.model';
import { toQuizSummary } from './quiz.mapper';
import { QuizzesActions } from './quizzes.actions';
import { QuizzesState, initialQuizzesState, quizzesFeature } from './quizzes.reducer';

const reducer = quizzesFeature.reducer;

function question(id: string, position: number): QuestionView {
  return {
    id,
    position,
    text: `Question ${position}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Because A.',
    hint: 'Think about A.',
  };
}

function quizDetail(id: string, createdAt: string, questions: QuestionView[]): QuizDetail {
  return {
    id,
    title: `Quiz ${id}`,
    topic: 'Planets',
    theme: 'SPACE',
    difficulty: 'EASY',
    audience: 'KIDS',
    language: 'EN',
    questionCount: questions.length,
    timePerQuestion: 45,
    source: 'TOPIC',
    createdAt,
    bestAccuracy: null,
    questions,
  };
}

function summary(id: string, createdAt: string): QuizSummary {
  return toQuizSummary(quizDetail(id, createdAt, []));
}

describe('quizzes reducer', () => {
  it('keeps the newest quiz first', () => {
    const older = summary('older', '2026-01-01T10:00:00.000Z');
    const newer = summary('newer', '2026-02-01T10:00:00.000Z');

    const state = reducer(initialQuizzesState, QuizzesActions.loaded({ quizzes: [older, newer] }));

    expect(state.ids).toEqual(['newer', 'older']);
    expect(state.loaded).toBe(true);
  });

  it('adds a created quiz to the list and remembers it for the create page', () => {
    const quiz = quizDetail('new', '2026-03-01T10:00:00.000Z', [
      question('q1', 1),
      question('q2', 2),
    ]);

    const state = reducer(initialQuizzesState, QuizzesActions.created({ quiz }));

    expect(state.entities['new']?.questionCount).toBe(2);
    expect(state.created).toBe(quiz);
    expect(state.creating).toBe(false);
  });

  it('updates the detail and the question count when a question is deleted', () => {
    const quiz = quizDetail('quiz', '2026-03-01T10:00:00.000Z', [
      question('q1', 1),
      question('q2', 2),
      question('q3', 3),
      question('q4', 4),
    ]);
    const withDetail: QuizzesState = reducer(
      reducer(initialQuizzesState, QuizzesActions.created({ quiz })),
      QuizzesActions.detailLoaded({ quiz }),
    );

    const state = reducer(
      withDetail,
      QuizzesActions.questionDeleted({ quizId: 'quiz', questionId: 'q2' }),
    );

    expect(state.detail?.questions.map((q) => q.id)).toEqual(['q1', 'q3', 'q4']);
    expect(state.entities['quiz']?.questionCount).toBe(3);
  });

  it('removes a deleted quiz and clears its detail', () => {
    const quiz = quizDetail('gone', '2026-03-01T10:00:00.000Z', [question('q1', 1)]);
    const withDetail = reducer(
      reducer(initialQuizzesState, QuizzesActions.created({ quiz })),
      QuizzesActions.detailLoaded({ quiz }),
    );

    const state = reducer(withDetail, QuizzesActions.deleted({ quizId: 'gone' }));

    expect(state.ids).toEqual([]);
    expect(state.detail).toBeNull();
  });
});
