import { QuizSummary } from '../core/models/quiz.model';
import { notInLibrary } from './featured-quizzes';

function quiz(id: string, title: string): QuizSummary {
  return {
    id,
    title,
    topic: title,
    theme: 'SPACE',
    difficulty: 'EASY',
    audience: 'KIDS',
    language: 'EN',
    questionCount: 5,
    timePerQuestion: 45,
    source: 'TOPIC',
    createdAt: '2026-10-01T10:00:00.000Z',
    bestAccuracy: null,
  };
}

describe('notInLibrary', () => {
  it('hides featured quizzes the player already owns', () => {
    const planets = quiz('1', 'Planets');
    const rockets = quiz('2', 'Rockets');

    expect(notInLibrary([planets, rockets], [planets])).toEqual([rockets]);
  });
});
