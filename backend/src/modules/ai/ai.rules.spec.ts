import { ServiceUnavailableException } from '@nestjs/common';
import { GeneratedQuestion } from './ai.schemas';
import { cleanKeyPoints, hintRevealsAnswer, validateAndShuffle } from './ai.rules';

function makeQuestion(changes: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    text: 'Which planet is closest to the Sun?',
    options: ['Mercury', 'Venus', 'Earth', 'Mars'],
    correctIndex: 0,
    explanation: 'Mercury is the closest planet to the Sun.',
    hint: 'It is the smallest planet.',
    ...changes,
  };
}

function correctAnswer(question: GeneratedQuestion): string {
  return question.options[question.correctIndex];
}

describe('validateAndShuffle', () => {
  it('keeps the correct answer after shuffling the options', () => {
    const [question] = validateAndShuffle([makeQuestion(), makeQuestion(), makeQuestion()], 3);

    expect(correctAnswer(question)).toBe('Mercury');
    expect([...question.options].sort()).toEqual(['Earth', 'Mars', 'Mercury', 'Venus']);
  });

  it('spreads correct answers over all four positions', () => {
    const questions = Array.from({ length: 8 }, () => makeQuestion());

    const positions = validateAndShuffle(questions, 8).map((question) => question.correctIndex);

    expect([...positions].sort()).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('trims the text of every field', () => {
    const question = makeQuestion({
      text: '  Which planet is closest to the Sun?  ',
      options: [' Mercury ', 'Venus', 'Earth ', 'Mars'],
      hint: ' It is the smallest planet. ',
    });

    const [result] = validateAndShuffle([question, makeQuestion(), makeQuestion()], 3);

    expect(result.text).toBe('Which planet is closest to the Sun?');
    expect(result.hint).toBe('It is the smallest planet.');
    expect(result.options).toContain('Mercury');
    expect(result.options).toContain('Earth');
  });

  it('drops questions with broken options, answers or hints', () => {
    const broken = [
      makeQuestion({ options: ['Mercury', 'Venus', 'Earth'] }),
      makeQuestion({ options: ['Mercury', 'mercury', 'Earth', 'Mars'] }),
      makeQuestion({ options: ['Mercury', ' ', 'Earth', 'Mars'] }),
      makeQuestion({ correctIndex: 4 }),
      makeQuestion({ correctIndex: 1.5 }),
      makeQuestion({ hint: '' }),
      makeQuestion({ hint: 'Its name is Mercury.' }),
    ];
    const good = [makeQuestion(), makeQuestion(), makeQuestion()];

    expect(validateAndShuffle([...broken, ...good], 5)).toHaveLength(3);
  });

  it('cuts extra questions down to the requested count', () => {
    const questions = Array.from({ length: 7 }, () => makeQuestion());

    expect(validateAndShuffle(questions, 5)).toHaveLength(5);
  });

  it('fails when more than two requested questions are missing', () => {
    const questions = Array.from({ length: 4 }, () => makeQuestion());

    expect(() => validateAndShuffle(questions, 7)).toThrow(ServiceUnavailableException);
  });

  it('never accepts fewer than three questions', () => {
    const questions = [makeQuestion(), makeQuestion()];

    expect(() => validateAndShuffle(questions, 4)).toThrow(ServiceUnavailableException);
  });
});

describe('hintRevealsAnswer', () => {
  it('finds the answer inside the hint, ignoring case and punctuation', () => {
    expect(hintRevealsAnswer('The answer starts with "Mer"... it is mercury!', 'Mercury')).toBe(
      true,
    );
    expect(hintRevealsAnswer('Spiders have 8 legs.', '8')).toBe(true);
    expect(hintRevealsAnswer('Najduža reka je Dunav.', 'Dunav')).toBe(true);
  });

  it('ignores answers that only appear inside a longer word', () => {
    expect(hintRevealsAnswer('Think of a reddish rock.', 'Red')).toBe(false);
    expect(hintRevealsAnswer('It is the 1st planet.', '1')).toBe(false);
  });

  it('matches multi-word answers only as a whole', () => {
    expect(hintRevealsAnswer('It is a star, not a planet.', 'A planet')).toBe(true);
    expect(hintRevealsAnswer('This planet is very hot.', 'A planet')).toBe(false);
  });
});

describe('cleanKeyPoints', () => {
  it('trims, drops empty points and keeps at most five', () => {
    const points = [' One ', '', 'Two', 'Three', '   ', 'Four', 'Five', 'Six'];

    expect(cleanKeyPoints(points)).toEqual(['One', 'Two', 'Three', 'Four', 'Five']);
  });
});
