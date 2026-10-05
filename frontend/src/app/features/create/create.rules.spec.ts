import {
  creationErrorTitle,
  pathProgressFraction,
  pdfProblem,
  quizProgressFraction,
  quizStepStates,
} from './create.rules';

describe('create rules', () => {
  it('accepts a small PDF', () => {
    expect(pdfProblem({ name: 'cells.pdf', type: 'application/pdf', size: 2_000_000 })).toBeNull();
  });

  it('explains why a file cannot be uploaded', () => {
    const picture = { name: 'cat.png', type: 'image/png', size: 1000 };
    const hugePdf = { name: 'book.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 };

    expect(pdfProblem(picture)).toContain('not a PDF');
    expect(pdfProblem(hugePdf)).toContain('bigger than 10 MB');
  });

  it('lights up the quiz steps the server already reported', () => {
    const states = quizStepStates({ step: 'reviewing', done: 0, total: 1 });

    expect(states).toEqual(['done', 'done', 'active', 'waiting']);
    expect(quizProgressFraction(states)).toBe(2.5 / 4);
  });

  it('starts on the first step before any progress arrives', () => {
    expect(quizStepStates(null)).toEqual(['active', 'waiting', 'waiting', 'waiting']);
  });

  it('marks every step done once the quiz is saved', () => {
    const states = quizStepStates({ step: 'saving', done: 1, total: 1 });

    expect(states).toEqual(['done', 'done', 'done', 'done']);
    expect(quizProgressFraction(states)).toBe(1);
  });

  it('walks one fifth of the road for every learning path step', () => {
    expect(pathProgressFraction({ step: 'writing', done: 3, total: 5 })).toBe(0.6);
    expect(pathProgressFraction(null)).toBe(0);
  });

  it('has a friendly title for busy and tired quiz masters', () => {
    expect(creationErrorTitle(429)).toBe('The quiz master needs a rest');
    expect(creationErrorTitle(500)).toBe("That didn't work");
  });
});
