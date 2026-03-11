import { createReducer, on } from '@ngrx/store';
import { GameActions } from './game.actions';
import { initialGameState } from './game.state';

export const gameReducer = createReducer(
  initialGameState,

  // Create Match
  on(GameActions.createMatch, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(GameActions.createMatchSuccess, (state, { match }) => ({
    ...state,
    currentMatch: match,
    mode: match.type,
    status: match.type === 'SOLO' ? 'LOBBY' as const : 'LOBBY' as const,
    loading: false,
  })),
  on(GameActions.createMatchFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Join Match
  on(GameActions.joinMatch, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(GameActions.joinMatchSuccess, (state, { match }) => ({
    ...state,
    currentMatch: match,
    mode: match.type,
    status: 'LOBBY' as const,
    loading: false,
  })),
  on(GameActions.joinMatchFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Match Started
  on(GameActions.matchStarted, (state, { event }) => ({
    ...state,
    currentQuestion: event.question,
    currentQuestionIndex: event.questionIndex,
    totalQuestions: event.totalQuestions,
    timePerQuestion: event.timePerQuestion,
    currentTurn: event.currentTurn,
    status: 'PLAYING' as const,
    lastResult: null,
    allResults: [],
    waitingForOpponent: false,
  })),

  // Answer Result (Solo / Coop)
  on(GameActions.answerResult, (state, { result }) => ({
    ...state,
    lastResult: result,
    allResults: [result],
    playerScore: state.playerScore + result.points,
    waitingForOpponent: false,
  })),

  // PvP waiting
  on(GameActions.answerReceived, (state) => ({
    ...state,
    waitingForOpponent: true,
  })),

  // Round Results (PvP)
  on(GameActions.roundResults, (state, { results, myUserId }) => {
    let playerScore = state.playerScore;
    let opponentScore = state.opponentScore;
    for (const r of results.results) {
      if (r.userId === myUserId) {
        playerScore += r.points;
      } else {
        opponentScore += r.points;
      }
    }
    const myResult = results.results.find(r => r.userId === myUserId) ?? results.results[0] ?? null;
    return {
      ...state,
      playerScore,
      opponentScore,
      lastResult: myResult,
      allResults: results.results,
      waitingForOpponent: false,
    };
  }),

  // Next Question
  on(GameActions.nextQuestion, (state, { event }) => ({
    ...state,
    currentQuestion: event.question,
    currentQuestionIndex: event.questionIndex,
    currentTurn: event.currentTurn,
    lastResult: null,
    allResults: [],
    waitingForOpponent: false,
  })),

  // Match Finished
  on(GameActions.matchFinished, (state, { match }) => ({
    ...state,
    currentMatch: match,
    status: 'FINISHED' as const,
    currentQuestion: null,
  })),

  // Player events (update match players)
  on(GameActions.playerJoined, (state, { players }) => ({
    ...state,
    currentMatch: state.currentMatch ? { ...state.currentMatch, players } : null,
  })),

  // Reset
  on(GameActions.resetGame, () => ({
    ...initialGameState,
  })),

  on(GameActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
);
