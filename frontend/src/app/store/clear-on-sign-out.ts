import { Action, ActionReducer } from '@ngrx/store';
import { AuthActions } from './auth/auth.actions';

const SIGN_OUT_ACTIONS: string[] = [AuthActions.logout.type, AuthActions.sessionExpired.type];

// Every slice holds the data of the player who is signed in. Signing out starts the whole store
// from its initial state, so the next player on this tab never sees the last one's paths,
// quizzes, items or invites. The auth slice then marks itself signed out in its own reducer.
export function clearOnSignOut<State>(reducer: ActionReducer<State>): ActionReducer<State> {
  return (state, action) => reducer(isSignOut(action) ? undefined : state, action);
}

function isSignOut(action: Action): boolean {
  return SIGN_OUT_ACTIONS.includes(action.type);
}
