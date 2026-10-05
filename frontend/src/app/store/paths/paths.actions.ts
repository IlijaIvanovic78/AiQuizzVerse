import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreatePathRequest, PathDetail, PathSummary } from '../../core/models/path.model';

export const PathsActions = createActionGroup({
  source: 'Paths',
  events: {
    Load: emptyProps(),
    Loaded: props<{ paths: PathSummary[] }>(),
    'Load Detail': props<{ pathId: string }>(),
    'Detail Loaded': props<{ path: PathDetail }>(),
    Create: props<{ request: CreatePathRequest }>(),
    Created: props<{ path: PathDetail }>(),
    'Creation Reset': emptyProps(),
    Delete: props<{ pathId: string }>(),
    Deleted: props<{ pathId: string }>(),
    Failed: props<{ error: string }>(),
  },
});
