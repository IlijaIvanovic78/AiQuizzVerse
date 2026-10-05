import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AttackType,
  CreateMatchRequest,
  MatchResult,
  MatchView,
} from '../../core/models/match.model';
import { DuelInvite } from '../../core/models/realtime-events.model';
import { MatchBoostType } from '../../core/models/shop.model';

export const MatchActions = createActionGroup({
  source: 'Match',
  events: {
    Create: props<{ request: CreateMatchRequest }>(),
    Join: props<{ inviteCode: string }>(),
    Rematch: props<{ matchId: string }>(),
    Opened: props<{ match: MatchView }>(),
    Entered: props<{ matchId: string }>(),
    Loaded: props<{ match: MatchView }>(),
    'Result Loaded': props<{ result: MatchResult }>(),
    Left: emptyProps(),
    Start: emptyProps(),
    Answer: props<{ optionIndex: number }>(),
    'Answer Refused': props<{ index: number }>(),
    Next: emptyProps(),
    'Use Boost': props<{ boostType: MatchBoostType }>(),
    Sabotage: props<{ targetUserId: string; sabotageType: AttackType }>(),
    'Raise Shield': emptyProps(),
    'Invite Friend': props<{ matchId: string; friendId: string }>(),
    'Friend Invited': emptyProps(),
    'Invite Received': props<{ invite: DuelInvite }>(),
    'Invite Accepted': props<{ invite: DuelInvite }>(),
    'Invite Dismissed': emptyProps(),
    Failed: props<{ error: string }>(),
  },
});
