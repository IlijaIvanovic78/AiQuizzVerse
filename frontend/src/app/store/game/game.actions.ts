import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Match, MatchType, MatchPlayer, GameQuestion, AnswerResult, MatchStartedEvent, NextQuestionEvent, RoundResults } from '../../models';

export const GameActions = createActionGroup({
  source: 'Game',
  events: {
    // Create / Join
    'Create Match': props<{ quizId: string; matchType: MatchType; rankedContext?: { journeyId: string; stageId: string } }>(),
    'Create Match Success': props<{ match: Match }>(),
    'Create Match Failure': props<{ error: string }>(),

    'Join Match': props<{ inviteCode: string }>(),
    'Join Match Success': props<{ match: Match }>(),
    'Join Match Failure': props<{ error: string }>(),

    // Socket room
    'Join Room': props<{ matchId: string }>(),
    'Leave Room': props<{ matchId: string }>(),

    // Game lifecycle
    'Start Match': props<{ matchId: string }>(),
    'Match Started': props<{ event: MatchStartedEvent }>(),

    // Answers
    'Submit Answer': props<{ matchId: string; questionId: string; answer: number; timeMs: number }>(),
    'Answer Result': props<{ result: AnswerResult }>(),
    'Answer Received': emptyProps(), // PvP waiting for opponent
    'Round Results': props<{ results: RoundResults; myUserId: string }>(),

    // Next question
    'Next Question': props<{ event: NextQuestionEvent }>(),

    // Finish
    'Match Finished': props<{ match: Match }>(),

    // Player events
    'Player Joined': props<{ userId: string; players: MatchPlayer[] }>(),
    'Player Left': props<{ userId: string }>(),
    'Player Disconnected': props<{ userId: string }>(),

    // Cleanup
    'Reset Game': emptyProps(),
    'Clear Error': emptyProps(),
  },
});
