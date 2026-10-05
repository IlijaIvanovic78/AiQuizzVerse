import { HttpErrorResponse } from '@angular/common/http';
import { readErrorMessage } from './api-error';

describe('readErrorMessage', () => {
  it('uses the message sent by the server', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Play quizzes to earn more coins.' },
    });

    expect(readErrorMessage(error)).toBe('Play quizzes to earn more coins.');
  });

  it('uses the first validation message', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['title must be longer', 'options must be unique'] },
    });

    expect(readErrorMessage(error)).toBe('title must be longer');
  });

  it('explains when the server cannot be reached', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(readErrorMessage(error)).toBe("Can't reach the server. Check your connection.");
  });

  it('falls back to a friendly message for anything else', () => {
    expect(readErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
