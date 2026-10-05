import { PathSummary } from '../../core/models/path.model';
import { newestOpenPath, sectionStatus } from './home.rules';

function path(id: string, createdAt: string, finished: boolean): PathSummary {
  return {
    id,
    topic: 'Dinosaurs',
    audience: 'KIDS',
    language: 'EN',
    stepsCleared: finished ? 5 : 2,
    totalSteps: 5,
    stars: 4,
    maxStars: 15,
    nextStep: finished
      ? null
      : { id: `${id}-step`, position: 3, title: 'How and why', quizId: 'q' },
    createdAt,
  };
}

describe('sectionStatus', () => {
  it('is ready once the list arrived, even after a later error', () => {
    expect(sectionStatus(true, 'Offline')).toBe('ready');
  });

  it('is loading until the first answer comes back', () => {
    expect(sectionStatus(false, null)).toBe('loading');
  });

  it('is failed when the first load ended with an error', () => {
    expect(sectionStatus(false, 'Offline')).toBe('failed');
  });
});

describe('newestOpenPath', () => {
  it('picks the newest path that still has a step to play', () => {
    const paths = [
      path('old-open', '2026-09-01T10:00:00Z', false),
      path('new-finished', '2026-10-01T10:00:00Z', true),
      path('new-open', '2026-09-20T10:00:00Z', false),
    ];

    expect(newestOpenPath(paths)?.id).toBe('new-open');
  });

  it('returns null when every path is finished', () => {
    expect(newestOpenPath([path('done', '2026-09-01T10:00:00Z', true)])).toBeNull();
  });
});
