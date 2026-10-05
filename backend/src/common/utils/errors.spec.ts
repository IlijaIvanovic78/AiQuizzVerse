import { errorStack } from './errors';

describe('errorStack', () => {
  it('returns the stack of an Error', () => {
    const error = new Error('Database is down');

    expect(errorStack(error)).toBe(error.stack);
  });

  it('turns anything else that was thrown into text', () => {
    expect(errorStack('timeout')).toBe('timeout');
  });
});
