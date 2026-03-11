import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GameState } from './game.state';

export const selectGameState = createFeatureSelector<GameState>('game');

export const selectCurrentMatch = createSelector(selectGameState, (s) => s.currentMatch);
export const selectCurrentQuestion = createSelector(selectGameState, (s) => s.currentQuestion);
export const selectQuestionIndex = createSelector(selectGameState, (s) => s.currentQuestionIndex);
export const selectTotalQuestions = createSelector(selectGameState, (s) => s.totalQuestions);
export const selectTimePerQuestion = createSelector(selectGameState, (s) => s.timePerQuestion);
export const selectPlayerScore = createSelector(selectGameState, (s) => s.playerScore);
export const selectOpponentScore = createSelector(selectGameState, (s) => s.opponentScore);
export const selectGameMode = createSelector(selectGameState, (s) => s.mode);
export const selectGameStatus = createSelector(selectGameState, (s) => s.status);
export const selectLastResult = createSelector(selectGameState, (s) => s.lastResult);
export const selectCurrentTurn = createSelector(selectGameState, (s) => s.currentTurn);
export const selectGameLoading = createSelector(selectGameState, (s) => s.loading);
export const selectGameError = createSelector(selectGameState, (s) => s.error);

export const selectInviteCode = createSelector(
  selectCurrentMatch,
  (match) => match?.inviteCode ?? null
);

export const selectMatchPlayers = createSelector(
  selectCurrentMatch,
  (match) => match?.players ?? []
);

export const selectAllResults = createSelector(selectGameState, (s) => s.allResults);
export const selectWaitingForOpponent = createSelector(selectGameState, (s) => s.waitingForOpponent);
