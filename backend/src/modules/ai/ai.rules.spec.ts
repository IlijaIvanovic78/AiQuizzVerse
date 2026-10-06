import { GeneratedQuestion } from './ai.schemas';
import {
  cleanKeyPoints,
  cleanQuestions,
  hasEnoughQuestions,
  hintRevealsAnswer,
  specificStepTitle,
  spreadCorrectAnswers,
} from './ai.rules';

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

describe('cleanQuestions', () => {
  it('trims the text of every field', () => {
    const question = makeQuestion({
      text: '  Which planet is closest to the Sun?  ',
      options: [' Mercury ', 'Venus', 'Earth ', 'Mars'],
      hint: ' It is the smallest planet. ',
    });

    const [result] = cleanQuestions([question], 1);

    expect(result.text).toBe('Which planet is closest to the Sun?');
    expect(result.hint).toBe('It is the smallest planet.');
    expect(result.options).toEqual(['Mercury', 'Venus', 'Earth', 'Mars']);
  });

  it('drops questions with broken options, answers or hints', () => {
    const broken = [
      makeQuestion({ options: ['Mercury', 'mercury', 'Earth', 'Mars'] }),
      makeQuestion({ options: ['Mercury', ' ', 'Earth', 'Mars'] }),
      makeQuestion({ correctIndex: 4 }),
      makeQuestion({ hint: '' }),
      makeQuestion({ hint: 'Its name is Mercury.' }),
    ];
    const good = [makeQuestion(), makeQuestion(), makeQuestion()];

    expect(cleanQuestions([...broken, ...good], 5)).toHaveLength(3);
  });

  it('cuts extra questions down to the requested count', () => {
    const questions = Array.from({ length: 7 }, () => makeQuestion());

    expect(cleanQuestions(questions, 5)).toHaveLength(5);
  });
});

describe('hasEnoughQuestions', () => {
  it('allows up to two requested questions to be missing', () => {
    expect(hasEnoughQuestions(5, 7)).toBe(true);
    expect(hasEnoughQuestions(4, 7)).toBe(false);
  });

  it('never accepts fewer than three questions', () => {
    expect(hasEnoughQuestions(2, 4)).toBe(false);
    expect(hasEnoughQuestions(3, 4)).toBe(true);
  });
});

describe('spreadCorrectAnswers', () => {
  it('keeps the correct answer after shuffling the options', () => {
    const [question] = spreadCorrectAnswers([makeQuestion()]);

    expect(correctAnswer(question)).toBe('Mercury');
    expect([...question.options].sort()).toEqual(['Earth', 'Mars', 'Mercury', 'Venus']);
  });

  it('spreads correct answers over all four positions', () => {
    const questions = Array.from({ length: 8 }, () => makeQuestion());

    const positions = spreadCorrectAnswers(questions).map((question) => question.correctIndex);

    expect([...positions].sort()).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
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
  it('trims the points and drops empty ones', () => {
    const points = [' One ', '', 'Two', '   ', 'Three'];

    expect(cleanKeyPoints(points)).toEqual(['One', 'Two', 'Three']);
  });
});

describe('specificStepTitle', () => {
  it('keeps a title that is specific to the topic', () => {
    expect(specificStepTitle(' Meet the dinosaurs ', 'First steps', 'Dinosaurs')).toBe(
      'Meet the dinosaurs',
    );
  });

  it('adds the topic to a title that only repeats the step label', () => {
    expect(specificStepTitle('First steps', 'First steps', 'Dinosaurs')).toBe(
      'First steps: Dinosaurs',
    );
    expect(specificStepTitle('master CHALLENGE!', 'Master challenge', 'Dinosaurs')).toBe(
      'Master challenge: Dinosaurs',
    );
  });

  it('uses the label and the topic when the title is empty', () => {
    expect(specificStepTitle('  ', 'Key facts', 'Volcanoes')).toBe('Key facts: Volcanoes');
  });
});
