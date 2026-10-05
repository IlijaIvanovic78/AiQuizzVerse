import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { MatchResult, MatchStatus, MatchView } from '../../core/models/match.model';
import {
  BoostUsedEvent,
  MatchQuestionEvent,
  RoundResultEvent,
  SabotagedEvent,
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

// A party sabotage of the open question. landedAt is on this device's clock, like deadlineAt.
export interface SabotageHit extends SabotagedEvent {
  landedAt: number;
}

export interface MatchState {
  matchId: string | null;
  match: MatchView | null;
  phase: MatchPhase;
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
  lockedOutUserIds: string[];
  charges: Record<string, number>;
  sabotages: SabotageHit[];
  result: MatchResult | null;
  busy: boolean;
  error: string | null;
}

export const initialMatchState: MatchState = {
  matchId: null,
  match: null,
  phase: 'idle',
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
  lockedOutUserIds: [],
  charges: {},
  sabotages: [],
  result: null,
  busy: false,
  error: null,
};

export const matchFeature = createFeature({
  name: 'match',
  reducer: createReducer(
    initialMatchState,
    on(
      MatchActions.create,
      MatchActions.join,
      MatchActions.rematch,
      (state): MatchState => ({ ...state, busy: true }),
    ),
    on(MatchActions.opened, (state): MatchState => ({ ...state, busy: false })),
    on(MatchActions.failed, MatchSocketActions.errorReceived, (state, { error }) =>
      withError(state, error),
    ),
    on(
      MatchActions.entered,
      (_state, { matchId }): MatchState => ({ ...initialMatchState, matchId, phase: 'loading' }),
    ),
    on(MatchActions.left, (): MatchState => initialMatchState),
    on(MatchActions.loaded, (state, { match }) => withMatchView(state, match)),
    on(MatchSocketActions.lobbyUpdated, (state, { match }) => withLiveView(state, match)),
    on(MatchActions.resultLoaded, MatchSocketActions.finished, (state, { result }) =>
      withResult(state, result),
    ),
    on(MatchActions.answer, (state, { optionIndex }) => withMyAnswer(state, optionIndex)),
    on(
      MatchActions.answerRefused,
      (state, { index }): MatchState =>
        isOpenQuestion(state, index) ? { ...state, myAnswer: null } : state,
    ),
    on(MatchActions.next, (state): MatchState => ({ ...state, nextPressed: true })),
    on(
      MatchSocketActions.countdownStarted,
      (state): MatchState => ({ ...state, phase: 'countdown' }),
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
      MatchSocketActions.playerLockedOut,
      (state, { index, userId }): MatchState =>
        isOpenQuestion(state, index)
          ? { ...state, lockedOutUserIds: addOnce(state.lockedOutUserIds, userId) }
          : state,
    ),
    on(MatchSocketActions.optionsScrambled, (state, { index, options }) =>
      withScrambledOptions(state, index, options),
    ),
    on(MatchSocketActions.playerSabotaged, (state, { sabotage, landedAt }) =>
      withSabotage(state, sabotage, landedAt),
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
  ),
  extraSelectors: ({ selectMatch, selectRound }) => ({
    selectMode: createSelector(selectMatch, (match) => match?.mode ?? null),
    selectRoundWinnerId: createSelector(selectRound, (round) => round?.winnerUserId ?? null),
  }),
});

// Errors during play are only shown as toasts. An error while the match is still loading means
// it cannot be played, so it is kept as the reason shown on the interrupted screen.
function withError(state: MatchState, error: string): MatchState {
  if (state.phase !== 'loading') {
    return { ...state, busy: false };
  }
  return { ...state, busy: false, phase: 'interrupted', error };
}

// A slow result request can answer after the player has already moved on to another match.
function withResult(state: MatchState, result: MatchResult): MatchState {
  if (result.matchId !== state.matchId) {
    return state;
  }
  return { ...state, result, phase: 'finished', deadlineAt: null };
}

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
  const charges: Record<string, number> = {};
  match.players.forEach((player) => {
    scores[player.user.id] = player.score;
    charges[player.user.id] = player.charges;
  });
  const teamCorrect = match.players.reduce((sum, player) => sum + player.correctCount, 0);
  return {
    ...state,
    match,
    scores,
    charges,
    teamCorrect,
    phase: phaseForStatus(match.status, state.phase),
  };
}

// Only the socket view knows who is connected; the REST view reports nobody as connected.
function withLiveView(state: MatchState, match: MatchView): MatchState {
  const awayUserIds = match.players
    .filter((player) => !player.isConnected)
    .map((player) => player.user.id);
  return { ...withMatchView(state, match), leftUserIds: awayUserIds };
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
    lockedOutUserIds: [],
    sabotages: [],
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
  const charges = { ...state.charges };
  round.players.forEach((player) => {
    scores[player.userId] = player.score;
    charges[player.userId] = player.charges;
  });
  return {
    ...state,
    phase: 'reveal',
    round,
    scores,
    charges,
    teamCorrect: round.teamCorrect,
    deadlineAt: null,
    sabotages: [],
  };
}

function isOpenQuestion(state: MatchState, index: number): boolean {
  return state.phase === 'question' && state.question?.index === index;
}

// A scramble only reorders the options; the round and my pick stay as they are.
function withScrambledOptions(state: MatchState, index: number, options: string[]): MatchState {
  if (!state.question || !isOpenQuestion(state, index)) {
    return state;
  }
  return { ...state, question: { ...state.question, options } };
}

function withSabotage(state: MatchState, sabotage: SabotagedEvent, landedAt: number): MatchState {
  const charges = { ...state.charges, [sabotage.fromUserId]: sabotage.fromCharges };
  if (!isOpenQuestion(state, sabotage.index)) {
    return { ...state, charges };
  }
  return { ...state, charges, sabotages: [...state.sabotages, { ...sabotage, landedAt }] };
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

// HINT shows the owned hints plus the free hints left, which is the same count the server
// sends back as remaining in boost-used.
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
