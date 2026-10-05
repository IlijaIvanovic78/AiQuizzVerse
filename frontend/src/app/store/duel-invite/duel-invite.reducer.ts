import { createFeature, createReducer, on } from '@ngrx/store';
import { DuelInvite } from '../../core/models/realtime-events.model';
import { MatchActions } from '../match/match.actions';

// An invite can arrive on any page, so it is kept apart from the match that is open.
interface DuelInviteState {
  invite: DuelInvite | null;
}

const initialState: DuelInviteState = {
  invite: null,
};

export const duelInviteFeature = createFeature({
  name: 'duelInvite',
  reducer: createReducer(
    initialState,
    on(MatchActions.inviteReceived, (_state, { invite }): DuelInviteState => ({ invite })),
    on(
      MatchActions.inviteAccepted,
      MatchActions.inviteDismissed,
      (): DuelInviteState => initialState,
    ),
  ),
});
