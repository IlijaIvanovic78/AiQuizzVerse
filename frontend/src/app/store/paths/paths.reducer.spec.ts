import { PathsActions } from './paths.actions';
import { pathsFeature } from './paths.reducer';

const { reducer } = pathsFeature;

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
});
