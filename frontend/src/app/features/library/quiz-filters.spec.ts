import { QuizSummary, QuizTheme } from '../../core/models/quiz.model';
import { countByTheme, filterQuizzes, notInLibrary } from './quiz-filters';

function quiz(id: string, title: string, theme: QuizTheme, topic = title): QuizSummary {
  return {
    id,
    title,
    topic,
    theme,
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

const planets = quiz('1', 'Planets', 'SPACE');
const rockets = quiz('2', 'Rockets', 'SPACE', 'How rockets fly');
const romans = quiz('3', 'Ancient Rome', 'HISTORY');

describe('quiz filters', () => {
  it('counts quizzes per theme, most common first', () => {
    expect(countByTheme([romans, planets, rockets])).toEqual([
      { theme: 'SPACE', count: 2 },
      { theme: 'HISTORY', count: 1 },
    ]);
  });

  it('finds quizzes by title or topic, ignoring case', () => {
    expect(filterQuizzes([planets, rockets, romans], 'ROME', null)).toEqual([romans]);
    expect(filterQuizzes([planets, rockets, romans], ' fly ', null)).toEqual([rockets]);
  });

  it('keeps only the chosen theme', () => {
    expect(filterQuizzes([planets, rockets, romans], '', 'SPACE')).toEqual([planets, rockets]);
  });

  it('hides featured quizzes the player already owns', () => {
    expect(notInLibrary([planets, romans], [planets])).toEqual([romans]);
  });
});
