import { PathDetail } from '../../core/models/path.model';
import { PathsActions } from './paths.actions';
import { pathsFeature } from './paths.reducer';

const { reducer } = pathsFeature;

const dinosaurs: PathDetail = {
  id: 'path-1',
  topic: 'Dinosaurs',
  audience: 'KIDS',
  language: 'EN',
  source: 'TOPIC',
  createdAt: '2026-10-01T10:00:00.000Z',
  steps: [],
};

describe('paths reducer', () => {
  it('keeps the status of a failed path so the create page can explain it', () => {
    const creating = reducer(
      undefined,
      PathsActions.create({ request: { topic: 'Dinosaurs', audience: 'KIDS', language: 'EN' } }),
    );

    const failed = reducer(
      creating,
      PathsActions.creationFailed({ error: 'The quiz master needs a rest.', status: 429 }),
    );
    const reset = reducer(failed, PathsActions.creationReset());

    expect(failed.creating).toBe(false);
    expect(failed.creationError).toEqual({ message: 'The quiz master needs a rest.', status: 429 });
    expect(failed.error).toBeNull();
    expect(reset.creationError).toBeNull();
  });

  it('drops the old copy of a path while it loads again after a match', () => {
    const shown = reducer(undefined, PathsActions.detailLoaded({ path: dinosaurs }));

    const state = reducer(shown, PathsActions.loadDetail({ pathId: dinosaurs.id }));

    expect(state.detail).toBeNull();
    expect(state.loading).toBe(true);
  });
});
