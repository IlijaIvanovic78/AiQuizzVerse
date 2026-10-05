import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { MatchResult, MatchStatus, MatchView } from '../../core/models/match.model';
import {
  BoostUsedEvent,
  DuelInvite,
  MatchQuestionEvent,
  RoundResultEvent,
} from '../../core/models/realtime-events.model';
import { BoostOffer, MatchBoostType } from '../../core/models/shop.model';
import { ShopActions } from '../shop/shop.actions';
import { MatchSocketActions } from './match-socket.actions';
import { MatchActions } from './match.actions';
import { FREE_HINTS_PER_MATCH, STARTING_BOOST_USES } from './match.constants';

export type MatchPhase =
  | 'idle'
  | 'loading'
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'reveal'
  | 'finished'
  | 'interrupted';

export interface MatchState {
  matchId: string | null;
  match: MatchView | null;
  phase: MatchPhase;
  countdownSeconds: number;
  question: MatchQuestionEvent | null;
  deadlineAt: number | null;
  myAnswer: number | null;
  answeredUserIds: string[];
  round: RoundResultEvent | null;
  waitingForUserIds: string[];
  nextPressed: boolean;
  scores: Record<string, number>;
  teamCorrect: number;
  freeHintsLeft: number;
  boostUses: Record<MatchBoostType, number>;
  boostsUsedThisRound: MatchBoostType[];
  eliminatedOptions: number[];
  hint: string | null;
  leftUserIds: string[];
  result: MatchResult | null;
  busy: boolean;
  error: string | null;
  invite: DuelInvite | null;
}

export const initialMatchState: MatchState = {
  matchId: null,
  match: null,
  phase: 'idle',
  countdownSeconds: 0,
  question: null,
  deadlineAt: null,
  myAnswer: null,
  answeredUserIds: [],
  round: null,
  waitingForUserIds: [],
  nextPressed: false,
  scores: {},
  teamCorrect: 0,
  freeHintsLeft: FREE_HINTS_PER_MATCH,
  boostUses: STARTING_BOOST_USES,
  boostsUsedThisRound: [],
  eliminatedOptions: [],
  hint: null,
  leftUserIds: [],
  result: null,
  busy: false,
  error: null,
  invite: null,
};

export const matchFeature = createFeature({
  name: 'match',
  reducer: createReducer(
    initialMatchState,
    on(
      MatchActions.create,
      MatchActions.join,
      MatchActions.rematch,
      (state): MatchState => ({ ...state, busy: true, error: null }),
    ),
    on(MatchActions.opened, (state): MatchState => ({ ...state, busy: false })),
    on(
      MatchActions.failed,
      MatchSocketActions.errorReceived,
      (state, { error }): MatchState => ({
        ...state,
        busy: false,
        error,
        phase: state.phase === 'loading' ? 'interrupted' : state.phase,
      }),
    ),
    on(
      MatchActions.entered,
      (state, { matchId }): MatchState => ({
        ...initialMatchState,
        invite: state.invite,
        matchId,
        phase: 'loading',
      }),
    ),
    on(MatchActions.left, (state): MatchState => ({ ...initialMatchState, invite: state.invite })),
    on(MatchActions.loaded, MatchSocketActions.lobbyUpdated, (state, { match }) =>
      withMatchView(state, match),
    ),
    on(
      MatchActions.resultLoaded,
      MatchSocketActions.finished,
      (state, { result }): MatchState => ({
        ...state,
        result,
        phase: 'finished',
        deadlineAt: null,
      }),
    ),
    on(MatchActions.answer, (state, { optionIndex }) => withMyAnswer(state, optionIndex)),
    on(MatchActions.next, (state): MatchState => ({ ...state, nextPressed: true })),
    on(
      MatchSocketActions.countdownStarted,
      (state, { countdownSeconds }): MatchState => ({
        ...state,
        phase: 'countdown',
        countdownSeconds,
      }),
    ),
    on(MatchSocketActions.questionReceived, (state, { question, deadlineAt }) =>
      withNewQuestion(state, question, deadlineAt),
    ),
    on(
      MatchSocketActions.playerAnswered,
      (state, { userId }): MatchState => ({
        ...state,
        answeredUserIds: addOnce(state.answeredUserIds, userId),
      }),
    ),
    on(
      MatchSocketActions.deadlineChanged,
      (state, { deadlineAt }): MatchState => ({ ...state, deadlineAt }),
    ),
    on(MatchSocketActions.roundFinished, (state, { round }) => withRoundResult(state, round)),
    on(
      MatchSocketActions.waitingForNext,
      (state, { userIds }): MatchState => ({ ...state, waitingForUserIds: userIds }),
    ),
    on(MatchSocketActions.boostUsed, (state, { boost, deadlineAt }) =>
      withBoost(state, boost, deadlineAt),
    ),
    on(
      ShopActions.boostsLoaded,
      (state, { boosts }): MatchState => ({
        ...state,
        boostUses: usesFromOwned(boosts, state.freeHintsLeft),
      }),
    ),
    on(
      MatchSocketActions.playerLeft,
      (state, { userId }): MatchState => ({
        ...state,
        leftUserIds: addOnce(state.leftUserIds, userId),
      }),
    ),
    on(MatchActions.inviteReceived, (state, { invite }): MatchState => ({ ...state, invite })),
    on(
      MatchActions.inviteAccepted,
      MatchActions.inviteDismissed,
      (state): MatchState => ({ ...state, invite: null }),
    ),
  ),
  extraSelectors: ({ selectMatch }) => ({
    selectMode: createSelector(selectMatch, (match) => match?.mode ?? null),
  }),
});

function phaseForStatus(status: MatchStatus, currentPhase: MatchPhase): MatchPhase {
  if (status === 'WAITING') {
    return 'lobby';
  }
  if (status === 'ABANDONED') {
    return 'interrupted';
  }
  return currentPhase;
}

function withMatchView(state: MatchState, match: MatchView): MatchState {
  const scores: Record<string, number> = {};
  match.players.forEach((player) => (scores[player.user.id] = player.score));
  const teamCorrect = match.players.reduce((sum, player) => sum + player.correctCount, 0);
  return {
    ...state,
    match,
    scores,
    teamCorrect,
    phase: phaseForStatus(match.status, state.phase),
  };
}

function withNewQuestion(
  state: MatchState,
  question: MatchQuestionEvent,
  deadlineAt: number,
): MatchState {
  return {
    ...state,
    phase: 'question',
    question,
    deadlineAt,
    myAnswer: null,
    answeredUserIds: [],
    round: null,
    waitingForUserIds: [],
    nextPressed: false,
    boostsUsedThisRound: [],
    eliminatedOptions: [],
    hint: null,
  };
}

function withMyAnswer(state: MatchState, optionIndex: number): MatchState {
  if (state.phase !== 'question' || state.myAnswer !== null) {
    return state;
  }
  return { ...state, myAnswer: optionIndex };
}

function withRoundResult(state: MatchState, round: RoundResultEvent): MatchState {
  const scores = { ...state.scores };
  round.players.forEach((player) => (scores[player.userId] = player.score));
  return {
    ...state,
    phase: 'reveal',
    round,
    scores,
    teamCorrect: round.teamCorrect,
    deadlineAt: null,
  };
}

function withBoost(
  state: MatchState,
  boost: BoostUsedEvent,
  deadlineAt: number | null,
): MatchState {
  const usedFreeHint = boost.type === 'HINT' && state.freeHintsLeft > 0;
  return {
    ...state,
    boostsUsedThisRound: addOnce(state.boostsUsedThisRound, boost.type),
    eliminatedOptions: boost.eliminatedOptions ?? state.eliminatedOptions,
    hint: boost.hint ?? state.hint,
    deadlineAt: deadlineAt ?? state.deadlineAt,
    freeHintsLeft: usedFreeHint ? state.freeHintsLeft - 1 : state.freeHintsLeft,
    boostUses: { ...state.boostUses, [boost.type]: boost.remaining },
  };
}

// The server counts the free hints as hint uses, so the same is done before the first use.
function usesFromOwned(
  offers: BoostOffer[],
  freeHintsLeft: number,
): Record<MatchBoostType, number> {
  return {
    HINT: ownedCount(offers, 'HINT') + freeHintsLeft,
    FIFTY_FIFTY: ownedCount(offers, 'FIFTY_FIFTY'),
    EXTRA_TIME: ownedCount(offers, 'EXTRA_TIME'),
  };
}

function ownedCount(offers: BoostOffer[], type: MatchBoostType): number {
  return offers.find((offer) => offer.type === type)?.owned ?? 0;
}

function addOnce<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list : [...list, value];
}
