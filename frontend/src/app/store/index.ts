import { AppStatusState } from './app-status/app-status.state';
import { GameState } from './game/game.state';
import { QuizState } from './quiz/quiz.state';

export interface AppState {
  appStatus: AppStatusState;
  game: GameState;
  quiz: QuizState;
}

export * from './app-status';
export * from './game';
export * from './quiz';
