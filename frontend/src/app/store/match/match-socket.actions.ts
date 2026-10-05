import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { MatchResult, MatchView } from '../../core/models/match.model';
import {
  BoostUsedEvent,
  MatchQuestionEvent,
  RoundResultEvent,
  SabotageBlockedEvent,
  SabotagedEvent,
} from '../../core/models/realtime-events.model';

export const MatchSocketActions = createActionGroup({
  source: 'Match Socket',
  events: {
    'Lobby Updated': props<{ match: MatchView }>(),
    'Countdown Started': emptyProps(),
    'Question Received': props<{ question: MatchQuestionEvent; deadlineAt: number }>(),
    'Player Answered': props<{ userId: string }>(),
    'Deadline Changed': props<{ deadlineAt: number }>(),
    'Round Finished': props<{ round: RoundResultEvent }>(),
    'Waiting For Next': props<{ userIds: string[] }>(),
    'Boost Used': props<{ boost: BoostUsedEvent; deadlineAt: number | null }>(),
    'Player Locked Out': props<{ index: number; userId: string }>(),
    'Options Scrambled': props<{ index: number; options: string[] }>(),
    'Player Sabotaged': props<{ sabotage: SabotagedEvent; landedAt: number }>(),
    'Sabotage Blocked': props<{ block: SabotageBlockedEvent; landedAt: number }>(),
    'Second Chance Offered': props<{ index: number; wrongOption: number }>(),
    Finished: props<{ result: MatchResult }>(),
    'Player Left': props<{ userId: string }>(),
    'Error Received': props<{ error: string }>(),
  },
});
