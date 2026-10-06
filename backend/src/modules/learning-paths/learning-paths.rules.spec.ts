import { buildStepRequests, isStepUnlocked } from './learning-paths.rules';

describe('learning path rules', () => {
  const path = { topic: 'Volcanoes', audience: 'KIDS', language: 'EN' } as const;

  it('plans five steps that get harder and longer', () => {
    const requests = buildStepRequests(path);

    expect(requests.map((request) => request.position)).toEqual([1, 2, 3, 4, 5]);
    expect(requests.map((request) => request.difficulty)).toEqual([
      'EASY',
      'EASY',
      'MEDIUM',
      'MEDIUM',
      'HARD',
    ]);
    expect(requests.map((request) => request.questionCount)).toEqual([5, 5, 5, 6, 7]);
  });

  it('gives every step the topic, audience and language of the path', () => {
    const requests = buildStepRequests({ topic: null, audience: 'TEENS', language: 'SR' });

    for (const request of requests) {
      expect(request).toMatchObject({ topic: null, audience: 'TEENS', language: 'SR' });
    }
  });

  it('unlocks the first step and every step after a cleared one', () => {
    expect(isStepUnlocked(1, false)).toBe(true);
    expect(isStepUnlocked(2, true)).toBe(true);
    expect(isStepUnlocked(2, false)).toBe(false);
  });
});
