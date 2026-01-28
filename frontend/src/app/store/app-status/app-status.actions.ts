import { createAction, props } from '@ngrx/store';

export const loadHealth = createAction('[App Status] Load Health');

export const loadHealthSuccess = createAction(
  '[App Status] Load Health Success',
  props<{ serverTime: string }>()
);

export const loadHealthFailure = createAction(
  '[App Status] Load Health Failure',
  props<{ error: string }>()
);
