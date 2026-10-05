import { createFeature, createReducer, on } from '@ngrx/store';
import { PathDetail, PathSummary } from '../../core/models/path.model';
import { PathsActions } from './paths.actions';

interface PathsState {
  paths: PathSummary[];
  loaded: boolean;
  loading: boolean;
  detail: PathDetail | null;
  creating: boolean;
  created: PathDetail | null;
  error: string | null;
}

const initialState: PathsState = {
  paths: [],
  loaded: false,
  loading: false,
  detail: null,
  creating: false,
  created: null,
  error: null,
};

export const pathsFeature = createFeature({
  name: 'paths',
  reducer: createReducer(
    initialState,
    on(PathsActions.load, (state): PathsState => ({ ...state, loading: true, error: null })),
    on(
      PathsActions.loaded,
      (state, { paths }): PathsState => ({ ...state, paths, loaded: true, loading: false }),
    ),
    on(
      PathsActions.loadDetail,
      (state, { pathId }): PathsState => ({
        ...state,
        detail: state.detail?.id === pathId ? state.detail : null,
        loading: true,
        error: null,
      }),
    ),
    on(
      PathsActions.detailLoaded,
      (state, { path }): PathsState => ({ ...state, detail: path, loading: false }),
    ),
    on(
      PathsActions.create,
      (state): PathsState => ({ ...state, creating: true, created: null, error: null }),
    ),
    on(
      PathsActions.created,
      (state, { path }): PathsState => ({ ...state, creating: false, created: path }),
    ),
    on(PathsActions.creationReset, (state): PathsState => ({ ...state, created: null })),
    on(
      PathsActions.deleted,
      (state, { pathId }): PathsState => ({
        ...state,
        paths: state.paths.filter((path) => path.id !== pathId),
        detail: state.detail?.id === pathId ? null : state.detail,
      }),
    ),
    on(
      PathsActions.failed,
      (state, { error }): PathsState => ({ ...state, loading: false, creating: false, error }),
    ),
  ),
});
