import { createFeature, createReducer, on } from '@ngrx/store';
import { MatchInvite } from '../../core/models/realtime-events.model';
import { MatchActions } from '../match/match.actions';

// An invite can arrive on any page, so it is kept apart from the match that is open.
interface MatchInviteState {
  invite: MatchInvite | null;
}

const initialState: MatchInviteState = {
  invite: null,
};

export const matchInviteFeature = createFeature({
  name: 'matchInvite',
  reducer: createReducer(
    initialState,
    on(MatchActions.inviteReceived, (_state, { invite }): MatchInviteState => ({ invite })),
    on(
      MatchActions.inviteAccepted,
      MatchActions.inviteDismissed,
      (): MatchInviteState => initialState,
    ),
  ),
});
