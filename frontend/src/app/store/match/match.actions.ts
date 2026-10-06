import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AttackType,
  CreateMatchRequest,
  MatchResult,
  MatchView,
} from '../../core/models/match.model';
import { MatchInvite } from '../../core/models/realtime-events.model';
import { MatchBoostType } from '../../core/models/shop.model';

export const MatchActions = createActionGroup({
  source: 'Match',
  events: {
    Create: props<{ request: CreateMatchRequest }>(),
    Join: props<{ inviteCode: string }>(),
    Rematch: props<{ matchId: string }>(),
    // The server created or joined a match for this player, so the app goes to its page.
    Ready: props<{ match: MatchView }>(),
    // The match page opened: the state starts fresh and the match is fetched.
    Entered: props<{ matchId: string }>(),
    Loaded: props<{ match: MatchView }>(),
    'Result Loaded': props<{ result: MatchResult }>(),
    // The match page closed: the socket leaves the match room.
    Left: emptyProps(),
    Start: emptyProps(),
    Answer: props<{ optionIndex: number }>(),
    'Answer Refused': props<{ index: number }>(),
    Next: emptyProps(),
    'Use Boost': props<{ boostType: MatchBoostType }>(),
    Sabotage: props<{ targetUserId: string; sabotageType: AttackType }>(),
    'Raise Shield': emptyProps(),
    'Invite Friend': props<{ matchId: string; friendId: string }>(),
    'Friend Invited': props<{ matchId: string; friendId: string }>(),
    'Invite Failed': props<{ matchId: string; friendId: string; error: string }>(),
    'Invite Received': props<{ invite: MatchInvite }>(),
    'Invite Accepted': props<{ invite: MatchInvite }>(),
    'Invite Dismissed': emptyProps(),
    Failed: props<{ error: string }>(),
  },
});
